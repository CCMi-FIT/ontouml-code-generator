import * as fs from "fs";
import * as _ from "lodash";
import * as Q from "q";
var validator: tv4.TV4 = require("tv4");
import {TypeMapping} from "./OntoObjectModel";

/**
 * Helper class used to facilitate work with Primitive Type Mapping
 */
export interface ITypeMappingHelper {
    /**
     * Reads the primitive type mappings if provided.
     * @param file Path to the file with mappings.
     * @return Parsed type mappings or an empty object if no file is specified.
     */
    readTypeMappings: (file: string) => Q.Promise<TypeMapping>;
}

/**
 * Implementation if the helper class used to facilitate work with Primitive Type Mapping
 */
export default class TypeMappingHelper implements ITypeMappingHelper {
    /**
     * JSON Schema of the type mapping file.
     */
    private typeMappingSchema: tv4.JsonSchema;

    constructor() {
        this.typeMappingSchema = JSON.parse(fs.readFileSync("./resources/PrimitiveTypeMapping.schema.json", "utf8"));
    }

    /**
     * Reads the primitive type mappings if provided.
     * @param file Path to the file with mappings.
     * @return Parsed type mappings or an empty object if no file is specified.
     */
    readTypeMappings = (file: string): Q.Promise<TypeMapping> => {
        if (file) {
            return Q.nfcall(fs.readFile, file, "utf8")
                .then((data: string): Q.Promise<TypeMapping> => {
                    const result: TypeMapping = JSON.parse(data.replace(/^\uFEFF/, '')); // remove BOM if present
                    if (!validator.validate(result, this.typeMappingSchema)) {
                        throw new Error(`Invalid type mapping file. Error: ${validator.error}`);
                    }
                    return Q(result);
                });
        }
        return Q<TypeMapping>({});
    }
}