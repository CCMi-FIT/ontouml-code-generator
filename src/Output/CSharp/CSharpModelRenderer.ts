import * as fs from "fs";
import * as _ from "lodash";
import * as Q from "q";
import * as path from "path";
import * as mkdirp from "mkdirp";
import * as handlebars from "handlebars";
import * as Interfaces from "./CSharpViewModel";
import {IOptions, ILanguageRenderer} from "../../Interfaces";

/**
 * Context of the file template.
 */
interface IFileTemplateInput {
    /**
     * Content of the file (classes and interfaces).
     */
    content: string;
    /**
     * Namespace of the file.
     */
    namespace: string;
}

/**
 * Specifies a Handlebars helper.
 */
interface IHandlebarsHelperConfiguration {
    /**
     * Name used to refer to the helper from inside of the templates.
     */
    name: string;
    /**
     * Function of the helper.
     */
    body: Function;
}

/**
 * Class used to render CSharp viewmodel to C# model source code.
 */
export default class CSharpModelRenderer implements ILanguageRenderer {
    /**
     * Converts a string to camel case with the first letter in lower case.
     * @param s String to convert.
     */
    private static lowerCamel = (s: string): string => _.lowerFirst(_.camelCase(s));

    /**
     * Converts a string to camel case with the first letter in upper case.
     * @param s String to convert.
     */
    private static upperCamel = (s: string): string => _.upperFirst(_.camelCase(s));

    /**
     * Configuration of Handlebars helpers to be registered before rendering.
     */
    private static handlebarsConfig: IHandlebarsHelperConfiguration[] =
    [
        { name: "className", body: CSharpModelRenderer.upperCamel },
        { name: "pluralClassName", body: (s: string): string => `${CSharpModelRenderer.upperCamel(s)}${_.endsWith(s, "s") ? "" : "s"}` },
        { name: "methodName", body: CSharpModelRenderer.upperCamel },
        { name: "propertyName", body: CSharpModelRenderer.upperCamel },
        { name: "parameterName", body: CSharpModelRenderer.lowerCamel },
        { name: "fieldName", body: CSharpModelRenderer.lowerCamel },
        { name: "namespaceName", body: CSharpModelRenderer.upperCamel },
        { name: "minItemsConstantName", body: (s: string): string => _.snakeCase(`${s}MinItems`).toUpperCase() },
        { name: "maxItemsConstantName", body: (s: string): string => _.snakeCase(`${s}MaxItems`).toUpperCase() },
        { name: "countFieldName", body: (s: string): string => CSharpModelRenderer.lowerCamel(`${s}Count`) },
        { name: "toValidateFieldName", body: (s: string): string => CSharpModelRenderer.lowerCamel(`${s}ToValidate`) },
        { name: "associationFieldName", body: (s: string): string => `${CSharpModelRenderer.lowerCamel(s)}Association` }
    ];

    /**
     * Handlebars template to be used for each file (the header and footer of every file). Should accept an {@link IHandlebarsHelperConfiguration} object as context.
     */
    private fileTemplate: HandlebarsTemplateDelegate;

    /**
     * Handlebars template to be used to render a single class. Should accept an Interfaces.ClassViewModel object as context.
     */
    private classTemplate: HandlebarsTemplateDelegate;

    constructor() {
        const initTemplate = (templatePath: string): HandlebarsTemplateDelegate => {
            const templateSource: string = fs.readFileSync(templatePath, "utf8");
            return handlebars.compile(templateSource);
        };
        this.classTemplate = initTemplate("./resources/CSharp/csharp-class-template.handlebars");
        this.fileTemplate = initTemplate("./resources/CSharp/csharp-file-template.handlebars");
        _.each(CSharpModelRenderer.handlebarsConfig, (config: IHandlebarsHelperConfiguration): void => handlebars.registerHelper(config.name, config.body));
    }

    /**
     * Writes a single file to the location provided.
     * @param file Path to the file.
     * @param content The content to be written.
     * @returns Promise of the write operation.
     */
    private writeFile = (file: string, content: string, verbose: boolean): Q.Promise<any> => {
        const formatted: string = content.replace(/(?:^\s*$){2,}/gm, "");
        if (verbose) {
            console.log(file);
            console.log("===========================================");
            console.log(formatted);
        }
        return Q.nfcall(fs.writeFile, file, formatted);
    }

    /**
     * Generates C# code from the viewmodel provided.
     * @param viewModel The model to generate from.
     * @param option Application options.
     * @returns Promise to all the write operations that need to be carried out.
     */
    generateCode = (viewModel: Interfaces.ModelViewModel, options: IOptions): Q.Promise<any> => {
        if (!options) {
            throw new Error("No options specified");
        }
        if (options.singleFile) {
            const result: string = _.reduce(viewModel.classes,
                (acc: string, clazz: Interfaces.ClassViewModel): string => `${acc}\n    ${_.trim(this.classTemplate(clazz))}\n`, "");
            const fileContext: IFileTemplateInput = {
                content: _.trim(result),
                namespace: viewModel.namespace
            }; console.log(options.output);
            return this.writeFile(options.output || "Model.cs", this.fileTemplate(fileContext), options.verbose);
        }
        return Q.nfcall(mkdirp, options.output)
            .then((): Q.Promise<any> => {
                return Q.all(_.map(viewModel.classes, (clazz: Interfaces.ClassViewModel): Q.Promise<any> => {
                    const result: string = this.classTemplate(clazz);
                    const fileContext: IFileTemplateInput = {
                        content: _.trim(result),
                        namespace: viewModel.namespace
                    };
                    const targetPath: string = path.join(options.output, `${clazz.isInterface ? "I" : ""}${CSharpModelRenderer.upperCamel(clazz.name)}.cs`);
                    return this.writeFile(targetPath, this.fileTemplate(fileContext), options.verbose);
                }));
            });
    }
}