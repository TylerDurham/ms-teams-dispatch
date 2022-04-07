import { Context, HttpRequest } from '@azure/functions';
import * as joi from 'joi';
import { Result, ResultType } from './result-lib';

export { ResultType }

export enum ApiResponseCode {
    OK = 200,
    BadRequest = 400,
    InternalServerError = 500
}

export type ApiResult<T> = Result<T> & { code: ApiResponseCode }

export enum ValidationOptions {
    None = 0,
    UseRequestBody = 1,
    UseRequestParams = 2
}

export type ApiFunction = ( context: Context, req: HttpRequest ) => Promise<ApiResult<object>>

export class ApiPipeline {

    private _needToValidate = false;
    private _validationSchema: joi.ObjectSchema = null;
    private _validationOptions: ValidationOptions = ValidationOptions.None;
    private _execute: ApiFunction;

    constructor() {
        this._needToValidate = false;
    }

    public execute( fn: ApiFunction ) {
        this._execute = fn;
        return this;
    }

    public validate( schema: joi.ObjectSchema, options: ValidationOptions = ValidationOptions.UseRequestBody ) {

        if ( schema != null && options != ValidationOptions.None ) {
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

    private _handleExecute( context: Context, req: HttpRequest ) {

    }

    private _handleValidate( context: Context, req: HttpRequest ): ApiResult<any> {
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

    private _parseRequest(req: HttpRequest, options: ValidationOptions) {
        let inputs;

        switch (options) {
            case ValidationOptions.UseRequestBody:
                inputs = req.body;
                break;

            case ValidationOptions.UseRequestParams:
                inputs = req.params;
                break;
        }
        return inputs;
    }

    private async _handleListen(context: Context, req: HttpRequest) {

        let result;
        if ( this._needToValidate ) result = this._handleValidate( context, req );
        if ( result.type == ResultType.Success ) result = await this._execute( context, req );

        const { code, ...response } = result;

        context.res = {
            statusCode: code,
            headers: {
                "Content-Type": "application/json",
                "server": ""
            },
            body: response
        }
        context.done();
        
    }

    private _handleResponse( context: Context, result: ApiResult<any> ) {
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