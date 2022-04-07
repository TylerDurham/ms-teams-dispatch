import { AzureNamedKeyCredential, TableClient } from "@azure/data-tables";
import { Result, ResultType, ResultTypeError } from "./result-lib";

const account = process.env["AzStorageTableAccountName"];
const accountKey = process.env["AzStorageTableAccountKey"];
const tableName = process.env["AzStorageTableName"];

const getTableClient = function(): Result<TableClient> {

    if ( account == undefined || accountKey == undefined|| tableName == undefined ) {
        console.warn(`WARNING: Azure Storage has not been configured.`);
        return {
            type: ResultType.Error, message: "Data storage has not been configured.", name: "ConfigurationError"
        }
    }

    try {
        const credential = new AzureNamedKeyCredential(account, accountKey);
        return {
            type: ResultType.Success,
            value: new TableClient(`https://${account}.table.core.windows.net`, tableName, credential)
        }
    } catch (error) {
        const err = error as Error;

        return {
            type: ResultType.Error,
            message: err.message,
            name: err.name
        }
    }
}

type DbDispatchSession = {
    [ key: string ]: any;
}

export const createSession = async ( session: DbDispatchSession ): Promise<Result<DbDispatchSession>> => {

    const client = getTableClient();
    if (client.type == ResultType.Error) {
        return client as ResultTypeError;
    }

    try {
        const result = await client.value.createEntity( session ) as DbDispatchSession;
        return {
            type: ResultType.Success,
            value: session
        }
    } catch ( error ) {
        //return handleDbError( error as DbError, session );
    }
}

export const getSession = async function( pk: string, rk: string ) : Promise<Result<DbDispatchSession>>  {
    const client = getTableClient();
    if (client.type == ResultType.Error) {
        return client as ResultTypeError;
    }

    try {
        let result = await client.value.getEntity( pk, rk );
        let { partitionKey, rowKey, ...rest } = result;
        result.userId = partitionKey;
        result.id = rowKey;
        return {
            type: ResultType.Success,
            value: result
        }
    } catch ( err ) {
        return {
            type: ResultType.Error,
            message: err.message,
            name: err.name,
            details: err.stack
        }
    }
}
