import * as db from "../lib/db-lib";
import * as schema from "../lib/schema-lib";
import { ApiFunction, ApiPipeline, ParseOptions, Result } from "../lib/api-pipeline";
import { Context, HttpRequest } from "@azure/functions"

const trigger: ApiFunction = async function (context: Context, req: HttpRequest): Promise<Result<any>> {
    const result = await db.deleteTask(req.params.userId, req.params.id) 

    return result;
}

const pipeline = new ApiPipeline()
    .requireHeaders({ "accept": "application/json" })
    .validate(schema.PrimaryKey, ParseOptions.UseRequestParams)
    .execute(trigger)
    .listen();

export default pipeline;


