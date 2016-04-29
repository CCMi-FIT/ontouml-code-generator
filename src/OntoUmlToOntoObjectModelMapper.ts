import * as _ from "lodash";
import {getAllCombinations} from "./utilities";
import {OntoUmlEntityType, OntoUmlRelationType, OntoUmlAttribute, OntoUmlRelationEnd, OntoUmlEntity, OntoUmlGeneralizationSet, OntoUmlRelation, OntoUmlModel,
    OntoUmlGeneralization} from "./OntoUml";
import {ClassInfo, AttributeInfo, OntoObjectModel, RelationInfo, RelationEndInfo} from "./OntoObjectModel";
import {isValidRoleOwner, isAspectType, isIdentityProvider, isAssociationMapped, isValidSuperclassFor} from "./OntoUmlMappingUtilities";

/**
 * Interface used when processing existential dependencies.
 */
interface ICharacterizationWrapper {
    clazz: ClassInfo;
    isAspect: boolean;
}

/**
 * Class used to map inner OntoUML representation to Object Model.
 */
export default class OntoUmlToOntoObjectModelMapper {
    /**
     * Cache of already generated classes, used when mapping.
     */
    private classLookup: { [name: string]: ClassInfo };

    /**
     * Maps a single attribute.
     * @param attribute The attribute to map.
     */
    private mapAttribute = (attribute: OntoUmlAttribute): AttributeInfo => {
        return {
            name: attribute.name,
            maxItems: attribute.maxItems,
            minItems: attribute.minItems,
            typeInfo: {
                name: attribute.type,
                isReference: false
            }
        }
    };

    /**
     * Tries to get a valid superclass.
     * @param entity The entity the superclass of which to look for.
     * @param model The already mapped model.
     */
    private getSuperClass = (entity: OntoUmlEntity, model: OntoUmlModel): string => {
        if (entity.generalizations && entity.generalizations.length) {
            const candidates: OntoUmlEntity[] = _.map(entity.generalizations, (gen: OntoUmlGeneralization): OntoUmlEntity => model.entities[gen.predecessor]);
            const validSuperClass: OntoUmlEntity = _.find(candidates, (candidate: OntoUmlEntity): boolean => isValidSuperclassFor(entity.type, candidate.type));
            return validSuperClass && validSuperClass.name || null;
        }
        return null;
    };

    /**
     * Processes all the entities and adds their basic representation as ClassInfo to the result. 
     * @param model Model to process.
     * @param classAdder Lambda that adds a new class to result.
     */
    private basicMapping = (model: OntoUmlModel, classAdder: (clazz: ClassInfo) => void): void => {
        _.each(model.entities, (item: OntoUmlEntity): void => {
            const clazz: ClassInfo = {
                name: item.name,
                attributes: _.map(item.attributes, this.mapAttribute),
                superClass: this.getSuperClass(item, model),
                implementing: [],
                unionClasses: []
            };
            const unionClasses = _(item.generalizations)
                .map((gen: OntoUmlGeneralization): OntoUmlEntity => model.entities[gen.predecessor])
                .reject((candidate: OntoUmlEntity): boolean => candidate.name === clazz.superClass || isIdentityProvider(candidate.type))
                .value();
            if (unionClasses && unionClasses.length) {
                clazz.unionClasses = _.map(unionClasses, (elem: OntoUmlEntity): string => elem.name);
            }
            classAdder(clazz);
        });
    };

    /**
     * Processes all the aspect classes and determines their existential dependencies.
     * @param model Model to process.
     */
    private processExistentialDependencies = (model: OntoUmlModel): void => {
        const queue: { clazz: ClassInfo; characterizations: ICharacterizationWrapper[] }[] = [];
        // fill the queue
        _.each(_.filter(model.entities, (entity: OntoUmlEntity): boolean => isAspectType(entity.type)),
            (entity: OntoUmlEntity): void => {
                const characterizations: OntoUmlRelation[] = _.filter(model.relations, (rel: OntoUmlRelation): boolean =>
                    rel.type === OntoUmlRelationType.Characterization && (rel.sourceEnd.type === entity.name || rel.targetEnd.type === entity.name));
                queue.push({
                    clazz: this.classLookup[entity.name],
                    characterizations: _.map(characterizations, (char: OntoUmlRelation): ICharacterizationWrapper => {
                        const name: string = char.sourceEnd.type !== entity.name ? char.sourceEnd.type : char.targetEnd.type; // get the other class name
                        return {
                            clazz: this.classLookup[name],
                            isAspect: isAspectType(_.find(model.entities, { name: name }).type)
                        }
                    })
                });
            });
        // process the queue
        let limit: number = queue.length * queue.length; // each time every item in queue is processed at least one should be solved and therefore removed, hence the limit to avoid infinite loops for invalid models
        while (queue.length && limit) {
            const { clazz, characterizations } = queue.shift();
            // try to find non-aspect charaterization
            const nonAspect: ICharacterizationWrapper = _.find(characterizations, (char: ICharacterizationWrapper): boolean => !char.isAspect);
            if (nonAspect) {
                clazz.existentiallyDependentOn = nonAspect.clazz.name;
            } else {
                // try to find an aspect that already has its dependency solved
                const finishedAspect: ICharacterizationWrapper = _.find(characterizations, (char: ICharacterizationWrapper): boolean => Boolean(char.clazz.existentiallyDependentOn));
                if (finishedAspect) {
                    clazz.existentiallyDependentOn = finishedAspect.clazz.name;
                } else {
                    queue.push({ clazz, characterizations }); // we need to try again later
                }
            }
            limit--;
        }
        if (queue.length) {
            // not all the aspects have been processed, the model is invalid
            throw new Error("Invaid aspects in model!");
        }
    };

    /**
     * Processes all the overlapping generalizations.
     * @param model Model to process.
     * @param classAdder Lambda that adds a new class to result.
     */
    private processOverlappingGeneralizations = (model: OntoUmlModel, classAdder: (clazz: ClassInfo) => void): void => {
        _.each(model.generalizationSets, (item: OntoUmlGeneralizationSet): void => {
            if (!item.isDisjoint) {
                const atomicClasses: OntoUmlEntity[] = _.map(item.childrenNames, (name: string): OntoUmlEntity => model.entities[name]);
                if (atomicClasses.length <= 1) {
                    return;
                }
                const combinations: OntoUmlEntity[][] = getAllCombinations(atomicClasses, 2);
                _.each(combinations, (combo: OntoUmlEntity[]): void =>
                    classAdder({
                        name: _.reduce(combo, (name: string, member: OntoUmlEntity): string => name + member.name, ""),
                        superClass: this.getSuperClass(combo[0], model),
                        unionClasses: _.map(combo, (member: OntoUmlEntity): string => member.name),
                        implementing: [],
                        attributes: []
                    }));
            }
        });
    };

    /**
     * Processes all the phase partitions.
     * @param model Model to process.
     * @param classAdder Lambda that adds a new class to result.
     * @param relationAdder Lambda that adds a new relation to result.
     */
    private processPhasePartitions = (model: OntoUmlModel, classAdder: (clazz: ClassInfo) => void, relationAdder: (relation: RelationInfo) => void): void => {
        _.each(_.filter(model.generalizationSets, (item: OntoUmlGeneralizationSet): boolean => item.isDisjoint && item.isComplete),
            (item: OntoUmlGeneralizationSet): void => {
                const atomicClasses: OntoUmlEntity[] = _.map(item.childrenNames, (name: string): OntoUmlEntity => model.entities[name]);
                if (_.some(atomicClasses, (elem: OntoUmlEntity): boolean => elem.type !== OntoUmlEntityType.Phase)) {
                    return; // not a phase partition as it contains at least one "non Phase"
                }
                const ownerName: string = _.find(atomicClasses[0].generalizations, (gen: OntoUmlGeneralization): boolean => gen.generalizationSet === item.name).predecessor;
                const ownerEntity: OntoUmlEntity = model.entities[ownerName];
                const ownerClass: ClassInfo = this.classLookup[ownerEntity.name];
                // add interface
                classAdder({
                    name: item.name,
                    isInterface: true,
                });
                // add phase partition interface to members
                _.each(atomicClasses, (element: OntoUmlEntity): void => {
                    const phaseClass: ClassInfo = this.classLookup[element.name];
                    phaseClass.implementing.push(item.name);
                });
                // add reference to owner
                relationAdder({
                    name: item.name,
                    isInseparable: true,
                    isPartInitializedWithWhole: true,
                    sourceEnd: {
                        className: ownerClass.name,
                        name: ownerClass.name,
                        maxItems: 1,
                        minItems: 1
                    },
                    targetEnd: {
                        className: item.name,
                        maxItems: 1,
                        minItems: 1,
                        name: item.name
                    }
                });
            });
    };

    /**
     * Processes all the roles.
     * @param model Model to process.
     * @param relationAdder Lambda that adds a new relation to result.
     */
    private processRoles = (model: OntoUmlModel, relationAdder: (relation: RelationInfo) => void): void => {
        _.each(_.filter(model.entities, (item: OntoUmlEntity): boolean => item.type === OntoUmlEntityType.Role),
            (item: OntoUmlEntity): void => {
                const ownerGen: OntoUmlGeneralization = _.find(item.generalizations, (gen: OntoUmlGeneralization): boolean => isValidRoleOwner(model.entities[gen.predecessor].type));
                if (!ownerGen) {
                    throw new Error("Role has no owner");
                }
                const ownerClass: ClassInfo = this.classLookup[ownerGen.predecessor];
                // add reference to owner
                relationAdder({
                    allowDuplicates: true,
                    name: `${item.name}Roles`,
                    isInseparable: true,
                    sourceEnd: {
                        className: ownerClass.name,
                        name: ownerClass.name,
                        maxItems: 1,
                        minItems: 1
                    },
                    targetEnd: {
                        className: item.name,
                        maxItems: -1,
                        minItems: 0,
                        name: `${item.name}Role`
                    }
                });
            });
    };

    /**
     * Processes all the relations mapped to associations.
     * @param model Model to process.
     * @param relationAdder Lambda that adds a new relation to result.
     */
    private processAssociationMappedRelations = (model: OntoUmlModel, relationAdder: (relation: RelationInfo) => void): void => {
        const mapEnd = (end: OntoUmlRelationEnd): RelationEndInfo => ({
            name: end.name,
            className: end.type,
            maxItems: end.maxItems,
            minItems: end.minItems
        });

        _.each(_.filter(model.relations, (rel: OntoUmlRelation): boolean => isAssociationMapped(rel.type)),
            (item: OntoUmlRelation): void => {
                relationAdder({
                    name: item.name,
                    sourceEnd: mapEnd(item.sourceEnd),
                    targetEnd: mapEnd(item.targetEnd),
                    isEssential: item.isEssential,
                    isImmutablePart: item.isImmutablePart,
                    isImmutableWhole: item.isImmutableWhole,
                    isInseparable: item.isInseparable,
                    isShareable: item.isShareable,
                    allowDuplicates: item.allowDuplicates,
                    derivedFrom: item.derivedFrom
                });
            });
    };

    /**
     * Processes all the subCollectionOf, subQuantityOf and memberOf relations.
     * @param model Model to process.
     * @param classAdder Lambda that adds a new class to result.
     * @param relationAdder Lambda that adds a new relation to result.
     */
    private processSpecialRelations = (model: OntoUmlModel, classAdder: (clazz: ClassInfo) => void, relationAdder: (relation: RelationInfo) => void): void => {
        const mapGroupedRelation = (type: OntoUmlRelationType, interfaceNameSuffix: string, attributeNameSuffix: string): void => {
            const groups = _.groupBy(_.filter(model.relations, (rel: OntoUmlRelation): boolean => rel.type === type),
                (item: OntoUmlRelation): string => {
                    return item.sourceEnd.type;
                });
            _.each(groups, (values: OntoUmlRelation[], key: string): void => {
                let targetTypeName: string = _.first(values).targetEnd.type;
                // no need for interface if there is only one type of subItems
                if (values.length > 1) {
                    // add interface
                    const interfaceName: string = `${key}${interfaceNameSuffix}`;
                    classAdder({
                        name: interfaceName,
                        isInterface: true
                    });
                    // add interface implementation to children
                    _.each(values, (rel: OntoUmlRelation): void => {
                        const clazz: ClassInfo = this.classLookup[rel.targetEnd.type];
                        clazz.implementing.push(interfaceName);
                    });
                    targetTypeName = interfaceName;
                }
                // add reference to owner
                const owner: ClassInfo = this.classLookup[key];
                relationAdder({
                    name: `${key}${attributeNameSuffix}`,
                    sourceEnd: {
                        name: owner.name,
                        className: owner.name,
                        maxItems: -1,
                        minItems: 0
                    },
                    targetEnd: {
                        name: targetTypeName,
                        className: targetTypeName,
                        maxItems: -1,
                        minItems: 0
                    }
                });
            });
        };
        mapGroupedRelation(OntoUmlRelationType.SubQuantityOf, "SubQuantity", "SubQuantities");
        mapGroupedRelation(OntoUmlRelationType.SubCollectionOf, "SubCollection", "SubCollections");
        mapGroupedRelation(OntoUmlRelationType.MemberOf, "Member", "Members");
    };

    /**
     * Maps the inner OntoUML represenation to ObjectModel
     * @param model The model to map.
     */
    mapToOntoObjectModel = (model: OntoUmlModel): OntoObjectModel => {
        const result: OntoObjectModel = { classes: [], relations: [] };
        this.classLookup = {};
        const getClassAdder = (addToLookup: boolean = true): (clazz: ClassInfo) => void => {
            return (clazz: ClassInfo): void => {
                result.classes.push(clazz);
                if (addToLookup) {
                    this.classLookup[clazz.name] = clazz;
                }
            };
        };
        const relationAdder = (relation: RelationInfo): void => {
            result.relations.push(relation);
        };

        this.basicMapping(model, getClassAdder());
        this.processExistentialDependencies(model);
        this.processOverlappingGeneralizations(model, getClassAdder(false));
        this.processPhasePartitions(model, getClassAdder(), relationAdder);
        this.processRoles(model, relationAdder);
        this.processAssociationMappedRelations(model, relationAdder);
        this.processSpecialRelations(model, getClassAdder(false), relationAdder);

        return result;
    };
}