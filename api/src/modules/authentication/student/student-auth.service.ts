import { Context } from "elysia";
import { OtpSchema, StudentLoginSchema, verifyOtpSchema, } from "./student-auth.model";
import { getCollection } from "@lib/config/db.config";
import axios from "axios";
import { EncodePaseto } from "@lib/utils/paseto";
import { RoleType, StudentType } from "@types";
import { OTP_COUNT_COLLECTION, STUDENT_COLLECTION } from "@lib/Db_collections";
import { subscribeStudentToTopic, updateStudentFcmToken } from "@lib/utils/notification";

export const studentLogin = async (ctx: Context<{ body: StudentLoginSchema }>) => {
    const { body, set } = ctx;
    const { email, loginMethod, mobileNumber, fcmToken } = body;

    try {
        const studentCollection = await getCollection(STUDENT_COLLECTION);

        if (loginMethod === "MOBILE") {
            if (!mobileNumber) {
                set.status = 400;
                return {
                    message: "Mobile number is required for mobile login",
                    status: false,
                };
            }

            let student = await studentCollection.findOne({ mobileNumber });

            if (student) {

                if (fcmToken && student.fcmToken !== fcmToken) {
                    await updateStudentFcmToken(student.fcmToken, fcmToken);
                    await studentCollection.updateOne(
                        { _id: student._id },
                        { $set: { fcmToken, updatedAt: new Date() } }
                    );
                } else if (fcmToken && !student.fcmToken) {
                    await subscribeStudentToTopic(fcmToken);
                    await studentCollection.updateOne(
                        { _id: student._id },
                        { $set: { fcmToken, updatedAt: new Date() } }
                    );
                }

                const token = await EncodePaseto({
                    id: student._id.toString(),
                    mobileNumber: student.mobileNumber,
                    role: RoleType.STUDENT,
                });

                return {
                    message: "Login successful",
                    status: true,
                    token,
                    isNewUser: false,
                };
            }

            const newStudent = {
                mobileNumber,
                email: "",
                loginMethod: "MOBILE",
                fcmToken: fcmToken || "",
                isActive: true,
                isDeleted: false,
                registrationComplete: false,
                studentType: StudentType.ONLINE,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await studentCollection.insertOne(newStudent);
            student = { _id: result.insertedId, ...newStudent };

            if (fcmToken) {
                await subscribeStudentToTopic(fcmToken);
            }


            const token = await EncodePaseto({
                id: student._id.toString(),
                mobileNumber: student.mobileNumber,
                role: RoleType.STUDENT,
            });

            return {
                message: "Account created successfully",
                status: true,
                token,
                isNewUser: true,
            };
        } else if (loginMethod === "EMAIL") {
            if (!email) {
                set.status = 400;
                return {
                    message: "Email is required for email/Google login",
                    status: false,
                };
            }

            let student = await studentCollection.findOne({ email });

            if (student) {

                if (fcmToken && student.fcmToken !== fcmToken) {
                    await updateStudentFcmToken(student.fcmToken, fcmToken);
                    await studentCollection.updateOne(
                        { _id: student._id },
                        { $set: { fcmToken, updatedAt: new Date() } }
                    );
                } else if (fcmToken && !student.fcmToken) {
                    await subscribeStudentToTopic(fcmToken);
                    await studentCollection.updateOne(
                        { _id: student._id },
                        { $set: { fcmToken, updatedAt: new Date() } }
                    );
                }

                const token = await EncodePaseto({
                    id: student._id.toString(),
                    mobileNumber: student.mobileNumber,
                    role: RoleType.STUDENT,
                });

                return {
                    message: "Login successful",
                    status: true,
                    token,
                    isNewUser: false,
                };
            }

            if (mobileNumber && mobileNumber.trim() !== "") {
                const mobileExists = await studentCollection.findOne({ mobileNumber });
                if (mobileExists) {
                    set.status = 409;
                    return {
                        message: "This mobile number is already registered with another account",
                        status: false,
                    };
                }
            }

            const newStudent = {
                email,
                mobileNumber: mobileNumber || "",
                loginMethod: "EMAIL",
                fcmToken: fcmToken || "",
                isActive: true,
                isDeleted: false,
                registrationComplete: false,
                studentType: StudentType.ONLINE,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            const result = await studentCollection.insertOne(newStudent);
            student = { _id: result.insertedId, ...newStudent };

            if (fcmToken) {
                await subscribeStudentToTopic(fcmToken);
            }

            const token = await EncodePaseto({
                id: student._id.toString(),
                mobileNumber: student.mobileNumber,
                role: RoleType.STUDENT,
            });

            return {
                message: "Account created successfully",
                status: true,
                token,
                isNewUser: true,
            };
        }

        set.status = 400;
        return {
            message: "Invalid login method",
            status: false,
        };

    } catch (error) {
        console.log("Student login error", error);
        set.status = 500;
        return { error: "Login failed", status: false };
    }
};
export const sendOtp = async (ctx: Context<{ body: OtpSchema }>) => {
    const { body, set } = ctx;
    const { mobile, smsId } = body;

    const exceptionalNumbers = [
        "9074914469",
        "+919074914469",
        "+91 9074914469",
    ];

    try {
        if (!mobile || !smsId) {
            set.status = 400;
            return {
                message: "Mobile number and SMS ID are required",
                status: false,
            };
        }

        // Exceptional numbers (no real OTP)
        if (exceptionalNumbers.includes(mobile)) {
            return {
                message: "OTP sent successfully",
                status: true,
                otpId: "SEND_000000",
            };
        }

        const response = await axios.post(
            "https://www.xopay.in/api/v2/otp/otp",
            {
                phone: mobile,
                comapny_name: "Ideal Academy",
                ...(smsId !== "-" ? { sms_id: smsId } : {}),
            }
        );

        if (!response.data?.status) {
            set.status = 500;
            return {
                message: "Failed to send OTP",
                status: false,
            };
        }

        // ===== OTP COUNT LOGIC (FIXED) =====
        const otpCollection = await getCollection(OTP_COUNT_COLLECTION);

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        await otpCollection.updateOne(
            { month, year },
            { $inc: { count: 1 } },
            { upsert: true }
        );
        // ==================================

        return {
            message: "OTP sent successfully",
            status: true,
            otpId: response.data.id,
        };
    } catch (error: any) {
        console.error("Send otp error:", error);
        set.status = 500;
        return {
            message: error.message || "Internal Server Error",
            status: false,
        };
    }
};
export const verifyOtp = async ({ body, set }: Context<{ body: verifyOtpSchema }>) => {
    const { otpId, otpNo } = body;

    if (!otpId || !otpNo) {
        return {
            message: "OTP ID and OTP number are required",
            status: false,
        };
    }

    if (otpId === "SEND_000000") {
        return {
            message: "OTP verified successfully",
            status: true,
        };
    }

    try {
        const response = await axios.post(
            "https://www.xopay.in/api/v2/otp/otpverify",
            {
                id: otpId,
                otp_no: otpNo,
            }
        );

        if (response.data.status) {
            return {
                message: "OTP verified successfully",
                status: true,
            };
        } else {
            set.status = 400
            return {
                message: "Failed to verify OTP",
                status: false,
                response: response.data
            };
        }
    } catch (error: any) {
        console.error("Failed to verify OTP:", error);
        return {
            error: error.message,
            status: false,
        };
    }

};