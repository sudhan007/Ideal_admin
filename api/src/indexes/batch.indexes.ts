import { getCollection } from "@lib/config/db.config";
import { ATTENDANCE_SESSION_COLLECTION, BATCH_COLLECTION, BATCH_ENROLLMENTS_COLLECTION, STUDENT_ATTENDANCE_COLLECTION } from "@lib/Db_collections";


export const batchIndexes = async () => {
    try {
        const batchCollection = await getCollection(BATCH_COLLECTION);
        await batchCollection.createIndex({ courseId: 1 })
        await batchCollection.createIndex({ batchName: 1 })
        console.log("Course indexes created successfully");
    } catch (error) {
        console.log(error)
    }
}

export const batchenrollmentsIndexes = async () => {
    try {
        const batchCollection = await getCollection(BATCH_ENROLLMENTS_COLLECTION);
        await batchCollection.createIndex({ batchId: 1 })
        await batchCollection.createIndex({ courseId: 1 })
        await batchCollection.createIndex({ studentId: 1 })

        console.log("Course indexes created successfully");
    } catch (error) {
        console.log(error)
    }
}

export const attendanceSessionIndexes = async () => {
    try {
        const batchCollection = await getCollection(ATTENDANCE_SESSION_COLLECTION);
        await batchCollection.createIndex({ batchId: 1 })

        console.log("Course indexes created successfully");
    } catch (error) {
        console.log(error)
    }
}


export const studentAttendanceIndexes = async () => {
    try {
        const batchCollection = await getCollection(STUDENT_ATTENDANCE_COLLECTION);
        await batchCollection.createIndex({ batchId: 1 })

        console.log("Course indexes created successfully");
    } catch (error) {
        console.log(error)
    }
}