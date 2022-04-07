import { Context, HttpRequest } from "@azure/functions"
import { ApiFunction, ApiPipeline, Result, ParseOptions, ApiResponseCode, ResultType } from "../lib/api-pipeline";
import * as schema from "../lib/schema-lib";
import * as db from "../lib/db-lib";
import { convertToApiResponseCode } from "../lib/func-lib";

const trigger: ApiFunction = async function( context: Context, req: HttpRequest ): Promise<Result<schema.IDispatchSession>> {

    const key = "accept";
    const contentType = req.headers[ key ];
    if( contentType && contentType.includes("application/json" ) ) {
        const result = await db.getSession( req.params.userId, req.params.id ) as Result<schema.IDispatchSession>
        
        return result; 
    } else {
        return {
            type: ResultType.Error,
            code: ApiResponseCode.BadRequest,
            message: "Missing request header 'application/json'."
        }
    }    
}

const pipeline = new ApiPipeline()
    .requireHeaders( { "accept": "application/json"})
    .validate( schema.PrimaryKey, ParseOptions.UseRequestParams )
    .execute(trigger)
    .listen();

export default pipeline;


