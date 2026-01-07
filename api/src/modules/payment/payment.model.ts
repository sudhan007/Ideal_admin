import { t } from "elysia"

export const RAZORPAY_COLLECTION = "razorpay"

export const createPaymentDto = {
    body: t.Object({
        amount: t.Number(),
        course: t.String(),
        student: t.String(),
    }),
    detail: {
        summary: "Create RazorPay Order",
        description: "Schema for creating a RazorPay order"
    }
}

export type createPaymentSchema = typeof createPaymentDto.body.static