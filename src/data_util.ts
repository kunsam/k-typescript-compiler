import { isObject, isArray } from "lodash";

export default class DataTransfromUtil {
  public static tranformObjectOrArrayToFields(
    result: any,
    parentKey?: string
  ) {
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
