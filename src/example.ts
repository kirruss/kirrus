import { kirrus } from "."
import { POST } from "./method"
import { Record, String } from "./validation"

kirrus()
    .route(
        POST,
        "/auth/register/:id",
        {
            params: Record({ id: String }),
            query: Record({ amount: String })
        },
        [],
        ({ params: { id }, query: {} }) => `Registered successfully with the id ${id}`
    )
    .bind(8080)
    .run()
