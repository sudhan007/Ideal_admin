import { Context } from "elysia";
import { createPaymentSchema, RAZORPAY_COLLECTION } from "./payment.model";
import { getCollection } from "@lib/config/db.config";
import { COURSE_COLLECTION } from "modules/courses/course.model";
import { ObjectId } from "mongodb";
import { STUDENT_COLLECTION } from "modules/authentication/student/student-auth.model";
import { razorPayInstance } from "@lib/utils/razorpay";
import { enrollStudentInCourse } from "@lib/utils/course-enrollment";

export const createPaymentOrder = async (ctx: Context<{ body: createPaymentSchema }>) => {
    const { body, set } = ctx;
    const { amount, course, student } = body
    try {
        const courseCollection = await getCollection(COURSE_COLLECTION);
        const studentCollection = await getCollection(STUDENT_COLLECTION);
        const razorpayCollection = await getCollection(RAZORPAY_COLLECTION);
        let courseExist = await courseCollection.findOne({ _id: new ObjectId(course), isDeleted: false, isActive: true });

        if (!courseExist) {
            set.status = 404;
            return {
                message: "Course not found",
                status: false,
            };
        }

        let studentExist = await studentCollection.findOne({ _id: new ObjectId(student), isDeleted: false, isActive: true });

        if (!studentExist) {
            set.status = 404;
            return {
                message: "Student not found",
                status: false,
            };
        }

        // const response: any = await razorPayInstance.orders.create({
        //     amount: Number(amount) * 100,
        //     currency: "INR",
        // });
        // console.log(JSON.stringify(response), 'response')
        // if (response?.error) {
        //     set.status = 400;
        //     return { message: "Failed to create order", status: false };
        // }

        const razorPayData = {
            studentId: new ObjectId(student),
            courseId: new ObjectId(course),
            // razorPayOrderId: response?.id,
            razorPayOrderId: "1212212",
            amount: Number(amount),
            status: "created",
            createdBy: new ObjectId(student),
        };

        await razorpayCollection.insertOne(razorPayData);

        set.status = 200;
        const paymentId = "12121"
        const result = await enrollStudentInCourse(student, course, paymentId);

        if (!result.success) {
            set.status = 400;
            return {
                message: result.message,
                status: false,
            };
        }

        return {
            message: "Order created successfully",
            status: true,
        };

    } catch (error: any) {
        console.log("Payment Creation Error", error);
        set.status = 500;
        return {
            message: error?.message || "Something went wrong",
            status: false,
        };
    }
}