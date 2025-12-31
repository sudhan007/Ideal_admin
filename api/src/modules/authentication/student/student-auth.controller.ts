import { Elysia } from "elysia";
import { sendOtp, studentLogin, verifyOtp } from "./student-auth.service";
import { sendOtpDto, studentLoginDto, verifyOtpDto } from "./student-auth.model";

export const studentAuthController = new Elysia({
    prefix: '/student-auth',
    detail: {
        tags: ['Student Authentication']
    }
})
    .post('/login', studentLogin, studentLoginDto)
    .post('/send-otp', sendOtp, sendOtpDto)
    .post('/verify-otp', verifyOtp, verifyOtpDto)