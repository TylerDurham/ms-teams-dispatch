export enum ResultType {
    Success,
    Error
}

export type ResultBase = {
    type: ResultType,
    code: number 
}

export type ResultSuccess<T> = {
    type: ResultType.Success,
    code: 200,
    value: T
}

export type ResultError = {
    type: ResultType.Error,
    code: number,
    error: {
        message: string,
        name: string,
        details: unknown
    }
}

export type Result<T> = ResultSuccess<T> | ResultError

