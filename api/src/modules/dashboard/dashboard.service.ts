import { getCollection } from "@lib/config/db.config";
import { Context } from "elysia";

export const getTotalCounts = async (ctx: Context) => {
    const { set } = ctx;

    try {
        // Get all required collections
        const [
            studentsCol,
            coursesCol,
            enrollmentsCol,
            staffsCol,
            batchesCol
        ] = await Promise.all([
            getCollection("students"),
            getCollection("courses"),
            getCollection("course_enrollments"),
            getCollection("staffs"),
            getCollection("batches")
        ]);

        // Run all count queries in parallel
        const [
            totalStudents,
            totalCourses,
            totalEnrollments,
            totalStaffs,
            totalBatches
        ] = await Promise.all([
            studentsCol.countDocuments({ isDeleted: false, isActive: true }),
            coursesCol.countDocuments({ isDeleted: false, isActive: true }),
            enrollmentsCol.countDocuments(),
            staffsCol.countDocuments({ isDeleted: false, isActive: true }),
            batchesCol.countDocuments({ isDeleted: false, isActive: true })
        ]);

        set.status = 200;
        return {
            status: true,
            message: "Total counts fetched successfully",
            data: {
                students: totalStudents,
                courses: totalCourses,
                enrollments: totalEnrollments,
                staffs: totalStaffs,
                batches: totalBatches
            }
        };

    } catch (error: any) {
        console.error("Total counts error:", error);
        set.status = 500;
        return {
            status: false,
            error: "Failed to fetch total counts",
            details: error.message
        };
    }
};