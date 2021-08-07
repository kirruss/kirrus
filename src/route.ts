import type { Method } from "./method"
import type { ExtractPathKeys } from "./path"
import type { RequestHead } from "./request"
import type { Runtype } from "./validation"

export type Guard = (req: RequestHead) => boolean
export type Validator<P extends string, Qs extends readonly string[] = []> = {
    params: Runtype<{ [k in keyof Params<P>]: string }>
    query: Runtype<{ [k in Qs[number]]: string[] | string | undefined }>
}

export type Params<P extends string> = { [k in ExtractPathKeys<P>[number]]: string }
type Queries<Qs extends readonly string[]> = { [k in Qs[number]]: string[] | string | undefined }
type Context<P extends string, Qs extends readonly string[]> = {
    params: Params<P>
    query: Queries<Qs>
}
export type Handler<P extends string, Qs extends readonly string[]> = (ctx: Context<P, Qs>) => string

export type Route<P extends string, Qs extends readonly string[]> = {
    method: Method
    path: P
    guards: Guard[]
    validator: Validator<P, Qs>
    handler: Handler<P, Qs>
}
