import { Context, HttpRequest } from "@azure/functions"
import { ApiFunction, ApiPipeline, Result, ParseOptions } from "../lib/api-pipeline";
import * as schema from "../lib/schema-lib";
import * as db from "../lib/db-lib";
import { convertToApiResponseCode } from "../lib/func-lib";

const trigger: ApiFunction = async function( context: Context, req: HttpRequest ): Promise<Result<schema.IDispatchSession>> {

    const result = await db.getSession( req.params.userId, req.params.id ) as Result<schema.IDispatchSession>
        
    return result; 
}

const pipeline = new ApiPipeline()
    .validate( schema.PrimaryKey, ParseOptions.UseRequestParams )
    .execute(trigger)
    .listen();

export default pipeline;


