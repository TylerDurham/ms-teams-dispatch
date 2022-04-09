import * as db from "../lib/db-lib";
import * as schema from "../lib/schema-lib";
import { ApiFunction, ApiPipeline, ApiResponseCode, ParseOptions, Result, ResultType } from "../lib/api-pipeline";
import { Context, HttpRequest } from "@azure/functions"
import * as axios from 'axios';

const handleCallback = async function (url: string, payload: object | undefined): Promise<Result<object>> {
    try {
        const response = await axios.default.post(url, payload);
        return {
            type: ResultType.Success,
            code: ApiResponseCode.OK,
            value: {}
        }
    } catch (err) {
        return {
            type: ResultType.Error,
            code: err.response.status,
            error: {
                message: `Error with callback "${url}": ${err.message}`,
                name: "CallbackError",
                details: err.stack
            }
        }
    }
}

const trigger: ApiFunction = async function (context: Context, req: HttpRequest): Promise<Result<db.DbDispatchTask>> {

    let result = await db.getTask(req.params.userId, req.params.id)

    if (result.type == ResultType.Error) return result;

    if (result.value.callback) {
        console.log(`TODO: Calling "${result.value.callback}`);
        result = await handleCallback(result.value.callback, req.body)
    }

    let record;

    if (result.type == ResultType.Error) {
        const { code, error } = result;
        record = {
            userId: req.params.userId,
            id: req.params.id,
            status: schema.DispatchTaskStatus.Error,
            errormessage: result.error.message,
            errordetails: JSON.stringify(result.error.details)
        }

        result = await db.patchTask(record) as Result<db.DbDispatchTask>
        if (result.type == ResultType.Success) {
            return {
                type: ResultType.Error,
                code: code,
                error: {
                    message: error.message,
                    name: error.name,
                    details: error.details
                }
            }
        }
    } else {
        record = {
            userId: req.params.userId,
            id: req.params.id,
            status: schema.DispatchTaskStatus.Completed,
        }
    }

    return result;

}

const pipeline = new ApiPipeline()
    .requireHeaders({ "accept": "application/json", "content-type": "application/json" })
    .validate(schema.PrimaryKey, ParseOptions.UseRequestParams)
    .execute(trigger)
    .listen();

export default pipeline;


