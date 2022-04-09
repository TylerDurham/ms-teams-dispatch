import * as db from "../lib/db-lib";
import * as schema from "../lib/schema-lib";
import { ApiFunction, ApiPipeline, ApiResponseCode, ParseOptions, Result, ResultType } from "../lib/api-pipeline";
import { Context, HttpRequest } from "@azure/functions"
import * as axios from 'axios';

const handleCallback = async function(url: string, payload: object | undefined) {

}

const trigger: ApiFunction = async function (context: Context, req: HttpRequest): Promise<Result<db.DbDispatchTask>> {

    let result = await db.getTask(req.params.userId, req.params.id) as Result<db.DbDispatchTask>

    if (result.type == ResultType.Error) return result;

    if (result.value.callback) {
        console.log(`TODO: Calling "${result.value.callback}`)
    }

    result = await db.completeTask(req.params.userId, req.params.id) as Result<db.DbDispatchTask>

    return result;

}

const pipeline = new ApiPipeline()
    .requireHeaders({ "accept": "application/json", "content-type": "application/json" })
    .validate(schema.PrimaryKey, ParseOptions.UseRequestParams)
    .execute(trigger)
    .listen();

export default pipeline;


