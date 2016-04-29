/**
 * Type of OntoUML entity (e.g Kind).
 */
export enum OntoUmlEntityType {
    Kind = 1,
    SubKind,
    Category,
    Role,
    Phase,
    Relator,
    Collective,
    Quantity,
    Mode,
    RoleMixin,
    Mixin,
    PerceivableQuality,
    NonPerceivableQuality,
    NominalQuality
}

/**
 * Type of OntoUML relation (e.g. Material).
 */
export enum OntoUmlRelationType {
    Mediation = 1,
    GeneralizationSet,
    SubQuantityOf,
    MemberOf,
    SubCollectionOf,
    Material,
    Association,
    Structuration,
    Characterization,
    ComponentOf,
    Derivation
}

/**
 * Attribute of an OntoUML element.
 */
export interface OntoUmlAttribute {
    /**
     * Name of the attribute.
     */
    name: string;
    /**
     * Name of the attribute type.
     */
    type: string;
    /**
     * Minimal count of the items in the attribute.
     */
    minItems: number;
    /**
     * Maximal count of the items in the attribute (-1 for unlimited).
     */
    maxItems: number;
}

/**
 * End of an OntoUML relation.
 */
export interface OntoUmlRelationEnd {
    /**
     * Name of the end field.
     */
    name: string;
    /**
     * Name of the entity this end represents.
     */
    type: string;
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
 * Description of an OntoUML generalization.
 */
export interface OntoUmlGeneralization {
    /**
     * Name of the predecessor entity.
     */
    predecessor: string;
    /**
     * Name of the generalization set this generalization belongs to.
     */
    generalizationSet?: string;
}

/**
 * OntoUML element.
 */
export interface OntoUmlEntity {
    /**
     * Name of the entity.
     */
    name: string;
    /**
     * Type of the entity.
     */
    type: OntoUmlEntityType;
    /**
     * All of the element's attributes.
     */
    attributes: OntoUmlAttribute[];
    /**
     * All of the generalizations related to the element.
     */
    generalizations: OntoUmlGeneralization[];
}

/**
 * Description of an OntoUML generalization set.
 */
export interface OntoUmlGeneralizationSet {
    /**
     * Name of the generalization set.
     */
    name: string;
    /**
     * Name of all the child entities.
     */
    childrenNames: string[];
    /**
     * Flag indicating that the generalization is complete i.e. no entities other than those specified can inherit from the parent. 
     */
    isComplete?: boolean;
    /**
     * Flag indicating that the generalization is disjoint i.e. the child entities are mutualy disjoint. 
     */
    isDisjoint?: boolean;
}

/**
 * Relation between two OntoUml entities.
 */
export interface OntoUmlRelation {
    /**
     * Name of the relation.
     */
    name: string;
    /**
     * Type of the relation.
     */
    type: OntoUmlRelationType;
    /**
     * Source end of the relation.
     */
    sourceEnd: OntoUmlRelationEnd;
    /**
     * Target end of the relation.
     */
    targetEnd: OntoUmlRelationEnd;
    /**
     * Flag indicating that the part end of the relation can be shared among multiple wholes.
     */
    isShareable?: boolean;
    /**
     * Flag indicating that the part end of the relation is immutable.
     */
    isImmutablePart?: boolean;
    /**
     * Flag indicating that the whole end of the relation is immutable.
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
}

/**
 * OntoUML model.
 */
export interface OntoUmlModel {
    /**
     * All the entities in the model.
     */
    entities: { [name: string]: OntoUmlEntity };
    /**
     * All the generalization sets in the model.
     */
    generalizationSets: { [name: string]: OntoUmlGeneralizationSet };
    /**
     * All the relations in the model.
     */
    relations: { [name: string]: OntoUmlRelation }
}