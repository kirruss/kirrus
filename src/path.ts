export type ExtractPathKeys<T extends string> = string extends T
    ? string[]
    : T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? [Param, ...ExtractPathKeys<Rest>]
    : T extends `${infer _Start}:${infer Param}`
    ? [Param]
    : []

type ParsedPath<P extends string> = {
    keys: ExtractPathKeys<P>
    pattern: RegExp
}

export const parse = <P extends string>(path: P, loose?: boolean): ParsedPath<P> => {
    const segments = path.replace("/", "").split("/")
    const keysAndPatterns = segments.map(segment => {
        const [firstChar] = segment
        if (firstChar === "*") {
            return { key: "wild", pattern: "" }
        } else if (firstChar === ":") {
            const [optional, extension] = [segment.indexOf("?", 1), segment.indexOf(".", 1)]
            const [hasOptional, hasExtension] = [optional !== -1, extension !== -1]

            const key = segment.slice(1, hasOptional ? optional : hasExtension ? extension : segment.length)
            const partialPattern = hasOptional && !hasExtension ? "(?:/([^/]+?))?" : "/([^/]+?)"
            const pattern = hasExtension
                ? `${partialPattern}${hasOptional ? "?" : ""}\\${segment.slice(extension)}`
                : partialPattern

            return { key, pattern }
        }
        return {
            key: null,
            pattern: `/${segment}`
        }
    })
    const keys = keysAndPatterns.reduce<string[]>((keys, { key }) => {
        if (key !== null) keys.push(key)
        return keys
    }, [])
    const pattern = keysAndPatterns.reduce((oldPattern, { pattern }) => `${oldPattern}${pattern}`, "")

    return {
        keys: keys as any,
        pattern: new RegExp("^" + pattern + (loose ? "(?=$|/)" : "/?$"), "i")
    }
}
