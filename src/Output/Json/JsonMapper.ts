import * as Q from "q";
import {IOptions, ILanguageMapper} from "../../Interfaces";
import {OntoObjectModel} from "../../OntoObjectModel";

/**
 * Class used to map Object Model to itself (identity mapper).
 */
export default class JsonMapper implements ILanguageMapper {
    /**
     * Maps the provided OntoObjectModel to itself.
     * @param model The model to process.
     * @param options The options of the application.
     * @returns Promise to the mapped viewmodel.
     */
    modelToViewModel = (model: OntoObjectModel, options: IOptions): Q.Promise<any> => {
        return Q(model);
    }
}