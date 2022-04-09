import * as db from "../lib/db-lib";
import * as schema from "../lib/schema-lib";
import { ApiFunction, ApiPipeline, ParseOptions, Result } from "../lib/api-pipeline";
import { Context, HttpRequest } from "@azure/functions"

const trigger: ApiFunction = async function( context: Context, req: HttpRequest ): Promise<Result<schema.IDispatchTask>> {
    const result = await db.createTask( req.body ) as Result<schema.IDispatchTask>
        
    return result;
}

const pipeline = new ApiPipeline()
    .requireHeaders( { "accept": "application/json", "content-type": "application/json" } )
    .validate( schema.Insert, ParseOptions.UseRequestBody )
    .execute( trigger )
    .listen();

export default pipeline;