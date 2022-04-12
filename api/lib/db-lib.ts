import * as pkg from '../package.json';
import { AzureNamedKeyCredential, odata, TableClient } from "@azure/data-tables";
import { Result, ResultType, ResultError, ResultSuccess } from "./result-lib";
import { ApiResponseCode } from "./api-pipeline";
import { DispatchTaskStatus } from './schema-lib';

const account = process.env["AzStorageTableAccountName"];
const accountKey = process.env["AzStorageTableAccountKey"];
const tableName = process.env["AzStorageTableName"];

type DbError = {
    message: string,
    name: string,
    stack: unknown,
    code: string,
    statusCode: number | undefined
}

const getTableClient = function (): Result<TableClient> {

    if (account == undefined || accountKey == undefined || tableName == undefined) {
        console.warn(`WARNING: Azure Storage has not been configured.`);
        return {
            type: ResultType.Error, error: { message: "Data storage has not been configured.", name: "ConfigurationError", details: {} }, code: 0
        }
    }

    try {
        const credential = new AzureNamedKeyCredential(account, accountKey);
        return {
            type: ResultType.Success,
            value: new TableClient(`https://${account}.table.core.windows.net`, tableName, credential),
            code: ApiResponseCode.OK
        }
    } catch (error) {
        const err = error as Error;

        return {
            type: ResultType.Error,
            error: {
                message: err.message,
                name: err.name,
                details: {}
            },
            code: 0

        }
    }
}

export type DbDispatchTask = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

export const patchTask = async function (task: DbDispatchTask): Promise<Result<DbDispatchTask>> {
    const client = getTableClient() as Result<TableClient>;

    if (client.type == ResultType.Error) { return client; }

    const { userId, id, ...record } = task;
    record.partitionKey = userId;
    record.rowKey = id;

    try {
        //@ts-ignore
        const tmp = await client.value.updateEntity(record, "Merge")

        return await getTask(task.userId, task.id);

    } catch (err) {
        return handleDbError(err, task.partitionKey, task.rowKey);
    }
}

export const createTask = async (task: DbDispatchTask): Promise<Result<DbDispatchTask>> => {

    const client = getTableClient();
    if (client.type == ResultType.Error) { return client as ResultError; }
    task.id = getInvertedTicks();
    task.version = pkg.version;
    task.status = DispatchTaskStatus.Waiting;

    const { userId, id, ...record } = task;
    record.partitionKey = userId;
    record.rowKey = id;

    try {
        //@ts-ignore
        await client.value.createEntity(record);
        return {
            type: ResultType.Success,
            value: task,
            code: ApiResponseCode.OK
        }
    } catch (error) {
        return handleDbError(error as DbError, task.partitionKey, task.rowKey);
    }
}

export const deleteTask = async function (partitionKey: string, rowKey: string): Promise<Result<any>> {
    const client = getTableClient();
    if (client.type == ResultType.Error) { return client; }

    try {
        await (client as ResultSuccess<TableClient>).value.deleteEntity(partitionKey, rowKey);

        return {
            type: ResultType.Success,
            value: null,
            code: ApiResponseCode.OK
        }
    } catch (err) {
        return handleDbError(err, partitionKey, rowKey)
    }
}

export const getTask = async function (partitionKey: string, rowKey: string): Promise<Result<DbDispatchTask>> {
    const client = getTableClient();
    if (client.type == ResultType.Error) { return client; }

    try {
        const result = await (client as ResultSuccess<DbDispatchTask>).value.getEntity(partitionKey, rowKey);

        // Don't let callers know we are using Azure Tables. Pull out certain properties...
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { partitionKey: pk, rowKey: rk, "odata.metadata": odata_metadata, ...record } = result;

        // And rename partitionKey and rowKey
        record.userId = pk;
        record.id = rk;

        return {
            type: ResultType.Success,
            value: record,
            code: ApiResponseCode.OK
        }
    } catch (err) {
        return handleDbError(err, partitionKey, rowKey)
    }
}

export const getTasksByUserId = async function (partitionKey: string): Promise<Result<DbDispatchTask[]>> {

    const client = getTableClient();
    if (client.type == ResultType.Error) { return client as ResultError; }

    try {
        const tasks: DbDispatchTask[] = [];
        const entities = await (client as ResultSuccess<TableClient>).value.listEntities({
            queryOptions: {
                filter: odata`PartitionKey eq '${partitionKey}'`
            }
        });
        for await (const entity of entities) {
            const { partitionKey, rowKey, ...record} = entity;
            record.userId = partitionKey;
            record.id = rowKey;
            tasks.push(record);
        }
        return {
            type: ResultType.Success,
            value: tasks,
            code: ApiResponseCode.OK
        }
    } catch (error) {
        return handleDbError(error, partitionKey);
    }
}

const handleDbError = (err: DbError, partitionKey: string, rowKey: string = 'unspecified'): ResultError => {
    console.error()
    let message = err.message;
    if (err.name && err.name.toUpperCase() == "RESTERROR") {

        if (err.code != undefined) {
            switch (err.code.toUpperCase()) {
                case "ENOTFOUND":
                    err.statusCode = ApiResponseCode.InternalServerError;
                    message = `The configured storage resource could not be found.`
                    break;

                default:
                    message = `Unknown RESTERROR ${err.code} for dispatch session with keys "${partitionKey} - ${rowKey}".`;
                    break;
            }
        } else if (err.statusCode != undefined) {
            switch (err.statusCode) {
                case ApiResponseCode.NotFound:
                    message = (err.message.includes("TableNotFound"))
                        ? `The configured storage table could not be found.`
                        : `Dispatch session with keys "${partitionKey} - ${rowKey}" not found.`;
                    break;

                default:
                    message = `Unknown RESTERROR ${err.statusCode} for dispatch session with keys "${partitionKey} - ${rowKey}".`;
            }
        }
    }
    return { type: ResultType.Error, error: { message: message, name: err.name, details: err.stack }, code: err.statusCode }
}

/**
 * Takes the current time (in ticks) and subtracts from the maximum date ticks allowed in JavaScript.
 * @returns The inverted ticks as a string.
 */
const getInvertedTicks = () => {
    const MAX_DATE = 8640000000000000;
    const invertedTicks = MAX_DATE - Date.now();
    return invertedTicks.toString();
}
function UpdateMode(arg0: { partitionKey: string; rowKey: string; status: DispatchTaskStatus.Completed; }, UpdateMode: any) {
    throw new Error('Function not implemented.');
}

