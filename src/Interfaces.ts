import {OntoUmlModel} from "./OntoUml";
import {OntoObjectModel} from "./OntoObjectModel";

/**
 * The application options.
 */
export interface IOptions {
    /**
     * The input file to process.
     */
    input: string;
    /**
     * The input form code.
     */
    inputForm: string;
    /**
     * The output directory or file (if singleFile flag is set).
     */
    output: string;
    /**
     * The output form code.
     */
    outputForm: string;
    /**
     * If set, all the generated code will be placed in a single file.
     */
    singleFile?: boolean;
    /**
     * Path to file containing primitive type mapping definitions.
     */
    typeMapping?: string;
    /**
     * Flag indicating to show additional output.
     */
    verbose?: boolean;
    /**
     * Flag indicating to show help and quit.
     */
    help?: boolean;
    /**
     * Additional configuration values.
     */
    configuration?: { [key: string]: string };
}

export interface IFrontEnd {
    /**
     * Parses the provided file to either OntoUmlModel or OntoObjectModel.
     * @returns Promise to the parsed model.
     */
    parseFile: (file: string) => Q.Promise<OntoUmlModel | OntoObjectModel>;
    /**
     * Flag indicating that the front end returns OntoObjectModel.
     */
    returnsOntoObjectModel: boolean;
}

/**
 * Class that maps OntoObjectModel to a viewmodel.
 */
export interface ILanguageMapper {
    /**
     * Maps the provided OntoObjectModel to a viewmodel.
     * @param model The model to process.
     * @param options The options of the application.
     * @returns Promise to the mapped viewmodel.
     */
    modelToViewModel: (model: OntoObjectModel, options: IOptions) => Q.Promise<any>;
}

/**
 * Class that renders a viewmodel to source code files.
 */
export interface ILanguageRenderer {
    /**
     * Generates source code from the viewmodel provided.
     * @param viewModel The model to generate from.
     * @param option Application options.
     * @returns Promise to all the write operations that need to be carried out.
     */
    generateCode: (model: any, options: IOptions) => Q.Promise<any>
}