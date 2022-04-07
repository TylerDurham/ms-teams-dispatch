import { Context, HttpRequest } from "@azure/functions"
import { ApiFunction, ApiPipeline, ApiResponseCode, Result, ResultType, ValidationOptions } from "../lib/api-pipeline";
import * as schema from "../lib/schema-lib";

const execute: ApiFunction = async function( context: Context, req: HttpRequest ): Promise<Result> {
    return { type: ResultType.Success, code: ApiResponseCode.OK, value: {} }
}

const pipeline = new ApiPipeline()
    .validate( schema.PrimaryKey, ValidationOptions.UseRequestParams )
    .execute(execute)
    .listen();

export default pipeline;