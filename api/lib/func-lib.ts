import { ApiResponseCode, Result, ResultType } from "./api-pipeline";
 
/** 
 * Utility function that converts a ResultType to it's corresponding ApiResponseCode.
 * @param type The ResultType to be converted.
 * @returns The corresponding ApiResponseCode.
 */
export function convertToApiResponseCode(type: ResultType): ApiResponseCode {
  let code: ApiResponseCode;

  switch (type) {
    case ResultType.Success:
      code = ApiResponseCode.OK;
      break;

    case ResultType.Error:
      code = ApiResponseCode.InternalServerError;
      break;

    default:
      code = ApiResponseCode.BadRequest;
      break;
  }

  return code;
}
