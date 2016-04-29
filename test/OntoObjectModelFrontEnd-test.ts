import * as chai from "chai";
const expect = chai.expect;
import * as chaiAsPromised from "chai-as-promised";
import * as Q from "q";
import * as path from "path";
import OntoObjectModelFrontEnd from "../src/Input/Json/OntoObjectModelFrontEnd";

describe("OntoObjectModelFrontEnd", (): void => {
    it("parses a valid file", (done): void => {
        const expected = {
            classes: [{
                name: "testClass"
            }]
        };
        expect(new OntoObjectModelFrontEnd().parseFile(path.join(__dirname, "resources", "validOntoObjectModel.json"))).to.become(expected).notify(done);
    });
    it("parses a valid file with BOM", (done): void => {
        const expected = {
            classes: [{
                name: "testClass"
            }]
        };
        expect(new OntoObjectModelFrontEnd().parseFile(path.join(__dirname, "resources", "validOntoObjectModelWithBOM.json"))).to.become(expected).notify(done);
    });
    it("throws on invalid file", (done): void => {
        expect(new OntoObjectModelFrontEnd().parseFile(path.join(__dirname, "resources", "invalidOntoObjectModel.json"))).to.be.rejected.notify(done);
    });
});