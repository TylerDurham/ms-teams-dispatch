import { Context, HttpRequest } from "@azure/functions"
import { ApiFunction, ApiPipeline, ApiResponseCode, ApiResult, ResultType, ValidationOptions } from "../lib/api-pipeline";
import * as schema from "../lib/schema-lib";
import * as db from "../lib/db-lib";

const execute: ApiFunction = async function( context: Context, req: HttpRequest ): Promise<ApiResult<schema.IDispatchSession>> {

    const result = await db.getSession( req.params.userId, req.params.id ) as ApiResult<schema.IDispatchSession>
    if ( result.type == ResultType.Success ) {
        result.code = ApiResponseCode.OK;
    } else {
        result.code = ApiResponseCode.InternalServerError
    }
    
    return result; 
}

const pipeline = new ApiPipeline()
    .validate( schema.PrimaryKey, ValidationOptions.UseRequestParams )
    .execute(execute)
    .listen();

export default pipeline;