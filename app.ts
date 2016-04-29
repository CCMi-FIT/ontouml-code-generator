import * as fs from "fs";
import * as _ from "lodash";
import * as Q from "q";
var commandLineArgs = require("command-line-args");
import RefOntoUmlFrontEnd from "./src/Input/RefOntoUml/RefOntoUmlFrontEnd";
import OntoObjectModelFrontEnd from "./src/Input/Json/OntoObjectModelFrontEnd";
import {OntoUmlModel} from "./src/OntoUml";
import OntoUmlToOntoObjectModelMapper from "./src/OntoUmlToOntoObjectModelMapper";
import CSharpMapper from "./src/Output/CSharp/CSharpMapper";
import CSharpModelRenderer from "./src/Output/CSharp/CSharpModelRenderer";
import JsonMapper from "./src/Output/Json/JsonMapper";
import JsonRenderer from "./src/Output/Json/JsonRenderer";
import {IOptions, IFrontEnd, ILanguageMapper, ILanguageRenderer} from "./src/Interfaces";
import {OntoObjectModel} from "./src/OntoObjectModel";
import TypeMappingHelper from "./src/TypeMappingHelper";

var cli = commandLineArgs([
    { name: "help", alias: "h", type: Boolean, description: "Displays this help message and quits." },
    { name: "verbose", alias: "v", type: Boolean, description: "Displays additional output." },
    { name: "input", alias: "i", defaultOption: true, type: String, description: "The input file to process." },
    { name: "inputForm", alias: "I", type: String, description: "The input form code. Valid values:\n\"refontouml\":\t RefOntoUml from OLED.\n\"onto-object-model\":\t JSON of the OntoObjectModel.\n Defaults to \"refontouml\"." },
    { name: "output", alias: "o", type: String, description: "The output directory or file (if singleFile flag is set)." },
    { name: "outputForm", alias: "O", type: String, description: "The output form code. Valid values:\n\"csharp-model\":\t model classes with semantic checks in C#\nConfig options:\n-c namespace=<namespaceName> name of the namespace to use\n\n\"onto-object-model\":\t JSON of the OntoObjectModel\n\n Defaults to \"csharp-model\"." },
    { name: "singleFile", alias: "s", type: Boolean, description: "If set, all the generated code will be placed in a single file." },
    { name: "typeMapping", alias: "t", type: String, description: "Path to file containing primitive type mapping definitions." },
    { name: "config", alias: "c", type: String, multiple: true, description: "Additional configuration options in the form <name>=<value>." }
]);
var usageData = {
    title: "OntoUML code generator",
    description: "Generates source code from OntoUML models.",
    footer: "Project home: [underline]{https://github.com/CCMi-FIT/ontouml-code-generator}"
};

function processConfigOptions(rawOptions: IOptions & { config: string[] }): IOptions {
    let result: IOptions = _.cloneDeep(_.omit(rawOptions, "config") as IOptions);
    result.configuration = {};
    _.forEach(rawOptions.config, (pair: string) => {
        let [key, value] = pair.split("=");
        if (key && value) {
            result.configuration[key] = value;
        }
    });
    return result;
}
var rawOptions: IOptions & { config: string[] } = cli.parse();
var options: IOptions = processConfigOptions(rawOptions);

if (_.isEmpty(rawOptions) || rawOptions.help) {
    console.log(cli.getUsage(usageData));
    process.exit(0);
}

if (!options.input) {
    console.error("The input file is required.");
    process.exit(1);
}

if (!options.output) {
    console.error("The output file is required.");
    process.exit(1);
}

var frontEnd: IFrontEnd;
var mapper: ILanguageMapper;
var renderers: ILanguageRenderer[];

// EXTENSION POINT: Register all the supported input languages here.
switch (_.toUpper(options.inputForm)) {
    case "": // set default input language by this case
    case "REFONTOUML":
        frontEnd = new RefOntoUmlFrontEnd();
        break;
    case "ONTO-OBJECT-MODEL":
        frontEnd = new OntoObjectModelFrontEnd();
        break;
    default:
        console.error(`Unknown input language "${options.inputForm}"`);
        process.exit(1);
}

// EXTENSION POINT: Register all the supported output languages here.
switch (_.toUpper(options.outputForm)) {
    case "": // set default output language by this case
    case "CSHARP-MODEL":
        mapper = new CSharpMapper(new TypeMappingHelper());
        renderers = [new CSharpModelRenderer()];
        break;
    case "ONTO-OBJECT-MODEL":
        mapper = new JsonMapper();
        renderers = [new JsonRenderer()];
        break;
    default:
        console.error(`Unknown language "${options.outputForm}"`);
        process.exit(1);
}

frontEnd.parseFile(options.input)
    .then((model: OntoUmlModel | OntoObjectModel): Q.Promise<OntoObjectModel> => {
        if (frontEnd.returnsOntoObjectModel) {
            return Q(model as OntoObjectModel);
        }
        const objectMapper = new OntoUmlToOntoObjectModelMapper();
        const objectModel = objectMapper.mapToOntoObjectModel(model as OntoUmlModel);
        return Q(objectModel);
    })
    .then((objectModel: OntoObjectModel): Q.Promise<any> => {
        return mapper.modelToViewModel(objectModel, options);
    })
    .then((viewModel: any): Q.Promise<any> => {
        return Q.all(_.map(renderers, (renderer: ILanguageRenderer): Q.Promise<any> => renderer.generateCode(viewModel, options)));
    })
    .catch((reason: any) => {
        console.error(reason);
        process.exit(2);
    })
    .done(() => console.log("Output generated successfully"));