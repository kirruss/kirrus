import type { Brand } from "./types"

type Methods = "GET" | "POST" | "PUT" | "DELETE" | "HEAD" | "OPTIONS" | "CONNECT" | "PATCH" | "TRACE"
export type Method = Brand<Methods, "method">

export const GET: Method = "GET" as Method
export const POST: Method = "POST" as Method
export const PUT: Method = "PUT" as Method
export const DELETE: Method = "DELETE" as Method
export const HEAD: Method = "HEAD" as Method
export const OPTIONS: Method = "OPTIONS" as Method
export const CONNECT: Method = "CONNECT" as Method
export const PATCH: Method = "PATCH" as Method
export const TRACE: Method = "TRACE" as Method

export const isSafe = (method: Method) => [GET, HEAD, OPTIONS, TRACE].includes(method)
export const isIdempotent = (method: Method) => [PUT, DELETE].includes(method) || isSafe(method)
