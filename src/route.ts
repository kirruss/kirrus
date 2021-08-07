import type { Method } from "./method"
import type { ExtractPathKeys } from "./path"
import type { RequestHead } from "./request"
import type { Runtype } from "./validation"

export type Guard = (req: RequestHead) => boolean
export type Validator<P extends string, Q extends string> = {
    params: Runtype<{ [k in keyof Params<P>]: string }>
    query: Runtype<{ [k in Q]: string[] | string | undefined }>
}

export type Params<P extends string> = { [k in ExtractPathKeys<P>[number]]: string }
type Query<Q extends string> = { [k in Q]: string[] | string | undefined }
type Context<P extends string, Q extends string> = {
    params: Params<P>
    query: Query<Q>
}
export type Handler<P extends string, Q extends string> = (ctx: Context<P, Q>) => string

export type Route<P extends string, Q extends string> = {
    method: Method
    path: P
    guards: Guard[]
    validator: Validator<P, Q>
    handler: Handler<P, Q>
}
