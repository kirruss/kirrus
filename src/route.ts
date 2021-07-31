import type { Method } from "./method"
import type { ExtractPathKeys } from "./path"
import type { RequestHead } from "./request"

export type Guard = (req: RequestHead) => boolean

export type Params<P extends string> = { [k in ExtractPathKeys<P>[number]]: string }
type Context<P extends string> = {
    params: { [k in ExtractPathKeys<P>[number]]: string }
}
export type Handler<P extends string> = (ctx: Context<P>) => string

export type Route<P extends string> = {
    method: Method
    path: P
    guards: Guard[]
    handler: Handler<P>
}
