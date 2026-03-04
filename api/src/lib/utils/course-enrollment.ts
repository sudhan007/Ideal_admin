import { getCollection } from "@lib/config/db.config";
import { BATCH_ENROLLMENTS_COLLECTION, CHAPTERS_COLLECTION, CHAPTER_PROGRESS_COLLECTION, COURSE_COLLECTION, COURSE_ENROLLMENT_COLLECTION, COURSE_FORECASTING, COURSE_PROGRESS_COLLECTION, LESSONS_COLLECTION, LESSON_PROGRESS_COLLECTION, STUDENT_COLLECTION } from "@lib/Db_collections";
import { RoleType, StudentType } from "@types";
import { ObjectId } from "mongodb";

export interface CourseEnrollment {
    _id?: any;
    studentId: any;
    courseId: any;
    enrolledAt: Date;
    enrollmentType: StudentType;
    enrolledById?: any;
    enrolledBy: RoleType;
    batchId?: any;
    paymentId?: any;
    status: "active" | "completed" | "suspended";
    overallProgress: number;
    completedChapters: any[];
    lastAccessedAt?: Date;
    certificateIssued: boolean;
    createdAt: Date;
    updatedAt: Date;
}
// Types/Interfaces
// Lesson Progress - Individual document
interface LessonProgress {
    enrollmentId: ObjectId;
    studentId: ObjectId;
    courseId: ObjectId;
    chapterId: ObjectId;
    lessonId: ObjectId;
    videoWatchedSeconds: number;
    videoTotalSeconds: number;
    videoCompletionPercentage: number;
    quizPassed: boolean;
    lessonCompletionPercentage: number;
    isLessonCompleted: boolean,
    lastWatchedAt: Date;
    completedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Chapter Progress - Individual document
interface ChapterProgress {
    _id?: ObjectId;
    enrollmentId: ObjectId;
    studentId: ObjectId;
    courseId: ObjectId;
    chapterId: ObjectId;
    totalLessons: number;
    completedLessons: number;
    chapterCompletionPercentage: number;
    lastUpdatedAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Course Enrollment Progress - Main document
interface CourseEnrollmentProgress {
    _id?: ObjectId;
    enrollmentId: ObjectId;
    studentId: ObjectId;
    courseId: ObjectId;
    overallProgress: number;
    totalChapters: number;
    completedChapters: number;
    createdAt: Date;
    updatedAt: Date;
}

interface EnrollStudentParams {
    studentId: string;
    courseId: string;
    enrollmentType: StudentType
    enrolledBy: RoleType
    paymentId?: string | null;
    batchId?: string | null;
    enrolledById?: string;
}
/**
 * Enroll a student in a course
 */
export const enrollStudentInCourse = async (
    params: EnrollStudentParams
): Promise<{ success: boolean; message: string; enrollmentId?: string }> => {
    try {

        const {
            studentId,
            courseId,
            enrollmentType,
            enrolledBy,
            paymentId,
            batchId,
            enrolledById,
        } = params;

        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        const courseCollection = await getCollection(COURSE_COLLECTION);
        const studentCollection = await getCollection(STUDENT_COLLECTION);
        const forecastingCollection = await getCollection(COURSE_FORECASTING);
        const batchEnrollmentCollection = await getCollection(BATCH_ENROLLMENTS_COLLECTION);

        const course = await courseCollection.findOne({
            _id: new ObjectId(courseId),
            isDeleted: false,
            isActive: true,
        });

        if (!course) {
            return { success: false, message: "Course not found" };
        }

        const student = await studentCollection.findOne({
            _id: new ObjectId(studentId),
            isDeleted: false,
            isActive: true,
        });

        if (!student) {
            return { success: false, message: "Student not found" };
        }

        const existingEnrollment = await enrollmentCollection.findOne({
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(courseId),
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
            enrollmentType,
            enrolledBy,
            batchId: batchId ? new ObjectId(batchId) : null,
            // paymentId: paymentId ? new ObjectId(paymentId) : undefined,
            status: "active",
            overallProgress: 0,
            completedChapters: [],
            certificateIssued: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        let batchEnrollment = null;
        if (batchId) {
            batchEnrollment = await batchEnrollmentCollection.findOne({
                batchId: new ObjectId(batchId),
                studentId: new ObjectId(studentId),
                courseId: new ObjectId(courseId),
            });

            if (!batchEnrollment) {
                return {
                    success: false,
                    message: "Student is not enrolled in this batch"
                };
            }
        }


        // if (enrollmentType === StudentType.ONLINE && paymentId) {
        //     enrollmentData.paymentId = new ObjectId(paymentId);
        // }

        // Add admin ID for offline enrollment
        if (enrollmentType === StudentType.OFFLINE && enrolledById) {
            enrollmentData.enrolledById = new ObjectId(enrolledById);
        }


        const result = await enrollmentCollection.insertOne(enrollmentData);

        if (batchId && batchEnrollment) {
            await batchEnrollmentCollection.updateOne(
                {
                    _id: batchEnrollment._id
                },
                {
                    $set: {
                        onlineCourseAccess: true,
                        updatedAt: new Date(),
                    },
                }
            );
        }

        // Initialize progress for all lessons
        await initializeCourseProgress(
            result.insertedId.toString(),
            studentId,
            courseId
        );

        const forecastingData = {
            enrollmentId: new ObjectId(result.insertedId.toString()),
            courseId: new ObjectId(courseId),
            studentId: new ObjectId(studentId),
            currentAttempt: 0,
            remainingAttempts: 5,                // Starts with 3 attempts
            daysPerWeek: null,                   // User hasn't set yet
            minutesPerDay: null,                   // minutes
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
 * Initialize course progress tracking when student enrolls
 */
export const initializeCourseProgress = async (
    enrollmentId: string,
    studentId: string,
    courseId: string
): Promise<{ success: boolean; message: string }> => {
    try {
        const chapterCollection = await getCollection(CHAPTERS_COLLECTION);
        const lessonCollection = await getCollection(LESSONS_COLLECTION);
        const courseProgressCollection = await getCollection(COURSE_PROGRESS_COLLECTION);
        const chapterProgressCollection = await getCollection(CHAPTER_PROGRESS_COLLECTION);
        const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        // Get all chapters for this course
        const chapters = await chapterCollection
            .find({
                courseId: new ObjectId(courseId),
                isDeleted: false,
                isActive: true
            })
            .sort({ order: 1 })
            .toArray();

        if (chapters.length === 0) {
            return { success: false, message: "No chapters found for this course" };
        }

        // Create main course progress document
        const courseProgressData: CourseEnrollmentProgress = {
            enrollmentId: new ObjectId(enrollmentId),
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(courseId),
            overallProgress: 0,
            totalChapters: chapters.length,
            completedChapters: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await courseProgressCollection.insertOne(courseProgressData);

        // Create chapter progress documents and lesson progress documents
        for (const chapter of chapters) {
            // Get all lessons for this chapter
            const lessons = await lessonCollection
                .find({
                    courseId: new ObjectId(courseId),
                    chapterId: chapter._id,
                    isDeleted: false,
                    isActive: true,
                })
                .sort({ order: 1 })
                .toArray();

            // Create chapter progress document
            const chapterProgressData: ChapterProgress = {
                enrollmentId: new ObjectId(enrollmentId),
                studentId: new ObjectId(studentId),
                courseId: new ObjectId(courseId),
                chapterId: chapter._id,
                totalLessons: lessons.length,
                completedLessons: 0,
                chapterCompletionPercentage: 0,
                lastUpdatedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await chapterProgressCollection.insertOne(chapterProgressData);

            // Create lesson progress documents
            const lessonProgressDocs: LessonProgress[] = lessons.map((lesson) => ({
                enrollmentId: new ObjectId(enrollmentId),
                studentId: new ObjectId(studentId),
                courseId: new ObjectId(courseId),
                chapterId: chapter._id,
                lessonId: lesson._id,
                videoWatchedSeconds: 0,
                videoTotalSeconds: lesson.accurateSeconds,
                remaingPreQuizAttempts: lesson.preQuizAttempt,
                remaingPostQuizAttempts: lesson.postQuizAttempt,
                isPreQuizAttempted: false,
                videoCompletionPercentage: 0,
                quizPassed: false,
                isLessonCompleted: false,
                lessonCompletionPercentage: 0,
                lastWatchedAt: new Date(),
                createdAt: new Date(),
                updatedAt: new Date(),
            }));

            if (lessonProgressDocs.length > 0) {
                await lessonProgressCollection.insertMany(lessonProgressDocs);
            }
        }

        return { success: true, message: "Course progress initialized successfully" };
    } catch (error: any) {
        console.error("Error initializing course progress:", error);
        return {
            success: false,
            message: error?.message || "Failed to initialize progress"
        };
    }
};


/**
 * Create chapter progress for all existing enrollments when a new chapter is added
 */
export const createChapterProgressForExistingEnrollments = async (
    courseId: string,
    chapterId: string
): Promise<void> => {
    try {
        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        const chapterProgressCollection = await getCollection(CHAPTER_PROGRESS_COLLECTION);
        const courseProgressCollection = await getCollection(COURSE_PROGRESS_COLLECTION);

        // Get all active enrollments for this course
        const enrollments = await enrollmentCollection.find({
            courseId: new ObjectId(courseId),
            status: "active"
        }).toArray();

        if (enrollments.length === 0) return;

        // Create chapter progress for each enrollment
        const chapterProgressDocs = enrollments.map(enrollment => ({
            enrollmentId: enrollment._id,
            studentId: enrollment.studentId,
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            totalLessons: 0,
            completedLessons: 0,
            chapterCompletionPercentage: 0,
            lastUpdatedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await chapterProgressCollection.insertMany(chapterProgressDocs);

        // Update total chapters count in course progress
        await courseProgressCollection.updateMany(
            { courseId: new ObjectId(courseId) },
            {
                $inc: { totalChapters: 1 },
                $set: { updatedAt: new Date() }
            }
        );

        console.log(`Created chapter progress for ${enrollments.length} enrollments`);
    } catch (error) {
        console.error("Error creating chapter progress for existing enrollments:", error);
    }
};

/**
 * Create lesson progress for all existing enrollments when a new lesson is added
 */
export const createLessonProgressForExistingEnrollments = async (
    courseId: string,
    chapterId: string,
    lessonId: string,
    accurateSeconds: number,
    preQuizAttempt: number,
    postQuizAttempt: number
): Promise<void> => {
    try {
        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
        const chapterProgressCollection = await getCollection(CHAPTER_PROGRESS_COLLECTION);

        // Get all active enrollments for this course
        const enrollments = await enrollmentCollection.find({
            courseId: new ObjectId(courseId),
            status: "active"
        }).toArray();

        if (enrollments.length === 0) return;

        // Create lesson progress for each enrollment
        const lessonProgressDocs = enrollments.map(enrollment => ({
            enrollmentId: enrollment._id,
            studentId: enrollment.studentId,
            courseId: new ObjectId(courseId),
            chapterId: new ObjectId(chapterId),
            lessonId: new ObjectId(lessonId),
            videoWatchedSeconds: 0,
            videoTotalSeconds: accurateSeconds,
            remaingPreQuizAttempts: preQuizAttempt,
            remaingPostQuizAttempts: postQuizAttempt,
            isPreQuizAttempted: false,
            videoCompletionPercentage: 0,
            quizPassed: false,
            isLessonCompleted: false,
            lessonCompletionPercentage: 0,
            lastWatchedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        }));

        await lessonProgressCollection.insertMany(lessonProgressDocs);

        // Update total lessons count in chapter progress
        await chapterProgressCollection.updateMany(
            {
                courseId: new ObjectId(courseId),
                chapterId: new ObjectId(chapterId)
            },
            {
                $inc: { totalLessons: 1 },
                $set: { updatedAt: new Date() }
            }
        );

        console.log(`Created lesson progress for ${enrollments.length} enrollments`);
    } catch (error) {
        console.error("Error creating lesson progress for existing enrollments:", error);
    }
};