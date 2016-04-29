import * as chai from "chai";
const expect = chai.expect;
import * as chaiAsPromised from "chai-as-promised";
import * as Q from "q";
import * as _ from "lodash";
import CSharpMapper from "../src/Output/CSharp/CSharpMapper";
import {OntoObjectModel, ClassInfo, TypeMapping} from "../src/OntoObjectModel";
import {ModelViewModel, RelationType, DerivedRelationViewModel} from "../src/Output/CSharp/CSharpViewModel";

chai.use(chaiAsPromised);

const mockTypeMappingHelper = { readTypeMappings: (file) => Q<TypeMapping>({ "number": "int" }) };
const mockOptions = { input: "", inputForm: "", output: "", outputForm: "" };
const canValidate = {
    name: "CanValidate",
    isInterface: true,
    methods: [
        {
            name: "IsValid",
            parameters:[
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
        }
    ]
};

describe("CSharpMapper", (): void => {
    it("maps empty model with namespace", (done): void => {
        const mapper: CSharpMapper = new CSharpMapper(mockTypeMappingHelper);
        const input: OntoObjectModel = {
            classes: [],
            relations: []
        };
        const expected: ModelViewModel = {
            classes: [canValidate],
            namespace: "MyNamepace"
        };
        expect(mapper.modelToViewModel(input, _.merge({}, mockOptions, { configuration: { namespace: "MyNamepace" } }))).to.become(expected).notify(done);
    });

    it("maps primitive type attribute", (done): void => {
        const mapper: CSharpMapper = new CSharpMapper(mockTypeMappingHelper);
        const input: OntoObjectModel = {
            classes: [{
                name: "test",
                attributes: [{
                    name: "attr",
                    typeInfo: {
                        name: "number",
                        isReference: false
                    }
                }]
            }],
            relations: []
        };
        const expected: ModelViewModel = {
            classes: [canValidate, {
                name: "test",
                classExtends: ["test"],
                ctor: { parameters: [], relations: [], parentParameterNames: [] },
                existentiallyDependentOn: null,
                implementing: [],
                interfaceExtends: ["CanValidate"],
                isInterface: false,
                derivedRelations: [],
                methods: [],
                relations: [],
                superClass: null,
                unionClasses: [],
                isOverlapping: false,
                props: [{
                    name: "attr",
                    isCollection: false,
                    hasConstraints: false,
                    minItems: 0,
                    maxItems: null,
                    typeInfo: {
                        name: "int",
                        isReference: false,
                        isInterface: false,
                        shouldMakeNullable: true
                    }
                }]
            }]
        };
        expect(mapper.modelToViewModel(input, mockOptions)).to.become(expected).notify(done);
    });

    it("maps reference collection attribute", (done): void => {
        const mapper: CSharpMapper = new CSharpMapper(mockTypeMappingHelper);
        const input: OntoObjectModel = {
            classes: [
                {
                    name: "test",
                    attributes: [{
                        name: "attr",
                        typeInfo: {
                            name: "child",
                            isReference: true
                        },
                        maxItems: 5
                    }]
                },
                {
                    name: "child"
                }],
            relations: []
        };
        const expected: ModelViewModel = {
            classes: [canValidate,
                {
                    name: "test",
                    classExtends: ["test"],
                    ctor: { parameters: [], relations: [], parentParameterNames: [] },
                    existentiallyDependentOn: null,
                    implementing: [],
                    interfaceExtends: ["CanValidate"],
                    isInterface: false,
                    derivedRelations: [],
                    methods: [],
                    relations: [],
                    superClass: null,
                    unionClasses: [],
                    isOverlapping: false,
                    props: [{
                        name: "attr",
                        isCollection: true,
                        typeInfo: {
                            name: "child",
                            isReference: true,
                            isInterface: false,
                            shouldMakeNullable: false
                        },
                        maxItems: 5,
                        minItems: 0,
                        hasConstraints: true
                    }]
                },
                {
                    name: "child",
                    classExtends: ["child"],
                    ctor: { parameters: [], relations: [], parentParameterNames: [] },
                    existentiallyDependentOn: null,
                    implementing: [],
                    interfaceExtends: ["CanValidate"],
                    isInterface: false,
                    derivedRelations: [],
                    methods: [],
                    relations: [],
                    superClass: null,
                    unionClasses: [],
                    isOverlapping: false,
                    props: []
                }]
        };
        expect(mapper.modelToViewModel(input, mockOptions)).to.become(expected).notify(done);
    });

    it("throws on invalid reference property", (done): void => {
        const mapper: CSharpMapper = new CSharpMapper(mockTypeMappingHelper);
        const input: OntoObjectModel = {
            classes: [{
                name: "test",
                attributes: [{
                    name: "attr",
                    typeInfo: {
                        name: "notExistent",
                        isReference: true
                    },
                    maxItems: 5
                }]
            }],
            relations: []
        };
        expect(mapper.modelToViewModel(input, mockOptions)).to.be.rejected.notify(done);
    });

    it("maps void parameterless void method", (done): void => {
        const mapper: CSharpMapper = new CSharpMapper(mockTypeMappingHelper);
        const input: OntoObjectModel = {
            classes: [{
                name: "test",
                methods: [{
                    name: "method"
                }]
            }],
            relations: []
        };
        const expected: ModelViewModel = {
            classes: [canValidate, {
                name: "test",
                classExtends: ["test"],
                ctor: { parameters: [], relations: [], parentParameterNames: [] },
                existentiallyDependentOn: null,
                implementing: [],
                interfaceExtends: ["CanValidate"],
                isInterface: false,
                derivedRelations: [],
                methods: [{
                    name: "method",
                    parameters: [],
                    typeInfo: null
                }],
                relations: [],
                superClass: null,
                unionClasses: [],
                isOverlapping: false,
                props: []
            }]
        };
        expect(mapper.modelToViewModel(input, mockOptions)).to.become(expected).notify(done);
    });

    it("maps non-void method with parameter", (done): void => {
        const mapper: CSharpMapper = new CSharpMapper(mockTypeMappingHelper);
        const input: OntoObjectModel = {
            classes: [{
                name: "test",
                methods: [{
                    name: "method",
                    parameters: [{
                        name: "count",
                        typeInfo: {
                            name: "int",
                            isReference: false
                        },
                        isCollection: false
                    }],
                    typeInfo: {
                        isReference: false,
                        name: "string"
                    }
                }]
            }],
            relations: []
        };
        const expected: ModelViewModel = {
            classes: [canValidate,
                {
                    name: "test",
                    classExtends: ["test"],
                    ctor: { parameters: [], relations: [], parentParameterNames: [] },
                    existentiallyDependentOn: null,
                    implementing: [],
                    interfaceExtends: ["CanValidate"],
                    isInterface: false,
                    derivedRelations: [],
                    methods: [{
                        name: "method",
                        typeInfo: {
                            isInterface: false,
                            isReference: false,
                            name: "string",
                            shouldMakeNullable: false
                        },
                        parameters: [{
                            name: "count",
                            typeInfo: {
                                isInterface: false,
                                isReference: false,
                                name: "int",
                                shouldMakeNullable: false
                            },
                            isCollection: false
                        }]
                    }],
                    relations: [],
                    superClass: null,
                    unionClasses: [],
                    isOverlapping: false,
                    props: []
                }]
        };
        expect(mapper.modelToViewModel(input, mockOptions)).to.become(expected).notify(done);
    });

    it("maps union classes", (done): void => {
        const mapper: CSharpMapper = new CSharpMapper(mockTypeMappingHelper);
        const input: OntoObjectModel = {
            classes: [
                {
                    name: "test"
                },
                {
                    name: "child1",
                    superClass: "test"
                },
                {
                    name: "child2",
                    superClass: "test"
                },
                {
                    name: "child1child2",
                    superClass: "test",
                    unionClasses: ["child1", "child2"]
                }],
            relations: []
        };
        const expectedTest = {
            name: "test",
            classExtends: ["test"],
            ctor: { parameters: [], relations: [], parentParameterNames: [] },
            existentiallyDependentOn: null,
            implementing: [],
            interfaceExtends: ["CanValidate"],
            isInterface: false,
            derivedRelations: [],
            methods: [],
            relations: [],
            superClass: null,
            unionClasses: [],
            isOverlapping: false,
            props: []
        };
        const expectedChild1 = {
            name: "child1",
            classExtends: ["test", "child1"],
            ctor: { parameters: [], relations: [], parentParameterNames: [] },
            existentiallyDependentOn: null,
            implementing: [],
            interfaceExtends: ["CanValidate", "test"],
            isInterface: false,
            derivedRelations: [],
            methods: [],
            relations: [],
            superClass: expectedTest,
            unionClasses: [],
            isOverlapping: false,
            props: []
        };
        const expectedChild2 = {
            name: "child2",
            classExtends: ["test", "child2"],
            ctor: { parameters: [], relations: [], parentParameterNames: [] },
            existentiallyDependentOn: null,
            implementing: [],
            interfaceExtends: ["CanValidate", "test"],
            isInterface: false,
            derivedRelations: [],
            methods: [],
            relations: [],
            superClass: expectedTest,
            unionClasses: [],
            isOverlapping: false,
            props: []
        };
        const expectedChild1Child2 = {
            name: "child1child2",
            classExtends: ["test", "child1child2"],
            ctor: { parameters: [], relations: [], parentParameterNames: [] },
            existentiallyDependentOn: null,
            implementing: [],
            interfaceExtends: ["CanValidate", "child1", "child2"],
            isInterface: false,
            derivedRelations: [],
            methods: [],
            relations: [],
            superClass: expectedTest,
            unionClasses: [expectedChild1, expectedChild2],
            isOverlapping: true,
            props: []
        };
        const expected: ModelViewModel = {
            classes: [canValidate, expectedTest, expectedChild1, expectedChild2, expectedChild1Child2]
        };
        expect(mapper.modelToViewModel(input, mockOptions)).to.become(expected).notify(done);
    });

    it("maps derived relation", (done): void => {
        const mapper: CSharpMapper = new CSharpMapper(mockTypeMappingHelper);
        const input: OntoObjectModel = {
            classes: [
                {
                    name: "test"
                },
                {
                    name: "test2"
                },
                {
                    name: "relator"
                }
            ],
            relations: [
                {
                    name: "testToRealtor",
                    sourceEnd: {
                        className: "test",
                        maxItems: 1,
                        minItems: 1,
                        name: "testInstance"
                    },
                    targetEnd: {
                        className: "relator",
                        maxItems: -1,
                        minItems: 1,
                        name: "relatorInstance"
                    }
                },
                {
                    name: "test2ToRealtor",
                    sourceEnd: {
                        className: "test2",
                        maxItems: 1,
                        minItems: 1,
                        name: "test2Instance"
                    },
                    targetEnd: {
                        className: "relator",
                        maxItems: -1,
                        minItems: 1,
                        name: "relatorInstance"
                    }
                },
                {
                    name: "derived",
                    sourceEnd: {
                        className: "test",
                        maxItems: -1,
                        minItems: 1,
                        name: "testDerivedInstance"
                    },
                    targetEnd: {
                        className: "test2",
                        maxItems: -1,
                        minItems: 1,
                        name: "test2DerivedInstance"
                    },
                    derivedFrom: "relator"
                }]
        };
        const expectedDerivedRelation: DerivedRelationViewModel = {
            isManyOthers: false,
            isManyRelators: true,
            isManyResults: true,
            name: "derived",
            otherClassName: "test2",
            otherItemName: "test2DerivedInstance",
            relatorName: "relator",
            relatorOtherItemName: "test2Instance"
        };
        expect(mapper.modelToViewModel(input, mockOptions)).to.eventually.satisfy((res: ModelViewModel): boolean => {
            return _.isEqual(res.classes[1].derivedRelations[0], expectedDerivedRelation);
        }).notify(done);
    });

    it("maps aspects", (done): void => {
        const mapper: CSharpMapper = new CSharpMapper(mockTypeMappingHelper);
        const input: OntoObjectModel = {
            classes: [
                {
                    name: "test"
                },
                {
                    name: "test2",
                    existentiallyDependentOn: "test"
                }
            ],
            relations: []
        };
        const expected: ModelViewModel = {
            classes: [canValidate,
                {
                    name: "test",
                    classExtends: ["test"],
                    ctor: { parameters: [], relations: [], parentParameterNames: [] },
                    existentiallyDependentOn: null,
                    implementing: [],
                    interfaceExtends: ["CanValidate"],
                    isInterface: false,
                    derivedRelations: [],
                    methods: [],
                    relations: [],
                    superClass: null,
                    unionClasses: [],
                    isOverlapping: false,
                    props: []
                },
                {
                    name: "test2",
                    classExtends: ["test2"],
                    ctor: { parameters: [], relations: [], parentParameterNames: [] },
                    existentiallyDependentOn: "test",
                    implementing: [],
                    interfaceExtends: ["CanValidate"],
                    isInterface: false,
                    derivedRelations: [],
                    methods: [],
                    relations: [],
                    superClass: null,
                    unionClasses: [],
                    isOverlapping: false,
                    props: []
                }]
        };
        expect(mapper.modelToViewModel(input, mockOptions)).to.become(expected).notify(done);
    });

    it("maps essential relation and updates ctor parameters", (done): void => {
        const mapper: CSharpMapper = new CSharpMapper(mockTypeMappingHelper);
        const input: OntoObjectModel = {
            classes: [
                {
                    name: "test"
                },
                {
                    name: "test2"
                },
                {
                    name: "child",
                    superClass: "test"
                }],
            relations: [{
                name: "testRelation",
                isEssential: true,
                sourceEnd: {
                    className: "test",
                    maxItems: 1,
                    minItems: 0,
                    name: "testInstance"
                },
                targetEnd: {
                    className: "test2",
                    maxItems: 5,
                    minItems: 1,
                    name: "test2Instance"
                }
            }]
        };
        const expectedTargetRelation = {
            name: "testRelation",
            maxItems: 5,
            minItems: 1,
            hasConstraints: true,
            isSource: true,
            allowDuplicates: false,
            hasSet: false,
            hasUnset: false,
            isManyToMany: false,
            isOneToMany: true,
            isOneToOne: false,
            otherClassName: "test2",
            otherItemName: "test2Instance",
            shouldInvalidateOnRemove: false,
            shouldRenderField: true,
            sourceClassName: "test",
            targetClassName: "test2",
            type: RelationType.OneToMany
        };
        const expectedSourceRelation = {
            name: "testRelation",
            maxItems: 1,
            minItems: 0,
            hasConstraints: false,
            isSource: false,
            allowDuplicates: false,
            hasSet: false,
            hasUnset: false,
            isManyToMany: false,
            isOneToMany: true,
            isOneToOne: false,
            otherClassName: "test",
            otherItemName: "testInstance",
            shouldInvalidateOnRemove: false,
            shouldRenderField: true,
            sourceClassName: "test",
            targetClassName: "test2",
            type: RelationType.OneToMany
        };
        const expectedTest = {
            name: "test",
            classExtends: ["test"],
            ctor: {
                parameters: [{
                    isCollection: true,
                    name: "test2Instance",
                    typeInfo: {
                        name: "test2",
                        isInterface: false,
                        isReference: true,
                        shouldMakeNullable: false
                    }
                }],
                relations: [{
                    parameterName: "test2Instance",
                    relation: expectedSourceRelation
                }],
                parentParameterNames: []
            },
            existentiallyDependentOn: null,
            implementing: [],
            interfaceExtends: ["CanValidate"],
            isInterface: false,
            derivedRelations: [],
            methods: [],
            relations: [expectedTargetRelation],
            superClass: null,
            unionClasses: [],
            isOverlapping: false,
            props: []
        };
        const expected: ModelViewModel = {
            classes: [canValidate, expectedTest,
                {
                    name: "test2",
                    classExtends: ["test2"],
                    ctor: { parameters: [], relations: [], parentParameterNames: [] },
                    existentiallyDependentOn: null,
                    implementing: [],
                    interfaceExtends: ["CanValidate"],
                    isInterface: false,
                    derivedRelations: [],
                    methods: [],
                    relations: [expectedSourceRelation],
                    superClass: null,
                    unionClasses: [],
                    isOverlapping: false,
                    props: []
                },
                {
                    name: "child",
                    classExtends: ["test", "child"],
                    ctor: {
                        parameters: [{
                            isCollection: true,
                            name: "test2Instance",
                            typeInfo: {
                                name: "test2",
                                isInterface: false,
                                isReference: true,
                                shouldMakeNullable: false
                            }
                        }],
                        relations: [],
                        parentParameterNames: ["test2Instance"]
                    },
                    existentiallyDependentOn: null,
                    implementing: [],
                    interfaceExtends: ["CanValidate", "test"],
                    isInterface: false,
                    derivedRelations: [],
                    methods: [],
                    relations: [],
                    superClass: expectedTest,
                    unionClasses: [],
                    isOverlapping: false,
                    props: []
                },
            ]
        };
        expect(mapper.modelToViewModel(input, mockOptions)).to.become(expected).notify(done);
    });
});