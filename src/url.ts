import type { IncomingMessage } from "http"

type ParsedUrl = {
    query: string | null
    search: string | null
    href: string
    path: string
    pathname: string
    _raw: string
}

export const parse = (req: IncomingMessage): ParsedUrl | null => {
    const url = req.url
    if (url === undefined) return null

    const queryChar = url.indexOf("?", 1)
    const hasQuery = queryChar !== -1

    const search = hasQuery ? url.slice(queryChar) : null
    const query = search?.slice(1) ?? null
    const pathname = hasQuery ? url.slice(0, queryChar) : url

    const href = url
    const path = url
    const _raw = url

    return { query, search, href, path, pathname, _raw }
}
