import type { Method } from "./method"
import type { RequestHead } from "./request"

export type Guard = (req: RequestHead) => boolean
export type Handler = () => string

export type Route<P> = {
    method: Method
    path: P
    guards: Guard[]
    handler: Handler
}
