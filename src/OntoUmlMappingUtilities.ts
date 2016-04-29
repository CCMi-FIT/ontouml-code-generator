import * as _ from "lodash";
import {OntoUmlEntityType, OntoUmlRelationType} from "./OntoUml";

/**
 * Dictionary specifying the valid superclass types for given OntoUML element type.
 */
let validSuperclassTypes: { [type: number]: OntoUmlEntityType[] } = {
    [OntoUmlEntityType.SubKind]: [OntoUmlEntityType.Kind, OntoUmlEntityType.SubKind],
    [OntoUmlEntityType.Role]: [OntoUmlEntityType.Role],
    [OntoUmlEntityType.Phase]: [OntoUmlEntityType.Phase]
};

/**
 * List of all the relation types tha are to be mapped using associations.
 */
let associationMappedRelationTypes: OntoUmlRelationType[] = [
    OntoUmlRelationType.Material,
    OntoUmlRelationType.Mediation,
    OntoUmlRelationType.Association,
    OntoUmlRelationType.Characterization,
    OntoUmlRelationType.ComponentOf
];

/**
 * List of all element types that provide identity (directly or indirectly).
 */
let identityProviders: OntoUmlEntityType[] = [
    OntoUmlEntityType.Kind,
    OntoUmlEntityType.SubKind,
    OntoUmlEntityType.Collective,
    OntoUmlEntityType.Quantity
];

/**
 * List of all element types that are aspects.
 */
let aspectTypes: OntoUmlEntityType[] = [
    OntoUmlEntityType.PerceivableQuality,
    OntoUmlEntityType.NonPerceivableQuality,
    OntoUmlEntityType.NominalQuality,
    OntoUmlEntityType.Mode
];

/**
 * List of all element types that can be a role owner.
 */
let validRoleOwners: OntoUmlEntityType[] = [
    OntoUmlEntityType.Kind,
    OntoUmlEntityType.SubKind,
    OntoUmlEntityType.Role,
    OntoUmlEntityType.Phase,
    OntoUmlEntityType.Collective,
    OntoUmlEntityType.Quantity,
    OntoUmlEntityType.Relator,
    OntoUmlEntityType.PerceivableQuality,
    OntoUmlEntityType.NonPerceivableQuality,
    OntoUmlEntityType.NominalQuality,
    OntoUmlEntityType.Mode
];

/**
 * Determines whether the provided type is a valid role owner.
 * @param type Type to check.
 */
export function isValidRoleOwner(type: OntoUmlEntityType): boolean {
    "use strict";
    return _.includes(validRoleOwners, type);
}

/**
 * Determines whether the provided type is an aspect type.
 * @param type Type to check.
 */
export function isAspectType(type: OntoUmlEntityType): boolean {
    "use strict";
    return _.includes(aspectTypes, type);
}

/**
 * Determines whether the provided type is an identity provider.
 * @param type Type to check.
 */
export function isIdentityProvider(type: OntoUmlEntityType): boolean {
    "use strict";
    return _.includes(identityProviders, type);
}

/**
 * Determines whether the provided relation type should be mapped using associations.
 * @param type Type to check.
 */
export function isAssociationMapped(type: OntoUmlRelationType): boolean {
    "use strict";
    return _.includes(associationMappedRelationTypes, type);
}

/**
 * Determines whether the provided superclass type is valid for the type provided.
 * @param type Type to check.
 * @param superClassType Type of the superclass to check.
 */
export function isValidSuperclassFor(type: OntoUmlEntityType, superClassType: OntoUmlEntityType): boolean {
    "use strict";
    return validSuperclassTypes[type] && _.includes(validSuperclassTypes[type], superClassType);
}