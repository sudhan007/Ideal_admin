import { getCollection } from "../lib/config/db.config";

const COURSES_COLLECTION = "courses";

export const createCourseIndexes = async () => {
    try {
        const coursesCollection = await getCollection(COURSES_COLLECTION);
        await coursesCollection.createIndex({ courseName: 1 }, { unique: true });
        console.log("Course indexes created successfully");
    } catch (error) {
        console.log(error)
    }
}
