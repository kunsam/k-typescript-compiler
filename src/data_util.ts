import { isObject, isArray } from "lodash";
import gql from "graphql-tag";
export default class DataTransfromUtil {
  public static recursiveGetSelectionResult(selections: any[] = []) {
    if (!selections.length) return;
    let result: any;
    selections.forEach(selection => {
      let currentResult: any;
      const isDeepest = !(
        selection.selectionSet && selection.selectionSet.selections
      );
      if (isDeepest) {
        currentResult = { [selection.name.value]: true };
      } else {
        const childSelectionResult = this.recursiveGetSelectionResult(
          selection.selectionSet && selection.selectionSet.selections
        );
        if (childSelectionResult) {
          currentResult = { [selection.name.value]: childSelectionResult };
        }
      }
      if (currentResult) {
        if (!result) result = {};
        result = { ...result, ...currentResult };
      }
    });
    return result;
  }

  public static transformGraphStringToFeilds(qlString: string) {
    try {
      const object = gql(qlString);
      if (object && object.definitions.length) {
        const selections = object.definitions[0].selectionSet.selections;
        const dataobject = this.recursiveGetSelectionResult(selections);
        return this.tranformObjectOrArrayToFields(dataobject);
      }
    } catch {}
  }

  public static tranformObjectOrArrayToFields(result: any, parentKey?: string) {
    function recursiveGetKey(
      object: any,
      result: string[],
      parentKey: string
    ): string[] {
      if (isObject(object) && !isArray(object)) {
        for (let property in object) {
          const fieldId = `${!parentKey ? "" : parentKey + "."}` + property;
          result.push(fieldId);
          recursiveGetKey(object[property], result, fieldId);
        }
      }

      if (isArray(object)) {
        object.forEach(child => {
          recursiveGetKey(child, result, parentKey);
        });
      }

      return result;
    }
    return recursiveGetKey(result, [], parentKey || "");
  }
}
