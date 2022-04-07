export enum ResultType {
    Success,
    Error
}

export type ResultTypeSuccess<T> = {
    type: ResultType,
    value?: T,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
}

export type ResultTypeError = {
    type: ResultType,
    message: string,
    name: string,
    details: unknown,
    code: number | undefined,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any
}

export type Result<T> = ResultTypeSuccess<T> | ResultTypeError

