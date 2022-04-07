import { Context, HttpRequest } from '@azure/functions';
import * as joi from 'joi';

export enum ApiResponseCode {
    OK = 200,
    BadRequest = 400,
    InternalServerError = 500
}

export enum ResultType {
    Success,
    Error
}

export type ResultTypeSuccess = {
    type: ResultType,
    code: ApiResponseCode.OK,
    value?: object
}

export type ResultTypeError = {
    type: ResultType,
    code: ApiResponseCode.BadRequest | ApiResponseCode.InternalServerError
    message: string,
    name: string,
    details: any
}

export type Result = ResultTypeSuccess | ResultTypeError

export enum ValidationOptions {
    None = 0,
    UseRequestBody = 1,
    UseRequestParams = 2
}

export type ApiFunction = ( context: Context, req: HttpRequest ) => Promise<Result>

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
            self._handleListen( context, req )
        }
    }

    private _handleExecute( context: Context, req: HttpRequest ) {

    }

    private _handleValidate( context: Context, req: HttpRequest ): Result {
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

        let result = this._handleValidate( context, req );

        if ( result.type == ResultType.Error ) {
            return this._handleResponse( context, result )
        } else {
            result = await this._execute( context, req );
            return this._handleResponse( context, result );
        }
    }

    private _handleResponse( context: Context, result: Result ) {
        context.res = {
            code: result.code,
            headers: {
                "Content-Type": "application/json",
                "server": ""
            },
            body: result
        }
        context.done();
    }
}