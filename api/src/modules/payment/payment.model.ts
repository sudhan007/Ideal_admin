import { t } from "elysia"


export const createPaymentDto = {
    body: t.Object({
        amount: t.Number(),
        course: t.String(),
    }),
    detail: {
        summary: "Create RazorPay Order",
        description: "Schema for creating a RazorPay order"
    }
}

export type createPaymentSchema = typeof createPaymentDto.body.static