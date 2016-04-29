import * as chai from "chai";
const expect = chai.expect;
import * as chaiAsPromised from "chai-as-promised";
import * as Q from "q";
import JsonMapper from "../src/Output/Json/JsonMapper";
import {OntoObjectModel} from "../src/OntoObjectModel";

chai.use(chaiAsPromised);

describe("JsonMapper", (): void => {
    it("does not alter input", (done): void => {
        const mapper: JsonMapper = new JsonMapper();
        const input: OntoObjectModel = {
            classes: [{
                name: "test",
                attributes: [
                    {
                        name: "attr"
                    }
                ]
            }],
            relations: []
        };
        const expected: OntoObjectModel = {
            classes: [{
                name: "test",
                attributes: [
                    {
                        name: "attr"
                    }
                ]
            }],
            relations: []
        }
        expect(mapper.modelToViewModel(input, null)).to.become(expected).notify(done);
    });
});