import * as pkg from '../package.json';
import { AzureNamedKeyCredential, TableClient } from "@azure/data-tables";
import { Result, ResultType, ResultTypeError } from "./result-lib";
import { ApiResponseCode } from "./api-pipeline";
import { DispatchTaskStatus } from './schema-lib';

const account = process.env[ "AzStorageTableAccountName" ];
const accountKey = process.env[ "AzStorageTableAccountKey" ];
const tableName = process.env[ "AzStorageTableName" ];

type DbError = {
    message: string,
    name: string,
    stack: unknown,
    code: string,
    statusCode: number | undefined
}

const getTableClient = function(): Result<TableClient> {

    if ( account == undefined || accountKey == undefined|| tableName == undefined ) {
        console.warn( `WARNING: Azure Storage has not been configured.` );
        return {
            type: ResultType.Error, message: "Data storage has not been configured.", name: "ConfigurationError"
        }
    }

    try {
        const credential = new AzureNamedKeyCredential( account, accountKey );
        return {
            type: ResultType.Success,
            value: new TableClient( `https://${account}.table.core.windows.net`, tableName, credential )
        }
    } catch ( error ) {
        const err = error as Error;

        return {
            type: ResultType.Error,
            message: err.message,
            name: err.name
        }
    }
}

type DbDispatchTask = {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [ key: string ]: any;
}

export const createTask = async ( task: DbDispatchTask ): Promise<Result<DbDispatchTask>> => {

    const client = getTableClient();
    if ( client.type == ResultType.Error ) { return client as ResultTypeError; }
    task.id = getInvertedTicks();
    task.version = pkg.version;
    task.status = DispatchTaskStatus.Waiting;

    const { userId, id, ...record } = task;
    record.partitionKey = userId;
    record.rowKey = id;

    try {
        await client.value.createEntity( record );
        return {
            type: ResultType.Success,
            value: task
        }
    } catch ( error ) {
        return handleDbError( error as DbError, task.partitionKey, task.rowKey );
    }
}

export const deleteTask = async function (partitionKey: string, rowKey: string): Promise<Result<DbDispatchTask>> {
    const client = getTableClient();
    if (client.type == ResultType.Error) { return client; }

    try {
        const result = await client.value.deleteEntity(partitionKey, rowKey);

        return {
            type: ResultType.Success,
            value: null
        }
    } catch (err) {
        return handleDbError(err, partitionKey, rowKey)
    }
}

export const getTask = async function( partitionKey: string, rowKey: string ) : Promise<Result<DbDispatchTask>>  {
    const client = getTableClient();
    if ( client.type == ResultType.Error ) { return client; }

    try {
        const result = await client.value.getEntity( partitionKey, rowKey );

        // Don't let callers know we are using Azure Tables. Pull out certain properties...
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { partitionKey:pk, rowKey:rk, "odata.metadata":odata_metadata, ...record } = result;
        
        // And rename partitionKey and rowKey
        record.userId = pk;
        record.id = rk;

        return {
            type: ResultType.Success,             
            value: record
        }
    } catch ( err ) {
        return handleDbError( err, partitionKey, rowKey )
    }
}

const handleDbError = ( err: DbError, partitionKey: string, rowKey: string ): ResultTypeError => {
    console.error()
    let message = err.message;
    if ( err.name && err.name.toUpperCase() == "RESTERROR" ) {        

        if ( err.code != undefined ) {
            switch( err.code.toUpperCase() ) {
                case "ENOTFOUND":
                    err.statusCode = ApiResponseCode.InternalServerError;
                    message = `The configured storage resource could not be found.`
                    break;

                default:
                    message = `Unknown RESTERROR ${err.code} for dispatch session with keys "${partitionKey} - ${rowKey}".`;
                    break;
            }
        } else if ( err.statusCode != undefined ) {
            switch( err.statusCode ) {
                case ApiResponseCode.NotFound:
                    message = ( err.message.includes( "TableNotFound" ) ) 
                        ? `The configured storage table could not be found.` 
                        : `Dispatch session with keys "${partitionKey} - ${rowKey}" not found.`;
                    break;

                default:
                    message = `Unknown RESTERROR ${err.statusCode} for dispatch session with keys "${partitionKey} - ${rowKey}".`;  
            }
        }
    }
    return { type: ResultType.Error, message: message, name: err.name, details: err.stack, code: err.statusCode }
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
