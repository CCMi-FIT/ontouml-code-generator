import * as Q from "q";
import * as fs from "fs";
var validator: tv4.TV4 = require("tv4");
import {OntoObjectModel} from "../../OntoObjectModel";
import {IFrontEnd} from "../../Interfaces";

export default class OntoObjectModelFrontEnd implements IFrontEnd {
    /**
     * JSON Schema of the ObjectModel.
     */
    private schema: tv4.JsonSchema;

    constructor() {
        this.schema = JSON.parse(fs.readFileSync("./resources/OntoObjectModel.schema.json", "utf8"));
    }

    /**
     * Parses the provided file returning a promise to OntoUmlModel.
     * @param file Path to the file to parse.
     */
    parseFile = (file: string): Q.Promise<OntoObjectModel> => {
        return Q.nfcall(fs.readFile, file, "utf8")
            .then((data: string): Q.Promise<any> => {
                const result: OntoObjectModel = JSON.parse(data.replace(/^\uFEFF/, '')); // remove BOM if present
                if (!validator.validate(result, this.schema)) {
                    throw new Error(`Invalid ObjectModel file. Error: ${validator.error}`);
                }
                return Q(result);
            });
    }

    /**
     * Flag indicating that the front end returns ObjectModel.
     */
    returnsOntoObjectModel: boolean = true;
}