import * as fs from "fs";
import * as Q from "q";
var jsonFormat = require("json-format");

import {IOptions, ILanguageRenderer} from "../../Interfaces";
import {OntoObjectModel} from "../../OntoObjectModel";

/**
 * Class used to render ObjectModel to formatted JSON.
 */
export default class JsonRenderer implements ILanguageRenderer{
    /**
     * Prints the viewmodel provided to a file.
     * @param viewModel The model to generate from.
     * @param option Application options.
     * @returns Promise to all the write operations that need to be carried out.
     */
    generateCode = (viewModel: OntoObjectModel, options: IOptions): Q.Promise<any> => {
        const formatted: string = jsonFormat(viewModel, { type: "space", size: 2 });

        if (options && options.verbose) {
            console.log(formatted);
        }

        return Q.nfcall(fs.writeFile, options.output, formatted);
    }
}