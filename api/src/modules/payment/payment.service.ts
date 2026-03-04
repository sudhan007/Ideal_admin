import { Context } from "elysia";
import { createPaymentSchema } from "./payment.model";
import { getCollection } from "@lib/config/db.config";
import { ObjectId } from "mongodb";
import { enrollStudentInCourse } from "@lib/utils/course-enrollment";
import { StoreType, StudentType } from "@types";
import { COURSE_COLLECTION, RAZORPAY_COLLECTION, STUDENT_COLLECTION } from "@lib/Db_collections";

export const createPaymentOrder = async (ctx: Context<{ body: createPaymentSchema }>) => {
    const { body, set, store } = ctx;
    const { amount, course } = body
    const { id: student, role } = store as StoreType



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
        const result = await enrollStudentInCourse({
            studentId: student,
            courseId: course,
            enrollmentType: StudentType.ONLINE,
            enrolledBy: role,
            paymentId,
            batchId: null,
            enrolledById: student
        });


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