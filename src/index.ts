import http from "http"
import qs from "querystring"

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
    handler: r.Handler
}
type Routes<Paths extends readonly string[]> = Paths extends [infer P, ...infer R]
    ? [Route<Cast<P, string>>, ...Routes<Cast<R, readonly string[]>>]
    : []

type FoundRoute<P extends string> = {
    params: p.ExtractPathKeys<P> | null
    guards: r.Guard[]
    handler: r.Handler
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

    public route<P extends string>(route: r.Route<P>) {
        const base = addLead(route.path) as P

        const { keys, pattern } = p.parse(base)
        const { method, guards, handler } = route

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
            const route = as<Route<Paths[number]>>(r)
            if (route.method.length === 0 || route.method === method || (isHEAD && route.method === "GET")) {
                if (route.keys.length > 0) {
                    const matches = route.pattern.exec(url)
                    if (matches === null) continue

                    const { guards, handler } = route

                    const params = as<p.ExtractPathKeys<U>>(
                        Object.fromEntries(as<Paths[number][]>(route.keys).map((k, i) => [k, matches[i]]))
                    )

                    return { params, guards, handler }
                } else if (route.pattern.test(url)) {
                    const { guards, handler } = route

                    return { params: null, guards, handler }
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

        const { handler } = route

        res.statusCode = 200
        res.write(handler())
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
    .route({
        method: POST,
        path: "/auth/register",
        guards: [],
        handler: () => "Registered successfully"
    })
    .route({
        method: POST,
        path: "/auth/login",
        guards: [],
        handler: () => "Logged in successfully"
    })
    .bind(8080)
    .run()
