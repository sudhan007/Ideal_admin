import { StoreType, StudentType } from "@types";
import { Context } from "elysia";
import { createOFFlineEnrollmenSchema } from "./course-enrollment.model";
import { getCollection } from "@lib/config/db.config";
import { BATCH_COLLECTION, COURSE_COLLECTION, STUDENT_COLLECTION } from "@lib/Db_collections";
import { ObjectId } from "mongodb";
import { enrollStudentInCourse } from "@lib/utils/course-enrollment";

export const OfflineCourseEnrollment = async (ctx: Context<{ body: createOFFlineEnrollmenSchema }>) => {
    const { body, set, store } = ctx;
    const { batchId, courseId, studentId } = body
    const { id, role } = store as StoreType
    try {
        const courseCollection = await getCollection(COURSE_COLLECTION);
        const studentCollection = await getCollection(STUDENT_COLLECTION);
        let courseExist = await courseCollection.findOne({ _id: new ObjectId(courseId), isDeleted: false, isActive: true });

        if (!courseExist) {
            set.status = 404;
            return {
                message: "Course not found",
                status: false,
            };
        }

        let studentExist = await studentCollection.findOne({ _id: new ObjectId(studentId), isDeleted: false, isActive: true });

        if (!studentExist) {
            set.status = 404;
            return {
                message: "Student not found",
                status: false,
            };
        }

        if (batchId) {
            const batchCollection = await getCollection(BATCH_COLLECTION);
            const batchExist = await batchCollection.findOne({
                _id: new ObjectId(batchId),
                isDeleted: false,
                isActive: true,
            });

            if (!batchExist) {
                set.status = 404;
                return {
                    message: "Batch not found",
                    status: false,
                };
            }
        }


        set.status = 200;
        const result = await enrollStudentInCourse({
            studentId,
            courseId,
            enrollmentType: StudentType.OFFLINE,
            enrolledBy: role,
            paymentId: null,
            batchId: batchId,
            enrolledById: id,
        });

        if (!result.success) {
            set.status = 400;
            return {
                message: result.message,
                status: false,
            };
        }

        return {
            message: "Student enrolled successfully",
            status: true,
        };

    } catch (error: any) {
        console.log("Offline Enrollment Error", error);
        set.status = 500;
        return {
            message: error?.message || "Something went wrong",
            status: false,
        };
    }
}