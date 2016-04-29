import * as chai from "chai";
const expect = chai.expect;
import * as chaiAsPromised from "chai-as-promised";
import * as Q from "q";
import * as path from "path";
import TypeMappingHelper from "../src/TypeMappingHelper";
import {TypeMapping} from "../src/OntoObjectModel";

describe("TypeMappingHelper", (): void => {
    it("parses a valid file", (done): void => {
        const expected: TypeMapping = {
            number: "int"
        };
        expect(new TypeMappingHelper().readTypeMappings(path.join(__dirname, "resources", "validTypeMapping.json"))).to.become(expected).notify(done);
    });

    it("parses a valid file with BOM", (done): void => {
        const expected: TypeMapping = {
            number: "int"
        };
        expect(new TypeMappingHelper().readTypeMappings(path.join(__dirname, "resources", "validTypeMappingWithBOM.json"))).to.become(expected).notify(done);
    });

    it("throws on invalid file", (done): void => {
        expect(new TypeMappingHelper().readTypeMappings(path.join(__dirname, "resources", "invalidTypeMapping.json"))).to.be.rejected.notify(done);
    });

    it("returns an promise to empty object if no file is specified", (done): void => {
        expect(new TypeMappingHelper().readTypeMappings(null)).to.become({}).notify(done);
    });
});