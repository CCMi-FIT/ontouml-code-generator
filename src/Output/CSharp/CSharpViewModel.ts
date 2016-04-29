/**
 * Type information.
 */
export interface TypeInfoViewModel {
    /**
    * Name of the type.
    */
    name: string;
    /**
     * Flag indicating the type is a reference to some of the classes in the model.
     */
    isReference: boolean;
    /**
     * Flag indicating the type is an interface type.
     */
    isInterface?: boolean;
    /**
     * Flag indicating the type is a value primitive type that should be made nullable.
     */
    shouldMakeNullable?: boolean;
}

/**
 * Method parameter description.
 */
export interface ParameterViewModel {
    /**
     * Name of the parameter.
     */
    name: string;
    /**
     * Type information for the parameter.
     */
    typeInfo: TypeInfoViewModel;
    /**
     * Flag indicating the parameter is a collection.
     */
    isCollection?: boolean;
}

/**
 * Property description.
 */
export interface PropertyViewModel {
    /**
     * Name of the property.
     */
    name: string;
    /**
     * Type of the property.
     */
    typeInfo: TypeInfoViewModel;
    /**
     * Flag indicating the property is a collection.
     */
    isCollection?: boolean;
    /**
     * Minimal count of the items in the property.
     */
    minItems?: number;
    /**
     * Maximal count of the items in the property (-1 for unlimited).
     */
    maxItems?: number;
    /**
     * Flag indicating the property has at least one constraint (e.g. on item counts).
     */
    hasConstraints?: boolean;
}

/**
 * Method description.
 */
export interface MethodViewModel {
    /**
     * Name of the method.
     */
    name: string;
    /**
     * Parameters of the method.
     */
    parameters?: ParameterViewModel[];
    /**
     * Return type of the method.
     */
    typeInfo?: TypeInfoViewModel;
}

/**
 * Constructor description.
 */
export interface CtorViewModel {
    /**
     * Parameters of the constructor.
     */
    parameters: ParameterViewModel[];
    /**
     * Mapping between ctor parameters and relations they cover.
     */
    relations: { parameterName: string; relation: RelationViewModel }[];
    /**
     * Names of the parent class' ctor parameters.
     */
    parentParameterNames: string[];
}

/**
 * Relation type.
 */
export enum RelationType {
    OneToOne = 1,
    OneToMany,
    ManyToMany
}

/**
 * Relation description.
 */
export interface RelationViewModel {
    /**
     * Name of the relation.
     */
    name: string;
    /**
     * Type of the relation.
     */
    type: RelationType;
    /**
     * Flag indicating the relation is 1:1.
     */
    isOneToOne: boolean;
    /**
     * Flag indicating the relation is 1:N.
     */
    isOneToMany: boolean;
    /**
     * Flag indicating the relation is M:N.
     */
    isManyToMany: boolean;
    /**
     * Flag indicating the class is at the source end.
     */
    isSource: boolean;
    /**
     * Name of the source end class.
     */
    sourceClassName: string;
    /**
     * Name of the target end class.
     */
    targetClassName: string;
    /**
     * Name of the other class (not the one containing this).
     */
    otherClassName: string;
    /**
     * Name of the other field name (not the one containing this).
     */
    otherItemName: string;
    /**
     * Flag indicating this class can set or add members of the relation.
     */
    hasSet: boolean;
    /**
     * Flag indicating this class can unset or remove members of the relation.
     */
    hasUnset: boolean;
    /**
     * Minimal count of the items in the relation end.
     */
    minItems: number;
    /**
     * Maximal count of the items in the relation end.
     */
    maxItems: number;
    /**
     * Flag indicating the relation has at least one item count constraint.
     */
    hasConstraints: boolean;
    /**
     * Flag indicating there can be multiple relations of this type between the same instances.
     */
    allowDuplicates: boolean;
    /**
     * Flag indicating the class should render the field backing the relation.
     */
    shouldRenderField: boolean;
    /**
     * Flag indicating the class should invalidate the items when they are unset or removed.
     */
    shouldInvalidateOnRemove: boolean;
}

/**
 * Derived relation description.
 */
export interface DerivedRelationViewModel {
    /**
     * Derived relation name.
     */
    name: string;
    /**
     * Name of the relator this relation is derived from.
     */
    relatorName: string;
    /**
     * Name of the other item class in the relation.
     */
    otherClassName: string;
    /**
     * Name of the other item field name in the relation.
     */
    otherItemName: string;
    /**
     * Name of the other item field name in the relator.
     */
    relatorOtherItemName: string;
    /**
     * Flag indicating there can be more than one relator related to the class.
     */
    isManyRelators: boolean;
    /**
     * Flag indicating there can be more than one other classes related to the relator.
     */
    isManyOthers: boolean;
    /**
     * Flag indicating the result will be a collection.
     */
    isManyResults: boolean;
}

/**
 * Class description.
 */
export interface ClassViewModel {
    /**
     * Name of the class.
     */
    name: string;
    /**
     * Flag indicating the class is only an interface therefore not having a method or property bodies.
     */
    isInterface?: boolean;
    /**
     * Flag indicating the class is a result of combination of other subclasses of its parent class.
     */
    isOverlapping?: boolean;
    /**
     * Name of the class this class is existentially dependent on.
     */
    existentiallyDependentOn?: string;
    /**
     * All the public properties of the class.
     */
    props?: PropertyViewModel[];
    /**
     * All the public methods of the class.
     */
    methods?: MethodViewModel[];
    /**
     * Constructor information.
     */
    ctor?: CtorViewModel;
    /**
     * Superclass of the class.
     */
    superClass?: ClassViewModel;
    /**
     * Atomic classes that this class combines.
     */
    unionClasses?: ClassViewModel[];
    /**
     * Interfaces this class implements.
     */
    implementing?: ClassViewModel[];
    /**
     * Names of the interfaces the class' interface implements.
     */
    interfaceExtends?: string[];
    /**
     * Names of the classes or interfaces the class implements.
     */
    classExtends?: string[];
    /**
     * Relations of the class.
     */
    relations?: RelationViewModel[];
    /**
     * Derived relations of the class.
     */
    derivedRelations?: DerivedRelationViewModel[];
}

/**
 * Model description.
 */
export interface ModelViewModel {
     /**
     * Information about all the classes contained in the model.
     */
    classes: ClassViewModel[];
    /**
     * Name of the namespace or package.
     */
    namespace?: string;
}