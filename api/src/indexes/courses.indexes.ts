import { getCollection } from "@lib/config/db.config";
import { COURSE_COLLECTION, COURSE_ENROLLMENT_COLLECTION, COURSE_FORECASTING, COURSE_PROGRESS_COLLECTION } from "@lib/Db_collections";


export const createCourseIndexes = async () => {
    try {
        const coursesCollection = await getCollection(COURSE_COLLECTION);
        await coursesCollection.createIndex({ courseName: 1 }, { unique: true })
        await coursesCollection.createIndex({ board: 1 })
        await coursesCollection.createIndex({ grade: 1 })
        await coursesCollection.createIndex({ isTrending: 1 })
        console.log("Course indexes created successfully");
    } catch (error) {
        console.log(error)
    }
}

export const enrollCourseIndexes = async () => {
    try {
        const coursesCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        await coursesCollection.createIndex({ studentId: 1 })
        await coursesCollection.createIndex({ courseId: 1 })
        console.log("Course indexes created successfully");
    } catch (error) {
        console.log(error)
    }
}

export const courseForeCatsingindexs = async () => {
    try {
        const coursesCollection = await getCollection(COURSE_FORECASTING);
        await coursesCollection.createIndex({ enrollmentId: 1 })
        await coursesCollection.createIndex({ courseId: 1 })
        await coursesCollection.createIndex({ studentId: 1 })

        console.log("Course indexes created successfully");
    } catch (error) {
        console.log(error)
    }
}

export const courseProgressIndexes = async () => {
    try {
        const coursesCollection = await getCollection(COURSE_PROGRESS_COLLECTION);
        await coursesCollection.createIndex({ enrollmentId: 1 })
        await coursesCollection.createIndex({ courseId: 1 })
        await coursesCollection.createIndex({ studentId: 1 })

        console.log("Course indexes created successfully");
    } catch (error) {
        console.log(error)
    }
}