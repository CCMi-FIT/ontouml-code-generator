import * as fs from "fs";
import * as _ from "lodash";
import * as Q from "q";
import * as Interfaces from "./CSharpViewModel";
import {IOptions, ILanguageMapper} from "../../Interfaces";
import {ITypeMappingHelper} from "../../TypeMappingHelper";
import {TypeMapping, ClassInfo, TypeInfo, AttributeInfo, MethodInfo, RelationInfo, RelationEndInfo, ParameterInfo, OntoObjectModel} from "../../OntoObjectModel";

/**
 * Class used to map Object Model to CSharp language viewmodel.
 */
export default class CSharpMapper implements ILanguageMapper {
    /**
     * Cache of classes in the Object Model, used while mapping.
     */
    private classInfoCache: { [name: string]: ClassInfo };

    /**
     * Cache of already generated classes, used while mapping.
     */
    private classViewModelCache: { [name: string]: Interfaces.ClassViewModel };

    /**
     * Mappings of the primitive types used in the Object Model to the ones used in implementation code.
     */
    private primitiveTypeMapping: TypeMapping;

    /**
     * List of interfaces every class implements by default.
     */
    private defaultInterfaceNames: string[] = ["CanValidate"];

    /**
     * ITypeMappingHelper instance.
     */
    private typeMappingHelper: ITypeMappingHelper;

    /**
     * List of C# value types.
     */
    private static valueTypes: string[] = ["bool", "byte", "char", "decimal", "double", "float", "int", "long", "sbyte", "short", "uint", "ulong", "ushort"];

    constructor(typeMappingHelper: ITypeMappingHelper) {
        this.typeMappingHelper = typeMappingHelper;
    }

    /**
     * Determines if a type is a C# value type.
     * @param name Name of the type.
     */
    private isValueType = (name: string): boolean => _.includes(CSharpMapper.valueTypes, name);

    /**
     * Maps the information of a type.
     * @param typeInfo The type to map.
     */
    private mapTypeInfo = (typeInfo: TypeInfo, checkNullable: boolean = false): Interfaces.TypeInfoViewModel => {
        if (!typeInfo) {
            return null;
        }
        const name: string = !_.isEmpty(this.primitiveTypeMapping) && this.primitiveTypeMapping[typeInfo.name] || typeInfo.name;
        const result: Interfaces.TypeInfoViewModel = {
            name: name,
            isReference: typeInfo.isReference || false,
            isInterface: false,
            shouldMakeNullable: checkNullable && !typeInfo.isReference && this.isValueType(name)
        };
        if (typeInfo.isReference) {
            const ref: ClassInfo = this.classInfoCache[typeInfo.name];
            if (!ref) {
                throw new Error("Invalid reference type name");
            }
            result.name = ref.name;
            result.isInterface = ref.isInterface || false;
            result.shouldMakeNullable = false;
        }
        return result;
    }

    /**
     * Maps method to method view model.
     * @param method The method to map.
     */
    private mapMethod = (method: MethodInfo): Interfaces.MethodViewModel => ({
        name: method.name,
        typeInfo: this.mapTypeInfo(method.typeInfo),
        parameters: _.map(method.parameters, (parameter: ParameterInfo): Interfaces.ParameterViewModel => ({
            name: parameter.name,
            typeInfo: this.mapTypeInfo(parameter.typeInfo),
            isCollection: parameter.isCollection
        }))
    });

    /**
     * Maps attribute to property.
     * @param attribute The attribute to map.
     */
    private mapAttribute = (attribute: AttributeInfo): Interfaces.PropertyViewModel => ({
        name: attribute.name,
        typeInfo: this.mapTypeInfo(attribute.typeInfo, true),
        isCollection: attribute.minItems > 1 || attribute.maxItems > 1 || attribute.maxItems < 0,
        maxItems: attribute.maxItems > 0 ? attribute.maxItems : null,
        minItems: attribute.minItems || 0,
        hasConstraints: attribute.maxItems > 1 || attribute.minItems > 1
    });

    /**
     * Gets a list of names of every interface that the class' interface extends.
     * @param clazz The class to process.
     */
    private getInterfaceExtends = (clazz: ClassInfo): string[] => {
        const result: string[] = _.clone(this.defaultInterfaceNames);
        const superClass: ClassInfo = this.classInfoCache[clazz.superClass];
        const unionClasses: ClassInfo[] = _.map(clazz.unionClasses, (name: string): ClassInfo => this.classInfoCache[name]);
        const implementing: ClassInfo[] = _.map(clazz.implementing, (name: string): ClassInfo => this.classInfoCache[name]);
        // super class
        if (superClass && !(clazz.unionClasses && clazz.unionClasses.length)) {
            result.push(superClass.name);
        }
        // union classes
        result.push.apply(result, _.map(unionClasses, (impl: ClassInfo): string => impl.name));
        // interfaces from implementing
        result.push.apply(result, _.map(implementing, (impl: ClassInfo): string => impl.name));

        return _.uniq(result);
    }

    /**
     * Gets a list of names of everything (interfaces and base class) that the class itself extends.
     * @param clazz The class to process.
     */
    private getClassExtends = (clazz: ClassInfo): string[] => {
        var result: string[] = [];
        const superClass: ClassInfo = this.classInfoCache[clazz.superClass];
        // super class
        if (superClass) {
            result.push(superClass.name);
        }
        // own interface
        result.push(clazz.name);

        return _.uniq(result);
    }

    /**
     * Maps a single class.
     * @param clazz The class to process.
     */
    private mapClass = (clazz: ClassInfo): Interfaces.ClassViewModel => {
        if (!this.classViewModelCache[clazz.name]) {
            const superClass: ClassInfo = this.classInfoCache[clazz.superClass];
            const unionClasses: ClassInfo[] = _.map(clazz.unionClasses, (name: string): ClassInfo => this.classInfoCache[name]);
            const implementing: ClassInfo[] = _.map(clazz.implementing, (name: string): ClassInfo => this.classInfoCache[name]);
            this.classViewModelCache[clazz.name] = {
                name: clazz.name,
                isInterface: clazz.isInterface || false,
                isOverlapping: clazz.unionClasses && clazz.unionClasses.length > 0 || false,
                existentiallyDependentOn: clazz.existentiallyDependentOn || null,
                methods: _.map(clazz.methods, this.mapMethod),
                props: _.map(clazz.attributes, this.mapAttribute),
                ctor: { parameters: [], relations: [], parentParameterNames: [] },
                superClass: (superClass && this.mapClass(superClass)) || null,
                unionClasses: _.map(unionClasses, this.mapClass),
                implementing: _.map(implementing, this.mapClass),
                classExtends: this.getClassExtends(clazz),
                interfaceExtends: this.getInterfaceExtends(clazz),
                relations: [],
                derivedRelations: []
            };
        }
        return this.classViewModelCache[clazz.name];
    };

    /**
     * Maps a single derived relation.
     * @param relation The relation to process.
     */
    private mapDerivedRelation = (relation: RelationInfo): void => {
        const relator: Interfaces.ClassViewModel = this.classViewModelCache[relation.derivedFrom];

        const getRelationFromRelator = (className: string): Interfaces.RelationViewModel => _.find(relator.relations,
            (rel: Interfaces.RelationViewModel): boolean =>
                rel.sourceClassName === className
                || rel.targetClassName === className);

        const relationToSource: Interfaces.RelationViewModel = getRelationFromRelator(relation.sourceEnd.className);
        const relationToTarget: Interfaces.RelationViewModel = getRelationFromRelator(relation.targetEnd.className);
        const sourceClass: Interfaces.ClassViewModel = this.classViewModelCache[relation.sourceEnd.className];
        const targetClass: Interfaces.ClassViewModel = this.classViewModelCache[relation.targetEnd.className];

        const mapDerivedRelationEnd = (
            relationToThis: Interfaces.RelationViewModel,
            relationToOther: Interfaces.RelationViewModel,
            otherEnd: RelationEndInfo
        ): Interfaces.DerivedRelationViewModel => {
            const result: Interfaces.DerivedRelationViewModel = {
                name: relation.name,
                relatorName: relator.name,
                otherClassName: otherEnd.className,
                otherItemName: otherEnd.name,
                relatorOtherItemName: relationToOther.otherItemName,
                isManyRelators: relationToThis.isManyToMany || (relationToThis.isOneToMany && !relationToThis.isSource),
                isManyOthers: relationToOther.isManyToMany || (relationToOther.isOneToMany && relationToOther.isSource),
                isManyResults: false
            };

            result.isManyResults = result.isManyOthers || result.isManyRelators;
            return result;
        }

        sourceClass.derivedRelations.push(mapDerivedRelationEnd(relationToSource, relationToTarget, relation.targetEnd));
        targetClass.derivedRelations.push(mapDerivedRelationEnd(relationToTarget, relationToSource, relation.sourceEnd));
    }

    /**
     * Maps a single relation.
     * @param relation The relation to process.
     */
    private mapRelation = (relation: RelationInfo): void => {
        let sourceEnd = relation.sourceEnd;
        let targetEnd = relation.targetEnd;
        let switched = false;
        // in the case of 1:N relation, make the "1" end the source one
        if ((sourceEnd.maxItems > 1 || sourceEnd.maxItems < 0) && targetEnd.maxItems === 1) {
            sourceEnd = relation.targetEnd;
            targetEnd = relation.sourceEnd;
            switched = true;
        }
        let relationType: Interfaces.RelationType =
            (sourceEnd.maxItems === 1)
                ? ((targetEnd.maxItems === 1)
                    ? Interfaces.RelationType.OneToOne
                    : Interfaces.RelationType.OneToMany)
                : Interfaces.RelationType.ManyToMany;
        const sourceClass: Interfaces.ClassViewModel = this.classViewModelCache[sourceEnd.className];
        const targetClass: Interfaces.ClassViewModel = this.classViewModelCache[targetEnd.className];
        const isEssentialOrInseparable: boolean = relation.isEssential || relation.isInseparable;
        const isReflexive: boolean = sourceClass.name === targetClass.name;
        const isSourceAspect: boolean = Boolean(sourceClass.existentiallyDependentOn);
        const isTargetAspect: boolean = Boolean(targetClass.existentiallyDependentOn);
        const sourceRel: Interfaces.RelationViewModel = {
            name: relation.name,
            type: relationType,
            isOneToOne: relationType === Interfaces.RelationType.OneToOne,
            isOneToMany: relationType === Interfaces.RelationType.OneToMany,
            isManyToMany: relationType === Interfaces.RelationType.ManyToMany,
            isSource: true,
            sourceClassName: sourceClass.name,
            targetClassName: targetEnd.className,
            otherClassName: targetEnd.className,
            otherItemName: targetEnd.name || targetEnd.className,
            hasSet: !relation.isEssential && !(isSourceAspect && !isTargetAspect),
            hasUnset: !relation.isEssential && !(targetEnd.minItems === 1 && targetEnd.maxItems === 1) && !(isSourceAspect && !isTargetAspect),
            minItems: targetEnd.minItems,
            maxItems: targetEnd.maxItems > 0 ? targetEnd.maxItems : null,
            hasConstraints: targetEnd.maxItems > 1 || targetEnd.minItems > 0,
            allowDuplicates: relation.allowDuplicates || false,
            shouldRenderField: true,
            shouldInvalidateOnRemove: targetClass.existentiallyDependentOn === sourceClass.name || relation.isInseparable || false
        };
        sourceClass.relations.push(sourceRel);
        const targetRel: Interfaces.RelationViewModel = {
            name: relation.name,
            type: relationType,
            isOneToOne: relationType === Interfaces.RelationType.OneToOne,
            isOneToMany: relationType === Interfaces.RelationType.OneToMany,
            isManyToMany: relationType === Interfaces.RelationType.ManyToMany,
            isSource: false,
            sourceClassName: sourceEnd.className,
            targetClassName: targetClass.name,
            otherClassName: sourceEnd.className,
            otherItemName: sourceEnd.name || sourceEnd.className,
            hasSet: !isEssentialOrInseparable && !isTargetAspect, // no setter for inseparable as well
            hasUnset: !isEssentialOrInseparable && !(sourceEnd.minItems === 1 && sourceEnd.maxItems === 1) && !isTargetAspect,
            minItems: sourceEnd.minItems,
            maxItems: sourceEnd.maxItems > 0 ? sourceEnd.maxItems : null,
            hasConstraints: sourceEnd.maxItems > 1 || sourceEnd.minItems > 0,
            allowDuplicates: relation.allowDuplicates || false,
            shouldRenderField: !isReflexive, // if reflexive, then the field will be handled on the source side
            shouldInvalidateOnRemove: sourceClass.existentiallyDependentOn === targetClass.name || false
        };
        targetClass.relations.push(targetRel);

        // add ctor parameter for essentials and initialized parts
        if (relation.isEssential || relation.isPartInitializedWithWhole) {
            const whole: Interfaces.ClassViewModel = this.classViewModelCache[relation.sourceEnd.className];
            const part: Interfaces.ClassViewModel = this.classViewModelCache[relation.targetEnd.className];
            whole.ctor.parameters.push({
                name: relation.targetEnd.name,
                typeInfo: this.mapTypeInfo({ name: part.name, isReference: true }),
                isCollection: relation.targetEnd.maxItems > 1 || relation.targetEnd.maxItems < 0
            });
            whole.ctor.relations.push({
                parameterName: relation.targetEnd.name,
                relation: switched ? sourceRel : targetRel
            });
        }
    }

    /**
     * Updates the constructor parameter taking into account the constructors of base classes.
     * @param clazz The class to process.
     */
    private updateCtorParameters = (clazz: Interfaces.ClassViewModel): void => {
        if (clazz.superClass && clazz.superClass.ctor && clazz.superClass.ctor.parameters) {
            _.each(clazz.superClass.ctor.parameters, (param: Interfaces.ParameterViewModel): void => {
                clazz.ctor.parentParameterNames.push(param.name);
                clazz.ctor.parameters = _.unionBy(clazz.ctor.parameters, [param], (p: Interfaces.ParameterViewModel): string => p.name);
            });
        }
        _.each(clazz.unionClasses, (uniClazz: Interfaces.ClassViewModel): void => {
            _.each(uniClazz.ctor.parameters, (param: Interfaces.ParameterViewModel): void => {
                clazz.ctor.parameters = _.unionBy(clazz.ctor.parameters, [param], (p: Interfaces.ParameterViewModel): string => p.name);
            });
        });
    }

    /**
     * Maps the provided OntoObjectModel to CSharp viewmodel.
     * @param model The model to process.
     * @param options The options of the application.
     * @returns Promise to the mapped viewmodel.
     */
    modelToViewModel = (model: OntoObjectModel, options: IOptions): Q.Promise<any> => {
        return this.typeMappingHelper.readTypeMappings(options && options.typeMapping)
            .then((mapping: TypeMapping): Q.Promise<any> => {
                this.classInfoCache = {}
                this.primitiveTypeMapping = mapping;
                this.classViewModelCache = {
                    "CanValidate": {
                        name: "CanValidate",
                        methods: [
                            {
                                name: "IsValid",
                                parameters: [
                                    {
                                        name: "deep",
                                        isCollection: false,
                                        typeInfo: {
                                            name: "bool",
                                            isReference: false
                                        }
                                    }
                                ],
                                typeInfo: {
                                    name: "bool",
                                    isReference: false
                                }
                            },
                            {
                                name: "Invalidate"
                            }],
                        isInterface: true
                    }
                };

                _.each(model.classes, (clazz: ClassInfo): void => { this.classInfoCache[clazz.name] = clazz; });
                const result: Interfaces.ModelViewModel = {
                    classes: _.concat(_.values<Interfaces.ClassViewModel>(this.classViewModelCache), _.map(model.classes, this.mapClass))
                };

                _.each(_.filter(model.relations, (rel: RelationInfo): boolean => !rel.derivedFrom), this.mapRelation);
                _.each(_.filter(model.relations, (rel: RelationInfo): boolean => Boolean(rel.derivedFrom)), this.mapDerivedRelation);
                _.each(result.classes, this.updateCtorParameters);

                if (options && options.configuration && options.configuration["namespace"]) {
                    result.namespace = options.configuration["namespace"];
                }

                return Q(result);
            });
    }
}