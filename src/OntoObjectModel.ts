/**
 * Type information.
 */
export interface TypeInfo {
    /**
     * Name of the type.
     */
    name: string;
    /**
     * Flag indicating the type is a reference to some of the classes in the model.
     */
    isReference: boolean;
}

/**
 * Method parameter description.
 */
export interface ParameterInfo {
    /**
     * Name of the parameter.
     */
    name: string;
    /**
     * Type information for the parameter.
     */
    typeInfo?: TypeInfo;
    /**
     * Flag indicating the parameter is a collection.
     */
    isCollection: boolean;
}

/**
 * Attribute description.
 */
export interface AttributeInfo {
    /**
     * Name of the attribute.
     */
    name: string;
    /**
     * Type of the attribute.
     */
    typeInfo?: TypeInfo;
    /**
     * Minimal count of the items in the attribute.
     */
    minItems?: number;
    /**
     * Maximal count of the items in the attribute (-1 for unlimited).
     */
    maxItems?: number;
}

/**
 * Method description.
 */
export interface MethodInfo {
    /**
     * Name of the method.
     */
    name: string;
    /**
     * Parameters of the method.
     */
    parameters?: ParameterInfo[],
    /**
     * Return type of the method.
     */
    typeInfo?: TypeInfo;
}

/**
 * Class description.
 */
export interface ClassInfo {
    /**
     * Name of the class.
     */
    name: string;
    /**
     * All the public attributes of the class.
     */
    attributes?: AttributeInfo[];
    /**
     * All the public methods of the class.
     */
    methods?: MethodInfo[];
    /**
     * Name of the superclass of the class.
     */
    superClass?: string;
    /**
     * Names of the atomic classes that this class combines.
     */
    unionClasses?: string[];
    /**
     * Names of the interfaces this class implements.
     */
    implementing?: string[];
    /**
     * Flag indicating the class cannot be directly instantiated.
     */
    isAbstract?: boolean;
    /**
     * Flag indicating the class is an interface therefore not having a method bodies.
     */
    isInterface?: boolean;
    /**
     * Name of the class this class is existentially dependent on.
     */
    existentiallyDependentOn?: string;
}

/**
 * Relation end description.
 */
export interface RelationEndInfo {
    /**
     * Name of the end field.
     */
    name: string;
    /**
     * Name of the class this end represents.
     */
    className: string;
    /**
     * Minimal count of the items in the relation end.
     */
    minItems?: number;
    /**
     * Maximal count of the items in the relation end (-1 for unlimited).
     */
    maxItems?: number;
}

/**
 * Relation description.
 */
export interface RelationInfo {
    /**
     * Name of the relation.
     */
    name: string;
    /**
     * Source end of the relation.
     */
    sourceEnd: RelationEndInfo;
    /**
     * Target end of the relation.
     */
    targetEnd: RelationEndInfo;
    /**
     * Flag indicating that the part end of the relation can be shared among multiple wholes.
     */
    isShareable?: boolean;
    /**
     * Flag indicating the part member of the relation is immutable.
     */
    isImmutablePart?: boolean;
    /**
     * Flag indicating the whole member of the relation is immutable.
     */
    isImmutableWhole?: boolean;
    /**
     * Flag indicating that the part end of the relation is essential for the whole i.e. must be set during the whole lifetime of the whole.
     */
    isEssential?: boolean;
    /**
     * Flag indicating that the part end of the relation is inseparable from the whole i.e. cannot exist without a whole.
     */
    isInseparable?: boolean;
    /**
     * Flag indicating that the part relation allows for multiple instances of the relation between the same instances of the participating entities.
     */
    allowDuplicates?: boolean;
    /**
     * Name of the relator this relation is derived from.
     */
    derivedFrom?: string;
    /**
     * Flag indicating that the part should be initialized at the same time as the whole.
     */
    isPartInitializedWithWhole?: boolean;
}

/**
 * Ontological Object model description.
 */
export interface OntoObjectModel {
    /**
     * Information about all the classes contained in the model.
     */
    classes: ClassInfo[];
    /**
     * Class-Class relations description.
     */
    relations: RelationInfo[];
}

/**
 * Dictionary of mapping from domain primitive types to platform specific ones.
 */
export interface TypeMapping {
    [typeName: string]: string;
}