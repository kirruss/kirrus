import http from "http"
// import qs from "querystring"

import { Method, POST } from "./method"
import * as p from "./path"
import type * as r from "./route"
import * as url from "./url"
import { Cast, as } from "./types"

const addLead = (path: string) => {
    const [c] = path

    return c === "/" ? path : `/${path}`
}

type Route<P extends string> = {
    keys: p.ExtractPathKeys<P>
    pattern: RegExp
    method: Method
    guards: r.Guard[]
    handler: r.Handler<P>
}
type Routes<Paths extends readonly string[]> = Paths extends [infer P, ...infer R]
    ? [Route<Cast<P, string>>, ...Routes<Cast<R, readonly string[]>>]
    : Route<Paths[number]>[]

type FoundRoute<P extends string> = {
    params: { [k in p.ExtractPathKeys<P>[number]]: string }
    guards: r.Guard[]
    handler: r.Handler<P>
}

class Kirrus<Paths extends readonly string[] = []> {
    private routes: Routes<Paths>

    private port?: number
    private server?: http.Server

    public static kirrus() {
        return new Kirrus(as<[]>([]))
    }

    private constructor(routes: Routes<Paths>, port?: number) {
        this.routes = routes
        this.port = port
    }

    public route<P extends string>(method: Method, path: P, guards: r.Guard[], handler: r.Handler<P>) {
        const base = addLead(path) as P

        const { keys, pattern } = p.parse(base)

        const routes = as<Routes<[...Paths, P]>>(this.routes)
        // TODO: Figure out why TypeScript is dumb and expects a never
        routes.push(as<never /* ??? */>({ keys, pattern, method, guards, handler }))

        return new Kirrus(routes)
    }

    public bind(port: number) {
        this.port = port

        return this
    }

    private find<U extends string>(method: Method, url: U): FoundRoute<U> | null {
        const isHEAD = method === "HEAD"

        for (const r of this.routes) {
            const route = as<Route<U>>(r)
            if (route.method.length === 0 || route.method === method || (isHEAD && route.method === "GET")) {
                if (route.keys.length > 0) {
                    const matches = route.pattern.exec(url)
                    if (matches === null) continue

                    const { guards, handler } = route

                    const params = as<r.Params<U>>(
                        Object.fromEntries(as<p.ExtractPathKeys<U>>(route.keys).map((k, i) => [k, matches[i]]))
                    )

                    return { params, guards, handler }
                } else if (route.pattern.test(url)) {
                    const { guards, handler } = route

                    const params = as<r.Params<U>>({})
                    return { params, guards, handler }
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

        const route = this.find(as(req.method), info.pathname)
        if (!route) {
            res.statusCode = 404
            return res.end()
        }

        const { handler, params } = route

        const ctx = { params }

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

const { kirrus } = Kirrus

kirrus()
    .route(POST, "/auth/register", [], _ctx => "Registered successfully")
    .route(POST, "/auth/login", [], _ctx => "Logged in successfully")
    .bind(8080)
    .run()
