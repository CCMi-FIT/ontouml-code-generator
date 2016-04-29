export interface HasXmiId {
    xmiId: string;
}

export interface HasXsiType {
    xsiType: string;
}

export interface HasName {
    name: string;
}

export interface GeneralizationAttributes extends HasXmiId {
    general: string;
    generalizationSet?: string;
}

export interface Generalization {
    $: GeneralizationAttributes;
}

export interface ValueRestrictionAttributes extends HasXmiId, HasXsiType {
    value?: string;
}

export interface ValueRestriction {
    $: ValueRestrictionAttributes;
}

export interface OwnedAttributeAttributes extends HasXmiId, HasName {
    type: string;
    isUnique: string;
}

export interface OwnedAttribute {
    $: OwnedAttributeAttributes;
    upperValue: ValueRestriction[];
    lowerValue: ValueRestriction[];
}

export interface PackagedElementAttributes extends HasXmiId, HasXsiType, HasName {
    visibility: string;
    isAbstract?: string;
    isCovering?: string;
    isDisjoint?: string;
    generalization?: string;
    isShareable?: string;
    isImmutablePart?: string;
    isImmutableWhole?: string;
    isEssential?: string;
    isInseparable?: string;
}

export interface PackagedElement {
    $: PackagedElementAttributes;
    ownedAttribute?: OwnedAttribute[];
    generalization?: Generalization[];
    ownedEnd?: OwnedAttribute[];
    // not needed as of now
    //memberEnd?: string;
    //navigableOwnedEnd?: string;
}

export interface RefOntoUmlModelAttributes extends HasXmiId, HasName {
}

export interface RefOntoUmlModel {
    $: RefOntoUmlModelAttributes;
    packagedElement: PackagedElement[];
}