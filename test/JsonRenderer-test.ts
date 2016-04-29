import * as chai from "chai";
const expect = chai.expect;
import * as chaiAsPromised from "chai-as-promised";
import * as Q from "q";
import * as fs from "fs";
import * as path from "path";
var mock = require("mock-fs");
import JsonRenderer from "../src/Output/Json/JsonRenderer";
import {OntoObjectModel} from "../src/OntoObjectModel";

chai.use(chaiAsPromised);

describe("JsonRenderer", (): void => {
    afterEach(() => mock.restore());

    it("renders a simple model to a single file", (done): void => {
        const renderer: JsonRenderer = new JsonRenderer();
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
        const expected: string =
`{
  "classes": [
    {
      "name": "test",
      "attributes": [
        {
          "name": "attr"
        }
      ]
    }
  ],
  "relations": []
}`.replace(/\r\n/g, "\n");
        mock({
            "testDir": {}
        });
        renderer.generateCode(input, { input: null, inputForm: null, output: "testDir/model.json", outputForm: null, singleFile: true })
            .then((): void => {
                const result: string = fs.readFileSync(path.join("testDir", "model.json"), "utf8").replace(/\r\n/g, "\n");
                expect(result).to.be.equal(expected);
            })
            .done(() => {
                done();
            });
    });
});