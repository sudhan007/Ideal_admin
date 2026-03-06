import Elysia from "elysia";
import { createPaymentOrder } from "./payment.service";
import { createPaymentDto } from "./payment.model";
import { studentOnly } from "@lib/utils/roles-guard";

export const paymentController = new Elysia({
    prefix: "/payment",
    detail: {
        tags: ["Payment Gateway"]
    }
})

    .post("/create-payorder", createPaymentOrder, { ...createPaymentDto, beforeHandle: studentOnly })
