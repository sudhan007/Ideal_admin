import { closeDB } from "@lib/config/db.config";
import { courseForeCatsingindexs, courseProgressIndexes, createCourseIndexes, enrollCourseIndexes } from "./courses.indexes";
import { createStaffIndexes } from "./staffs.indexes";
import { createStudentIndexes } from "./student.indexes";
import { attendanceSessionIndexes, batchenrollmentsIndexes, batchIndexes, studentAttendanceIndexes } from "./batch.indexes";
import { chapterIndexes, chapterProgressIndexes } from "./chapter.indexes";
import { lessonIndexes, lessonProgressIndexes } from "./lesson.indexes";
import { questionattemptsIndexes, questionIndexes } from "./question.indexes";
import { createTaskIndexes, createTaskSubmissionHistoryIndexes, createTaskSubmissionIndexes, createTaskSubmissionTimeLineIndexes } from "./task.indexes";

const createIndexes = async () => {
    try {
        await Promise.all([
            createCourseIndexes(),
            enrollCourseIndexes(),
            courseForeCatsingindexs(),
            courseProgressIndexes(),
            createStaffIndexes(),
            batchIndexes(),
            batchenrollmentsIndexes(),
            attendanceSessionIndexes(),
            studentAttendanceIndexes(),
            chapterIndexes(),
            chapterProgressIndexes(),
            lessonIndexes(),
            lessonProgressIndexes(),
            questionIndexes(),
            questionattemptsIndexes(),
            createTaskIndexes(),
            createTaskSubmissionIndexes(),
            createTaskSubmissionHistoryIndexes(),
            createTaskSubmissionTimeLineIndexes(),
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