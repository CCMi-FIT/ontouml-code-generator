import {parseString} from "xml2js";
import * as fs from "fs";
import * as _ from "lodash";
import * as Q from "q";
import {stringToBoolean, stringToNullableBoolean} from "../../utilities";
import {OntoUmlEntityType, OntoUmlRelationType, OntoUmlAttribute, OntoUmlRelationEnd, OntoUmlEntity, OntoUmlGeneralizationSet,
OntoUmlRelation, OntoUmlModel, OntoUmlGeneralization} from "../../OntoUml";
import {IFrontEnd} from "../../Interfaces";
import {Generalization, PackagedElement, OwnedAttribute, RefOntoUmlModel} from "./RefOntoUml";

/**
 * Class used to map RefOntoUML files to inner OntoUML representation.
 */
export default class RefOntoUmlFrontEnd implements IFrontEnd {
    /**
     * Mapping of the xml string keys to element types.
     */
    private static ontoUmlElementTypes: { [id: string]: OntoUmlEntityType } = {
        "RefOntoUML:Kind": OntoUmlEntityType.Kind,
        "RefOntoUML:SubKind": OntoUmlEntityType.SubKind,
        "RefOntoUML:Category": OntoUmlEntityType.Category,
        "RefOntoUML:Role": OntoUmlEntityType.Role,
        "RefOntoUML:Phase": OntoUmlEntityType.Phase,
        "RefOntoUML:Relator": OntoUmlEntityType.Relator,
        "RefOntoUML:Collective": OntoUmlEntityType.Collective,
        "RefOntoUML:Quantity": OntoUmlEntityType.Quantity,
        "RefOntoUML:Mode": OntoUmlEntityType.Mode,
        "RefOntoUML:RoleMixin": OntoUmlEntityType.RoleMixin,
        "RefOntoUML:Mixin": OntoUmlEntityType.Mixin,
        "RefOntoUML:PerceivableQuality": OntoUmlEntityType.PerceivableQuality,
        "RefOntoUML:NonPerceivableQuality": OntoUmlEntityType.NonPerceivableQuality,
        "RefOntoUML:NominalQuality": OntoUmlEntityType.NominalQuality
    };

    /**
     * Mapping of the xml string keys to relation types.
     */
    private static ontoUmlRelationTypes: { [id: string]: OntoUmlRelationType } = {
        "RefOntoUML:Mediation": OntoUmlRelationType.Mediation,
        "RefOntoUML:GeneralizationSet": OntoUmlRelationType.GeneralizationSet,
        "RefOntoUML:subQuantityOf": OntoUmlRelationType.SubQuantityOf,
        "RefOntoUML:memberOf": OntoUmlRelationType.MemberOf,
        "RefOntoUML:subCollectionOf": OntoUmlRelationType.SubCollectionOf,
        "RefOntoUML:MaterialAssociation": OntoUmlRelationType.Material,
        "RefOntoUML:Association": OntoUmlRelationType.Association,
        "RefOntoUML:Structuration": OntoUmlRelationType.Structuration,
        "RefOntoUML:Characterization": OntoUmlRelationType.Characterization,
        "RefOntoUML:componentOf": OntoUmlRelationType.ComponentOf,
        "RefOntoUML:Derivation": OntoUmlRelationType.Derivation
    };

    /**
     * Cache of elements, used while mapping.
     */
    private elementCache: { [id: string]: PackagedElement };
    
    /**
     * Cache of elements referenced by generalizations, used while mapping.
     */
    private generalizationCache: { [id: string]: PackagedElement };

    /**
     * Maps a single Generalization set.
     * @param element The element to map.
     */
    private mapGeneralizationSet = (element: PackagedElement): OntoUmlGeneralizationSet => {
        return {
            name: element.$.name,
            isComplete: stringToBoolean(element.$.isCovering),
            isDisjoint: stringToBoolean(element.$.isDisjoint),
            childrenNames: _.map(element.$.generalization.split(" "), (childId: string): string => this.generalizationCache[childId].$.name)
        };
    }

    /**
     * Maps a single relation.
     * @param element The element to map.
     * @param type Type of the relation.
     */
    private mapRelation = (element: PackagedElement, type: OntoUmlRelationType): OntoUmlRelation => {
        const mapEnd = (end: OwnedAttribute): OntoUmlRelationEnd => {
            return {
                name: end.$.name,
                maxItems: _.parseInt(end.upperValue[0].$.value),
                minItems: _.parseInt(end.lowerValue[0].$.value) || 0,
                type: this.elementCache[end.$.type].$.name
            }
        };
        const derivation: PackagedElement = _.find(this.elementCache,
            (candidate: PackagedElement): boolean => candidate.$.xsiType === "RefOntoUML:Derivation" && candidate.ownedEnd[0].$.type === element.$.xmiId);
        const derivedFrom: PackagedElement = derivation && this.elementCache[derivation.ownedEnd[1].$.type];
        return {
            type: type,
            name: element.$.name,
            sourceEnd: mapEnd(element.ownedEnd[0]),
            targetEnd: mapEnd(element.ownedEnd[1]),
            isEssential: stringToBoolean(element.$.isEssential),
            isImmutablePart: stringToBoolean(element.$.isImmutablePart),
            isImmutableWhole: stringToBoolean(element.$.isImmutableWhole),
            isInseparable: stringToBoolean(element.$.isInseparable),
            isShareable: stringToBoolean(element.$.isShareable),
            allowDuplicates: stringToNullableBoolean(element.ownedEnd[0].$.isUnique) === false || stringToNullableBoolean(element.ownedEnd[1].$.isUnique) === false,
            derivedFrom: derivedFrom && derivedFrom.$.name || null
        };
    }

    /**
     * Maps a single attribute.
     * @param attribute The attribute to map.
     */
    private mapAttribute = (attribute: OwnedAttribute): OntoUmlAttribute => {
        const typeElem: PackagedElement = this.elementCache[attribute.$.type];
        return {
            name: attribute.$.name,
            maxItems: _.parseInt(attribute.upperValue[0].$.value),
            minItems: _.parseInt(attribute.lowerValue[0].$.value),
            type: typeElem.$.name
        };
    };

    /**
     * Maps a single element.
     * @param element The element to map.
     * @param type Type of the element.
     */
    private mapElement = (element: PackagedElement, type: OntoUmlEntityType): OntoUmlEntity => {
        return {
            attributes: _.map(element.ownedAttribute, this.mapAttribute),
            generalizations: _.map(element.generalization, (gen: Generalization): OntoUmlGeneralization => ({
                predecessor: this.elementCache[gen.$.general].$.name,
                generalizationSet: gen.$.generalizationSet && this.elementCache[gen.$.generalizationSet].$.name
            })),
            name: element.$.name,
            type: type
        };
    }

    /**
     * Parses the provided file returning a promise to OntoUmlModel.
     * @param file Path to the file to parse.
     */
    parseFile = (file: string): Q.Promise<OntoUmlModel> => {
        return Q.nfcall(fs.readFile, file, "ascii")
            .then((data: string): Q.Promise<any> => Q.nfcall(parseString, data, { attrNameProcessors: [_.camelCase] }))
            .then((ontoData: any): any => {
                const contents: RefOntoUmlModel = ontoData["RefOntoUML:Model"];
                if (!contents) {
                    throw new Error("Invalid model structure");
                }
                this.elementCache = {};
                this.generalizationCache = {};
                _.each(contents.packagedElement, (item: PackagedElement): void => {
                    if (!this.elementCache[item.$.xmiId]) {
                        this.elementCache[item.$.xmiId] = item;
                    }
                    if (item.generalization) {
                        _.each(item.generalization, (gen: Generalization): void => { this.generalizationCache[gen.$.xmiId] = item; });
                    }
                });
                const entities: { [name: string]: OntoUmlEntity } = {};
                const generalizationSets: { [name: string]: OntoUmlGeneralizationSet } = {};
                const relations: { [name: string]: OntoUmlRelation } = {};
                _.each(contents.packagedElement, (element: PackagedElement): void => {
                    const elementType: OntoUmlEntityType = RefOntoUmlFrontEnd.ontoUmlElementTypes[element.$.xsiType];
                    if (elementType) {
                        entities[element.$.name] = this.mapElement(element, elementType);
                        return;
                    }
                    const relationType: OntoUmlRelationType = RefOntoUmlFrontEnd.ontoUmlRelationTypes[element.$.xsiType];
                    if (relationType) {
                        if (relationType === OntoUmlRelationType.GeneralizationSet) {
                            generalizationSets[element.$.name] = this.mapGeneralizationSet(element);
                        } else {
                            relations[element.$.name] = this.mapRelation(element, relationType);
                        }
                    }
                });
                return {
                    entities: entities,
                    generalizationSets: generalizationSets,
                    relations: relations
                };
            });
    }

    /**
     * Flag indicating that the front end returns ObjectModel.
     */
    returnsOntoObjectModel: boolean = false;
}