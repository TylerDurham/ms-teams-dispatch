import { Context, HttpRequest } from '@azure/functions';
import * as joi from 'joi';
import { Result, ResultType } from './result-lib';

export { ResultType, Result }

export enum ApiResponseCode {
    OK = 200,
    BadRequest = 400,
    AccessDenied = 401,
    NotFound = 404,
    InternalServerError = 500
}

export enum ParseOptions {
    None = 0,
    UseRequestBody = 1,
    UseRequestParams = 2
}

export type ApiFunction = ( context: Context, req: HttpRequest ) => Promise<Result<object>>

export class ApiPipeline {

    private _needToValidate = false;
    private _validationSchema: joi.ObjectSchema = null;
    private _validationOptions: ParseOptions = ParseOptions.None;
    private _execute: ApiFunction;

    constructor() {
        this._needToValidate = false;
    }

    public execute( fn: ApiFunction ) {
        this._execute = fn;
        return this;
    }

    public validate( schema: joi.ObjectSchema, options: ParseOptions = ParseOptions.UseRequestBody ) {

        if ( schema != null && options != ParseOptions.None ) {
            this._validationOptions = options;
            this._validationSchema = schema;
            this._needToValidate = true;
        }
        
        return this;
    }

    public listen() {
        const self = this;
        return async (context: Context, req: HttpRequest) => {
            return self._handleListen( context, req );
            //context.done()
        }
    }

    private _handleValidate( context: Context, req: HttpRequest ): Result<any> {
        if ( this._needToValidate ) {

            let inputs =  this._parseRequest(req, this._validationOptions );

            let result = this._validationSchema.validate( inputs );
            if ( result.error ) {
                return {
                    type: ResultType.Error,
                    code: ApiResponseCode.BadRequest,
                    message: result.error.message,
                    name: result.error.name,
                    details: result.error.details
                }
            } else {
                return {
                    type: ResultType.Success,
                    code: ApiResponseCode.OK
                }
            }            
        }
    }

    private _parseRequest(req: HttpRequest, options: ParseOptions) {
        let inputs;

        switch (options) {
            case ParseOptions.UseRequestBody:
                inputs = req.body;
                break;

            case ParseOptions.UseRequestParams:
                inputs = req.params;
                break;
        }
        return inputs;
    }

    private async _handleListen(context: Context, req: HttpRequest) {

        console.log(req.headers)

        let result: Result<any>;
        if ( this._needToValidate ) result = this._handleValidate( context, req );
        if ( result.type == ResultType.Success ) result = await this._execute( context, req );

        if ( result.type == ResultType.Error ) {

            // Hide error details from external callers.
            delete result.details;
            delete result.name;
        }

        // Extract response code
        const { code, ...response } = result;

        // Fortmat response
        context.res = {
            statusCode: code,
            headers: {
                "Content-Type": "application/json",
                "server": ""                            // Keep the hackers guessing.
            },
            body: response
        }
        context.done();
        
    }

    private _handleResponse( context: Context, result: Result<any> ) {
        context.res = {
            statusCode: result.code,
            headers: {
                "Content-Type": "application/json",
                "server": ""
            },
            body: result
        }
        context.done();
    }
}