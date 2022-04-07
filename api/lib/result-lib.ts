export enum ResultType {
    Success,
    Error
}

export type ResultTypeSuccess<T> = {
    type: ResultType,
    value?: T,
    [ key: string ]: any
}

export type ResultTypeError = {
    type: ResultType,
    message: string,
    name: string,
    details: any
    [ key: string ]: any
}

export type Result<T> = ResultTypeSuccess<T> | ResultTypeError

