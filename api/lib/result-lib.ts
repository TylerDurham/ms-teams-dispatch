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