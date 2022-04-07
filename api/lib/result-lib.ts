export enum ResultType {
    Success,
    Error
}

export type ResultTypeSuccessWithType<T> = {
    type: ResultType,
    value?: T,
    [ key: string ]: any
}

export type ResultTypeSuccess = {
    type: ResultType,
    value?: any,
    [ key: string ]: any
}

export type ResultTypeError = {
    type: ResultType,
    message: string,
    name: string,
    details: any,
    code: number | undefined,
    [ key: string ]: any
}

export type Result<T> = ResultTypeSuccess | ResultTypeSuccessWithType<T> | ResultTypeError

