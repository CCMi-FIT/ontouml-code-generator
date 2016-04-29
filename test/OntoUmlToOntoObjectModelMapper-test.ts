import * as chai from "chai";
const expect = chai.expect;
import OntoUmlToOntoObjectModelMapper from "../src/OntoUmlToOntoObjectModelMapper";
import {OntoUmlModel, OntoUmlEntityType, OntoUmlRelationType} from "../src/OntoUml";
import {OntoObjectModel, ClassInfo, RelationInfo} from "../src/OntoObjectModel";

describe("OntoUmlToOntoObjectModelMapper", (): void => {
    it("maps simple class", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "test": {
                    attributes: [],
                    generalizations: [],
                    name: "test",
                    type: OntoUmlEntityType.Kind
                }
            },
            generalizationSets: {},
            relations: {}
        };
        const expected: OntoObjectModel = {
            classes: [{
                attributes: [],
                implementing: [],
                name: "test",
                superClass: null,
                unionClasses: []
            }],
            relations: []
        };
        expect(mapper.mapToOntoObjectModel(input)).to.be.deep.equal(expected);
    });

    it("maps simple attribute", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "test": {
                    attributes: [{
                        name: "attr",
                        maxItems: 5,
                        minItems: 0,
                        type: "int"
                    }],
                    generalizations: [],
                    name: "test",
                    type: OntoUmlEntityType.Kind
                }
            },
            generalizationSets: {},
            relations: {}
        };
        const expected: OntoObjectModel = {
            classes: [{
                attributes: [{
                    name: "attr",
                    maxItems: 5,
                    minItems: 0,
                    typeInfo: {
                        name: "int",
                        isReference: false
                    }
                }],
                implementing: [],
                name: "test",
                superClass: null,
                unionClasses: []
            }],
            relations: []
        };
        expect(mapper.mapToOntoObjectModel(input)).to.be.deep.equal(expected);
    });

    it("maps simple generalization", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "parent": {
                    attributes: [],
                    generalizations: [],
                    name: "parent",
                    type: OntoUmlEntityType.Kind
                },
                "child": {
                    attributes: [],
                    generalizations: [{
                        predecessor: "parent"
                    }],
                    name: "child",
                    type: OntoUmlEntityType.SubKind
                }
            },
            generalizationSets: {},
            relations: {}
        };
        const expected: ClassInfo = {
            attributes: [],
            implementing: [],
            name: "child",
            superClass: "parent",
            unionClasses: []
        };
        const result = mapper.mapToOntoObjectModel(input);
        expect(result.classes).to.deep.include.members([expected]);
    });

    it("maps overlapping generalization", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "parent": {
                    attributes: [],
                    generalizations: [],
                    name: "parent",
                    type: OntoUmlEntityType.Kind
                },
                "child1": {
                    attributes: [],
                    generalizations: [{
                        generalizationSet: "genSet",
                        predecessor: "parent"
                    }],
                    name: "child1",
                    type: OntoUmlEntityType.SubKind
                },
                "child2": {
                    attributes: [],
                    generalizations: [{
                        generalizationSet: "genSet",
                        predecessor: "parent"
                    }],
                    name: "child2",
                    type: OntoUmlEntityType.SubKind
                }
            },
            generalizationSets: {
                "genSet": {
                    childrenNames: ["child1", "child2"],
                    isDisjoint: false,
                    name: "genSet"
                }
            },
            relations: {}
        };
        const expected: ClassInfo = {
            attributes: [],
            implementing: [],
            name: "child1child2",
            superClass: "parent",
            unionClasses: ["child1", "child2"]
        };
        const result = mapper.mapToOntoObjectModel(input);
        expect(result.classes).to.deep.include.members([expected]);
    });

    it("maps valid aspects", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "A": {
                    attributes: [],
                    generalizations: [],
                    name: "A",
                    type: OntoUmlEntityType.Kind
                },
                "B": {
                    attributes: [],
                    generalizations: [],
                    name: "B",
                    type: OntoUmlEntityType.Mode
                }
            },
            generalizationSets: {},
            relations: {
                "bA": {
                    name: "bA",
                    type: OntoUmlRelationType.Characterization,
                    sourceEnd: {
                        name: "b",
                        type: "B"
                    },
                    targetEnd: {
                        name: "a",
                        type: "A"
                    }
                }
            }
        };
        const expected: ClassInfo = {
            attributes: [],
            implementing: [],
            name: "B",
            superClass: null,
            unionClasses: [],
            existentiallyDependentOn: "A"
        };
        const result = mapper.mapToOntoObjectModel(input);
        expect(result.classes).to.deep.include.members([expected]);
    });

    it("maps valid transitive aspects", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "A": {
                    attributes: [],
                    generalizations: [],
                    name: "A",
                    type: OntoUmlEntityType.Kind
                },
                "B": {
                    attributes: [],
                    generalizations: [],
                    name: "B",
                    type: OntoUmlEntityType.Mode
                },
                "C": {
                    attributes: [],
                    generalizations: [],
                    name: "C",
                    type: OntoUmlEntityType.Mode
                }
            },
            generalizationSets: {},
            relations: {
                "bA": {
                    name: "bA",
                    type: OntoUmlRelationType.Characterization,
                    sourceEnd: {
                        name: "b",
                        type: "B"
                    },
                    targetEnd: {
                        name: "a",
                        type: "A"
                    }
                },
                "cB": {
                    name: "cB",
                    type: OntoUmlRelationType.Characterization,
                    sourceEnd: {
                        name: "c",
                        type: "C"
                    },
                    targetEnd: {
                        name: "b",
                        type: "B"
                    }
                }
            }
        };
        const expected: ClassInfo[] = [
            {
                attributes: [],
                implementing: [],
                name: "B",
                superClass: null,
                unionClasses: [],
                existentiallyDependentOn: "A"
            },
            {
                attributes: [],
                implementing: [],
                name: "C",
                superClass: null,
                unionClasses: [],
                existentiallyDependentOn: "B"
            }];
        const result = mapper.mapToOntoObjectModel(input);
        expect(result.classes).to.deep.include.members(expected);
    });

    it("throws on ivalid aspects", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "A": {
                    attributes: [],
                    generalizations: [],
                    name: "A",
                    type: OntoUmlEntityType.PerceivableQuality
                },
                "B": {
                    attributes: [],
                    generalizations: [],
                    name: "B",
                    type: OntoUmlEntityType.Mode
                }
            },
            generalizationSets: {},
            relations: {
                "aB": {
                    name: "aB",
                    type: OntoUmlRelationType.Characterization,
                    sourceEnd: {
                        name: "a",
                        type: "A"
                    },
                    targetEnd: {
                        name: "b",
                        type: "B"
                    }
                },
                "bA": {
                    name: "bA",
                    type: OntoUmlRelationType.Characterization,
                    sourceEnd: {
                        name: "b",
                        type: "B"
                    },
                    targetEnd: {
                        name: "a",
                        type: "A"
                    }
                }
            }
        };
        expect(() => mapper.mapToOntoObjectModel(input)).to.throw(Error);
    });

    it("maps simple subQuantityOf with exactly one alternative", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "A": {
                    attributes: [],
                    generalizations: [],
                    name: "A",
                    type: OntoUmlEntityType.Quantity
                },
                "B": {
                    attributes: [],
                    generalizations: [],
                    name: "B",
                    type: OntoUmlEntityType.Quantity
                }
            },
            generalizationSets: {},
            relations: {
                "bA": {
                    name: "bA",
                    type: OntoUmlRelationType.SubQuantityOf,
                    sourceEnd: {
                        name: "b",
                        type: "B"
                    },
                    targetEnd: {
                        name: "a",
                        type: "A"
                    }
                }
            }
        };
        const expected: RelationInfo = {
            name: "BSubQuantities",
            sourceEnd: { name: "B", className: "B", maxItems: -1, minItems: 0 },
            targetEnd: { name: "A", className: "A", maxItems: -1, minItems: 0 }
        };
        const result = mapper.mapToOntoObjectModel(input);
        expect(result.relations).to.deep.include.members([expected]);
    });

    it("maps subQuantityOf with more than one alternative", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "A": {
                    attributes: [],
                    generalizations: [],
                    name: "A",
                    type: OntoUmlEntityType.Quantity
                },
                "B": {
                    attributes: [],
                    generalizations: [],
                    name: "B",
                    type: OntoUmlEntityType.Quantity
                },
                "C": {
                    attributes: [],
                    generalizations: [],
                    name: "C",
                    type: OntoUmlEntityType.Quantity
                }
            },
            generalizationSets: {},
            relations: {
                "bA": {
                    name: "bA",
                    type: OntoUmlRelationType.SubQuantityOf,
                    sourceEnd: {
                        name: "b",
                        type: "B"
                    },
                    targetEnd: {
                        name: "a",
                        type: "A"
                    }
                },
                "bC": {
                    name: "bC",
                    type: OntoUmlRelationType.SubQuantityOf,
                    sourceEnd: {
                        name: "b",
                        type: "B"
                    },
                    targetEnd: {
                        name: "c",
                        type: "C"
                    }
                }
            }
        };
        const expected: RelationInfo[] = [{
            name: "BSubQuantities",
            sourceEnd: { name: "B", className: "B", maxItems: -1, minItems: 0 },
            targetEnd:
            {
                name: "BSubQuantity",
                className: "BSubQuantity",
                maxItems: -1,
                minItems: 0
            }
        }];
        const result = mapper.mapToOntoObjectModel(input);
        expect(result.relations).to.deep.include.members(expected);
    });

    it("maps roles", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "parent": {
                    attributes: [],
                    generalizations: [],
                    name: "parent",
                    type: OntoUmlEntityType.Kind
                },
                "child": {
                    attributes: [],
                    generalizations: [{
                        predecessor: "parent"
                    }],
                    name: "child",
                    type: OntoUmlEntityType.Role
                }
            },
            generalizationSets: {},
            relations: {}
        };
        const expected: OntoObjectModel = {
            classes: [
                {
                    attributes: [],
                    implementing: [],
                    name: "parent",
                    superClass: null,
                    unionClasses: []
                },
                {
                    attributes: [],
                    implementing: [],
                    name: "child",
                    superClass: null,
                    unionClasses: []
                }
            ],
            relations:
            [{
                allowDuplicates: true,
                name: "childRoles",
                isInseparable: true,
                sourceEnd: {
                    className: "parent",
                    name: "parent",
                    maxItems: 1,
                    minItems: 1
                },
                targetEnd: {
                    className: "child",
                    maxItems: -1,
                    minItems: 0,
                    name: "childRole"
                }
            }]
        };
        const result = mapper.mapToOntoObjectModel(input);
        expect(result).to.deep.equal(expected);
    });

    it("throws on ivalid roles", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "role": {
                    attributes: [],
                    generalizations: [],
                    name: "role",
                    type: OntoUmlEntityType.Role
                }
            },
            generalizationSets: {},
            relations: {}
        };
        expect(() => mapper.mapToOntoObjectModel(input)).to.throw(Error);
    });

    it("maps phases", (): void => {
        const mapper: OntoUmlToOntoObjectModelMapper = new OntoUmlToOntoObjectModelMapper();
        const input: OntoUmlModel = {
            entities: {
                "parent": {
                    attributes: [],
                    generalizations: [],
                    name: "parent",
                    type: OntoUmlEntityType.Kind
                },
                "phase1": {
                    attributes: [],
                    generalizations: [{
                        generalizationSet: "phases",
                        predecessor: "parent"
                    }],
                    name: "phase1",
                    type: OntoUmlEntityType.Phase
                },
                "phase2": {
                    attributes: [],
                    generalizations: [{
                        generalizationSet: "phases",
                        predecessor: "parent"
                    }],
                    name: "phase2",
                    type: OntoUmlEntityType.Phase
                }
            },
            generalizationSets: {
                "phases": {
                    childrenNames: ["phase1", "phase2"],
                    isDisjoint: true,
                    isComplete: true,
                    name: "phases"
                }
            },
            relations: {}
        };
        const expected: OntoObjectModel = {
            classes: [
                {
                    name: "parent",
                    attributes: [],
                    superClass: null,
                    implementing: [],
                    unionClasses: []
                },
                {
                    name: "phase1",
                    attributes: [],
                    superClass: null,
                    implementing: ["phases"],
                    unionClasses: []
                },
                {
                    name: "phase2",
                    attributes: [],
                    superClass: null,
                    implementing: ["phases"],
                    unionClasses: []
                },
                {
                    name: "phases",
                    isInterface: true
                }
            ],
            relations: [{
                name: "phases",
                isInseparable: true,
                isPartInitializedWithWhole: true,
                sourceEnd: {
                    className: "parent",
                    name: "parent",
                    maxItems: 1,
                    minItems: 1
                },
                targetEnd: {
                    className: "phases",
                    maxItems: 1,
                    minItems: 1,
                    name: "phases"
                }
            }]
        };
        const result = mapper.mapToOntoObjectModel(input);
        expect(result).to.deep.equal(expected);
    });
});