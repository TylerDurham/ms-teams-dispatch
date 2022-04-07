
const account = process.env["AzStorageTableAccountName"];
const accountKey = process.env["AzStorageTableAccountKey"];
const tableName = process.env["AzStorageTableName"];

export enum ResultType {
    Success,
    Error
}

export type ResultTypeSuccess = {
    type: ResultType,
    value?: object
}

export type ResultTypeError = {
    type: ResultType,
    message: string,
    name: string,
    details: any
}

export const create = function( partitionId: string, rowKey: string ) {
    if ( account == undefined || accountKey == undefined|| tableName == undefined ) {
        console.warn(`WARNING: Azure Storage has not been configured.`);
        let err = new Error();
        err.message = "Data storage has not been configured.";
        err.name = "ConfigurationError"

        throw err;
        
    }
}