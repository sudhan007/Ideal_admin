import { closeDB } from "../lib/config/db.config";
import { createCourseIndexes } from "./courses.indexes";
import { createStaffIndexes } from "./staffs.indexes";
import { createStudentIndexes } from "./student.indexes";

const createIndexes = async () => {
    try {
        await Promise.all([
            createCourseIndexes(),
            createStaffIndexes(),
            createStudentIndexes()
        ]);
        console.log('indexes created');
    } catch (error) {
        console.error('Error creating indexes:', error);
    } finally {
        await closeDB();
        process.exit(0);
    }
}

createIndexes();