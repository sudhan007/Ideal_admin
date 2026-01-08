import { getCollection } from "@lib/config/db.config";
import { COURSE_COLLECTION, COURSE_ENROLLMENT_COLLECTION, COURSE_FORECASTING, LESSON_COLLECTION, LESSON_PROGRESS_COLLECTION, STUDENT_COLLECTION } from "@lib/Db_collections";
import { ObjectId } from "mongodb";

export interface CourseEnrollment {
    _id?: any;
    studentId: any;
    courseId: any;
    enrolledAt: Date;
    paymentId?: any; // Reference to razorpay collection
    status: "active" | "completed" | "suspended";
    overallProgress: number; // 0-100
    completedChapters: any[];
    lastAccessedAt?: Date;
    certificateIssued: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface LessonProgress {
    _id?: any;
    enrollmentId: any;
    studentId: any;
    courseId: any;
    chapterId: any;
    lessonId: any;
    videoProgress: {
        totalDuration: number; // in seconds
        watchedDuration: number; // in seconds
        watchedPercentage: number; // 0-100
        lastWatchedPosition: number; // in seconds
        isCompleted: boolean;
    };
    quizProgress: {
        attempted: boolean;
        passed: boolean;
        score?: number;
        totalQuestions?: number;
        correctAnswers?: number;
        attemptedAt?: Date;
    };
    lessonCompleted: boolean; // Video watched + Quiz passed
    completedAt?: Date;
    lastAccessedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}


/**
 * Enroll a student in a course
 */
export const enrollStudentInCourse = async (
    studentId: string,
    courseId: string,
    paymentId?: string
): Promise<{ success: boolean; message: string; enrollmentId?: string }> => {
    try {
        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        const courseCollection = await getCollection(COURSE_COLLECTION);
        const studentCollection = await getCollection(STUDENT_COLLECTION);
        const forecastingCollection = await getCollection(COURSE_FORECASTING);
        // Verify course exists
        const course = await courseCollection.findOne({
            _id: new ObjectId(courseId),
            isDeleted: false,
            isActive: true,
        });

        if (!course) {
            return { success: false, message: "Course not found" };
        }

        // Verify student exists
        const student = await studentCollection.findOne({
            _id: new ObjectId(studentId),
            isDeleted: false,
            isActive: true,
        });

        if (!student) {
            return { success: false, message: "Student not found" };
        }

        // Check if already enrolled
        const existingEnrollment = await enrollmentCollection.findOne({
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(courseId),
            isDeleted: false,
        });

        if (existingEnrollment) {
            return {
                success: false,
                message: "Student is already enrolled in this course",
            };
        }

        // Create enrollment
        const enrollmentData: CourseEnrollment = {
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(courseId),
            enrolledAt: new Date(),
            paymentId: paymentId ? new ObjectId(paymentId) : undefined,
            status: "active",
            overallProgress: 0,
            completedChapters: [],
            certificateIssued: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await enrollmentCollection.insertOne(enrollmentData);

        // Initialize progress for all lessons
        await initializeLessonProgress(
            result.insertedId.toString(),
            studentId,
            courseId
        );

        const forecastingData = {
            enrollmentId: new ObjectId(result.insertedId.toString()),
            courseId: new ObjectId(courseId),
            studentId: new ObjectId(studentId),
            currentAttempt: 1,
            remainingAttempts: 3,                // Starts with 3 attempts
            daysPerWeek: null,                   // User hasn't set yet
            hoursPerDay: null,                   // User hasn't set yet
            expectedCompletionDate: null,        // Calculated later when user sets schedule
            lastSetupAt: null,                   // Timestamp when user last updated schedule
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        await forecastingCollection.insertOne(forecastingData);

        return {
            success: true,
            message: "Successfully enrolled in course",
            enrollmentId: result.insertedId.toString(),
        };
    } catch (error: any) {
        console.error("Error enrolling student:", error);
        return {
            success: false,
            message: error?.message || "Failed to enroll student",
        };
    }
}
/**
 * Initialize lesson progress for all lessons in a course
 */
const initializeLessonProgress = async (
    enrollmentId: string,
    studentId: string,
    courseId: string
): Promise<void> => {
    try {
        const lessonCollection = await getCollection(LESSON_COLLECTION);
        const progressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        const lessons = await lessonCollection
            .find({
                courseId: new ObjectId(courseId),
                isDeleted: false,
                isActive: true,
            })
            .toArray();

        const progressRecords: LessonProgress[] = lessons.map((lesson) => ({
            enrollmentId: new ObjectId(enrollmentId),
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(courseId),
            chapterId: lesson.chapterId,
            lessonId: lesson._id,
            videoProgress: {
                totalDuration: 0,
                watchedDuration: 0,
                watchedPercentage: 0,
                lastWatchedPosition: 0,
                isCompleted: false,
            },
            quizProgress: {
                attempted: false,
                passed: false,
            },
            lessonCompleted: false,
            lastAccessedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        if (progressRecords.length > 0) {
            await progressCollection.insertMany(progressRecords);
        }
    } catch (error) {
        console.error("Error initializing lesson progress:", error);
        throw error;
    }
};

