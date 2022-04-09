/* eslint-disable @typescript-eslint/no-this-alias */
import * as joi from 'joi';
import { Context, HttpRequest, HttpRequestHeaders } from '@azure/functions';
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

export type ApiFunction = (context: Context, req: HttpRequest) => Promise<Result<object>>

export class ApiPipeline {
    private _headers;
    private _needToValidate = false;
    private _validationSchema: joi.ObjectSchema = null;
    private _validationOptions: ParseOptions = ParseOptions.None;
    private _execute: ApiFunction;

    constructor() {
        this._needToValidate = false;
    }

    public requireHeaders(headers: HttpRequestHeaders) {
        this._headers = headers;
        return this;
    }

    public execute(fn: ApiFunction) {
        this._execute = fn;
        return this;
    }

    public validate(schema: joi.ObjectSchema, options: ParseOptions = ParseOptions.UseRequestBody) {

        if (schema != null && options != ParseOptions.None) {
            this._validationOptions = options;
            this._validationSchema = schema;
            this._needToValidate = true;
        }

        return this;
    }

    public listen() {
        const self = this;
        return async (context: Context, req: HttpRequest) => {
            return self._handleListen(context, req);
        }
    }

    private _handleValidate(context: Context, req: HttpRequest) {
        if (this._needToValidate) {

            const inputs = this._parseRequest(req, this._validationOptions);

            const result = this._validationSchema.validate(inputs);
            if (result.error) {
                return {
                    type: ResultType.Error,
                    code: ApiResponseCode.BadRequest,
                    error: {
                        message: result.error.message,
                        name: result.error.name,
                        details: result.error.details
                    }
                }
            } else {
                return {
                    type: ResultType.Success,
                    value: "Validation succeeded.",
                    code: ApiResponseCode.OK
                }
            }
        }
    }

    /**
     * Determines which part of the request to pull inputs from.
     * @param req Determines
     * @param options A flag that indicates to pull inputs from the request body or the request parameters.
     * @returns The inputs as an object.
     */
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

        let result;

        // Check HTTP Request Headers
        result = this.checkRequestHeaders(req); 

        // All good? Validate incoming input values
        if (result.type == ResultType.Success && this._needToValidate) { result = this._handleValidate(context, req); }

        // All good? Execute the main function
        if (result.type == ResultType.Success) { result = await this._execute(context, req); }

        // Do we have an error?
        if (result.type == ResultType.Error) {

            // Hide error details from external callers.
            delete result.error.details;
            //const { details, name, ...err} = result.error;
            //result.error = err;
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

    /**
     * Checks the HTTP Request to see if it contains required headers.
     * @param req The HTTP Request to check.
     * @returns A Result indicating success or error.
     */
    private checkRequestHeaders(req: HttpRequest): Result<string> {
        if (this._headers) {
            for (const headerName in this._headers) {
                const headerValue = req.headers[headerName];
                if (headerValue && headerValue.includes(this._headers[headerName])) {
                    console.log(`Required header "${headerName}" with a value of "${this._headers[headerName]}" is present.`);

                } else {
                    console.error(`Required header "${headerName}" with a value of "${this._headers[headerName]}" is missing.`);
                    return {
                        type: ResultType.Error,
                        code: ApiResponseCode.BadRequest,
                        error: {
                            message: `Required header "${headerName}" with a value of "${this._headers[headerName]}" is missing.`, details: {}, name: "HeaderError"
                        }
                    }
                }
            }
        }

        return {
            type: ResultType.Success,
            value: "Validation succeeded.",
            code: ApiResponseCode.OK
        }
    }
}