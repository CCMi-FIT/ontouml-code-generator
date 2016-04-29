import * as chai from "chai";
const expect = chai.expect;
import * as chaiAsPromised from "chai-as-promised";
import * as Q from "q";
import * as path from "path";
import RefOntoUmlFrontEnd from "../src/Input/RefOntoUml/RefOntoUmlFrontEnd";
import {OntoUmlModel, OntoUmlEntityType, OntoUmlRelationType} from "../src/OntoUml";

describe("RefOntoUmlFrontEnd", (): void => {
    it("parses a valid file", (done): void => {
        const expected: OntoUmlModel = {
            entities: {
                Kind1: {
                    attributes: [{
                        maxItems: 1,
                        minItems: 1,
                        name: "attr",
                        type: "string"
                    }],
                    generalizations: [],
                    name: "Kind1",
                    type: OntoUmlEntityType.Kind
                },
                Kind2: {
                    attributes: [],
                    generalizations: [],
                    name: "Kind2",
                    type: OntoUmlEntityType.Kind
                },
                SubKind1: {
                    attributes: [],
                    generalizations: [{
                        generalizationSet: "subkinds",
                        predecessor: "Kind1"
                    }],
                    name: "SubKind1",
                    type: OntoUmlEntityType.SubKind
                },
                SubKind2: {
                    attributes: [],
                    generalizations: [{
                        generalizationSet: "subkinds",
                        predecessor: "Kind1"
                    }],
                    name: "SubKind2",
                    type: OntoUmlEntityType.SubKind
                }
            },
            generalizationSets: {
                subkinds: {
                    childrenNames: ["SubKind1", "SubKind2"],
                    isComplete: false,
                    isDisjoint: true,
                    name: "subkinds"
                }
            },
            relations: {
                association: {
                    allowDuplicates: false,
                    derivedFrom: null,
                    isEssential: false,
                    isImmutablePart: false,
                    isImmutableWhole: false,
                    isInseparable: false,
                    isShareable: false,
                    name: "association",
                    sourceEnd: {
                        maxItems: -1,
                        minItems: 1,
                        name: "kind2",
                        type: "Kind2"
                    },
                    targetEnd: {
                        maxItems: 1,
                        minItems: 1,
                        name: "kind1",
                        type: "Kind1"
                    },
                    type: OntoUmlRelationType.Association
                }
            }
        };
        expect(new RefOntoUmlFrontEnd().parseFile(path.join(__dirname, "resources", "TestModel.refontouml"))).to.become(expected).notify(done);
    });

    it("throws on invalid file", (done): void => {
        expect(new RefOntoUmlFrontEnd().parseFile(path.join(__dirname, "resources", "InvalidModel.refontouml"))).to.be.rejected.notify(done);
    });
});