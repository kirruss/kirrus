import http from "http"
import qs from "querystring"

import type { Method } from "./method"
import * as p from "./path"
import type * as r from "./route"
import * as url from "./url"
import { Cast, as } from "./types"

const addLead = (path: string) => {
    const [c] = path

    return c === "/" ? path : `/${path}`
}

type Route<P extends string, Q extends string> = {
    keys: p.ExtractPathKeys<P>
    pattern: RegExp
    method: Method
    validator: r.Validator<P, Q>
    guards: r.Guard[]
    handler: r.Handler<P, Q>
}
type Arg = { path: string; query: string }
type Routes<Args extends readonly Arg[]> = Args extends [infer A, ...infer R]
    ? [Route<Cast<A, Arg>["path"], Cast<A, Arg>["query"]>, ...Routes<Cast<R, readonly Arg[]>>]
    : Route<Args[number]["path"], Args[number]["query"]>[]

type FoundRoute<P extends string, Q extends string> = {
    params: { [k in p.ExtractPathKeys<P>[number]]: string }
    validator: r.Validator<P, Q>
    guards: r.Guard[]
    handler: r.Handler<P, Q>
}

class Kirrus<Args extends readonly Arg[] = []> {
    private routes: Routes<Args>

    private port?: number
    private server?: http.Server

    public static kirrus() {
        return new Kirrus(as<[]>([]))
    }

    private constructor(routes: Routes<Args>, port?: number) {
        this.routes = routes
        this.port = port
    }

    public route<P extends string, Q extends string>(
        method: Method,
        path: P,
        validator: r.Validator<P, Q>,
        guards: r.Guard[],
        handler: r.Handler<P, Q>
    ) {
        const base = addLead(path) as P

        const { keys, pattern } = p.parse(base)

        const routes = as<Routes<[...Args, { path: P; query: Q }]>>(this.routes)
        // TODO: Figure out why TypeScript is dumb and expects a never
        routes.push(as<never /* ??? */>({ keys, pattern, method, guards, validator, handler }))

        return new Kirrus(routes)
    }

    public bind(port: number) {
        this.port = port

        return this
    }

    private find<U extends string, Q extends string>(method: Method, url: U): FoundRoute<U, Q> | null {
        const isHEAD = method === "HEAD"

        for (const r of this.routes) {
            const route = as<Route<U, Q>>(r)
            if (route.method.length === 0 || route.method === method || (isHEAD && route.method === "GET")) {
                if (route.keys.length > 0) {
                    const matches = route.pattern.exec(url)
                    if (matches === null) continue

                    const { validator, guards, handler } = route

                    const params = as<r.Params<U>>(
                        Object.fromEntries(as<p.ExtractPathKeys<U>>(route.keys).map((k, i) => [k, matches[i + 1]]))
                    )

                    return { params, validator, guards, handler }
                } else if (route.pattern.test(url)) {
                    const { validator, guards, handler } = route

                    const params = as<r.Params<U>>({})
                    return { params, validator, guards, handler }
                }
            }
        }

        return null
    }

    private handler(req: http.IncomingMessage, res: http.ServerResponse) {
        const info = url.parse(req)
        if (!info) {
            res.statusCode = 404
            return res.end()
        }

        const query = info.query !== null ? qs.parse(info.query) : {}

        const route = this.find(as(req.method), info.pathname)
        if (!route) {
            res.statusCode = 404
            return res.end()
        }

        const { handler, params } = route

        const ctx = { params, query }

        res.statusCode = 200
        res.write(handler(ctx))
        res.end()
    }

    public run() {
        this.server = http.createServer()
        this.server.on("request", (req, res) => this.handler(req, res))

        this.server.listen(this.port)
    }
}

export const { kirrus } = Kirrus
