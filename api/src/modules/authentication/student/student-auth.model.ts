
import { t } from "elysia";

export const STUDENT_COLLECTION = "students";
export const OTP_COUNT_COLLECTION = "otp_count";


export const studentLoginDto = {
    body: t.Object({
        mobileNumber: t.Optional(t.String({ pattern: "^[0-9]{10}$" })),
        email: t.Optional(t.String({ format: "email" })),
        loginMethod: t.Union([t.Literal("MOBILE"), t.Literal("EMAIL")], { default: "MOBILE" }),
        fcmToken: t.Optional(t.String()),
    }),
    detail: {
        summary: "Login Student",
        description: "Login student with mobile number or email",
    },
};

export const sendOtpDto = {
    body: t.Object({
        mobile: t.String({
            examples: ["1234567890"]
        }),
        smsId: t.Optional(t.String({
            default: "",
            description: "Optional SMS ID for tracking purposes",
        })
        ),
    }),
    detail: {
        summary: "Send Otp",
        description: "Login student with mobile ",
    },
};

export const verifyOtpDto = {
    body: t.Object({
        otpId: t.String(),
        otpNo: t.String({ minLength: 4, maxLength: 6 }),
    }),
    detail: {
        summary: "Verify OTP ",
        description: "Verify OTP ",
    },
};


export type StudentLoginSchema = typeof studentLoginDto.body.static
export type OtpSchema = typeof sendOtpDto.body.static
export type verifyOtpSchema = typeof verifyOtpDto.body.static