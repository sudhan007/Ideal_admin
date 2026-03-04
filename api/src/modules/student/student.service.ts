import { Context } from "elysia";
import { getCollection } from "@lib/config/db.config";
import {
    EducationDetailsCreateInput,
    StudentDetailsCreateInput,
    StudentUpdateInput,
    StudentListSchema,
    GetStudentByIdSchema,
} from "./student-model";
import { StoreType } from "@types";
import { uploadFileToS3 } from "@lib/utils/s3";
import { ObjectId } from "mongodb";
import { BOARD_COLLECTION, CHAPTER_PROGRESS_COLLECTION, CHAPTERS_COLLECTION, COURSE_COLLECTION, COURSE_ENROLLMENT_COLLECTION, COURSE_FORECASTING, COURSE_PROGRESS_COLLECTION, GRADE_COLLECTION, LESSON_PROGRESS_COLLECTION, LESSONS_COLLECTION, QUIZ_ATTEMPTS_COLLECTION, STAFFS_COLLECTION, STUDENT_COLLECTION, TASK_COLLECTION, TASK_SUBMISSION_COLLECTION, TASK_SUBMISSION_HISTORY_COLLECTION, TASK_TIMELINE_COLLECTION } from "@lib/Db_collections";



export const registerStudentDetails = async (
    ctx: Context<{ body: StudentDetailsCreateInput }>
) => {
    const { body, set, store } = ctx;
    const { studentProfile, ...personalDetails } = body;
    const { id } = store as StoreType;
    const studentCollection = await getCollection(STUDENT_COLLECTION);

    try {

        const existingStudent = await studentCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!existingStudent) {
            set.status = 404;
            return { error: "Student not found" };
        }

        const duplicateCheck: any = { $or: [] };

        // if (personalDetails.studentPhoneNumber) {
        //     duplicateCheck.$or.push({
        //         studentPhoneNumber: personalDetails.studentPhoneNumber,
        //         _id: { $ne: new ObjectId(id) },
        //     });
        // }

        if (personalDetails.email) {
            duplicateCheck.$or.push({
                email: personalDetails.email.toLowerCase(),
                _id: { $ne: new ObjectId(id) },
            });
        }

        if (duplicateCheck.$or.length) {
            const duplicate = await studentCollection.findOne(duplicateCheck);
            if (duplicate) {
                set.status = 400;
                return {
                    error: "Student with this phone number or email already exists",
                    status: false,
                };
            }
        }

        let profileImageUrl = existingStudent.profileImageUrl;
        if (studentProfile) {
            const upload = await uploadFileToS3(
                studentProfile,
                "students/profile"
            );
            profileImageUrl = upload.fullUrl;
        }

        await studentCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...personalDetails,
                    dateOfBirth: new Date(personalDetails.dateOfBirth),
                    email: personalDetails.email
                        ? personalDetails.email.toLowerCase()
                        : existingStudent.email,

                    profileImageUrl,
                    registrationComplete: true,
                    updatedAt: new Date(),
                },
            }
        );

        set.status = 201;
        return {
            message: "Student details registered successfully",
            studentId: id,
        };
    } catch (error: any) {
        console.error("Student registration error:", error);
        set.status = 500;
        return { error: "Failed to register student", details: error.message };
    }
};
export const addEducationDetails = async (
    ctx: Context<{ body: EducationDetailsCreateInput }>
) => {
    const { body, set, store } = ctx;
    const { grade, nameOfTheBoard, previousYearAnnualTotalMarks, previousYearMathMarks, referedBy } = body
    const { id } = store as StoreType;
    const studentCollection = await getCollection(STUDENT_COLLECTION);

    try {

        const updateResult = await studentCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    referedBy,
                    grade: new ObjectId(grade),
                    nameOfTheBoard: new ObjectId(nameOfTheBoard),
                    previousYearMathMarks,
                    previousYearAnnualTotalMarks,
                    updatedAt: new Date(),
                    registrationComplete: true,
                },
            }
        );

        if (updateResult.matchedCount === 0) {
            set.status = 404;
            return { error: "Student not found", status: false };
        }

        return {
            message: "Education details added successfully",
            studentId: id,
            registrationComplete: true,
        };
    } catch (error: any) {
        console.error("Add education details error:", error);
        set.status = 500;
        return { error: "Failed to add education details", details: error.message };
    }
};
export const updateStudentDetails = async (
    ctx: Context<{ body: StudentUpdateInput }>
) => {
    const { body, set, store } = ctx;
    const { studentProfile, ...updateFields } = body;
    const { id } = store as StoreType;
    const studentCollection = await getCollection(STUDENT_COLLECTION);

    try {
        // Check if student exists
        const existingStudent = await studentCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!existingStudent) {
            set.status = 404;
            return { error: "Student not found", status: false };
        }

        // Build duplicate check only for fields being updated
        const duplicateCheck: any = { $or: [] };

        // if (updateFields.studentPhoneNumber) {
        //     duplicateCheck.$or.push({
        //         studentPhoneNumber: updateFields.studentPhoneNumber,
        //         _id: { $ne: new ObjectId(id) },
        //     });
        // }

        if (updateFields.email) {
            duplicateCheck.$or.push({
                email: updateFields.email.toLowerCase(),
                _id: { $ne: new ObjectId(id) },
            });
        }

        // Only check for duplicates if there are fields to check
        if (duplicateCheck.$or.length > 0) {
            const duplicate = await studentCollection.findOne(duplicateCheck);
            if (duplicate) {
                set.status = 400;
                return {
                    error: "Student with this phone number or email already exists",
                    status: false,
                };
            }
        }

        // Prepare update object
        const updateData: any = {
            updatedAt: new Date(),
        };

        // Only update fields that are provided
        if (updateFields.studentName !== undefined) {
            updateData.studentName = updateFields.studentName;
        }

        if (updateFields.dateOfBirth !== undefined) {
            updateData.dateOfBirth = new Date(updateFields.dateOfBirth);
        }

        if (updateFields.gender !== undefined) {
            updateData.gender = updateFields.gender;
        }

        if (updateFields.studentPhoneNumber !== undefined) {
            updateData.studentPhoneNumber = updateFields.studentPhoneNumber;
        }

        if (updateFields.parentPhoneNumber !== undefined) {
            updateData.parentPhoneNumber = updateFields.parentPhoneNumber;
        }
        if (updateFields.parentPhoneNumber2 !== undefined) {
            updateData.parentPhoneNumber2 = updateFields.parentPhoneNumber2;
        }
        if (updateFields.parentName !== undefined) {
            updateData.parentName = updateFields.parentName;
        }

        if (updateFields.address !== undefined) {
            updateData.address = updateFields.address;
        }

        if (updateFields.email !== undefined) {
            updateData.email = updateFields.email.toLowerCase();
        }

        if (updateFields.registrationComplete !== undefined) {
            updateData.registrationComplete = updateFields.registrationComplete;
        }

        // Validate and convert grade to ObjectId
        if (updateFields.grade !== undefined && updateFields.grade.trim() !== "") {
            if (!ObjectId.isValid(updateFields.grade)) {
                set.status = 400;
                return {
                    error: "Invalid grade ID format",
                    status: false
                };
            }
            updateData.grade = new ObjectId(updateFields.grade);
        }

        // Validate and convert nameOfTheBoard to ObjectId
        if (updateFields.nameOfTheBoard !== undefined && updateFields.nameOfTheBoard.trim() !== "") {
            if (!ObjectId.isValid(updateFields.nameOfTheBoard)) {
                set.status = 400;
                return {
                    error: "Invalid board ID format",
                    status: false
                };
            }
            updateData.nameOfTheBoard = new ObjectId(updateFields.nameOfTheBoard);
        }

        if (updateFields.previousYearAnnualTotalMarks !== undefined) {
            updateData.previousYearAnnualTotalMarks = updateFields.previousYearAnnualTotalMarks;
        }

        if (updateFields.previousYearMathMarks !== undefined) {
            updateData.previousYearMathMarks = updateFields.previousYearMathMarks;
        }

        if (updateFields.referedBy !== undefined) {
            updateData.referedBy = updateFields.referedBy;
        }

        // Handle profile image upload
        if (studentProfile) {
            const upload = await uploadFileToS3(
                studentProfile,
                "students/profile"
            );
            updateData.profileImageUrl = upload.fullUrl;
        }

        // Perform the update
        const updateResult = await studentCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateData }
        );

        if (updateResult.matchedCount === 0) {
            set.status = 404;
            return { error: "Student not found", status: false };
        }

        set.status = 200;
        return {
            message: "Student details updated successfully",
            studentId: id,
            status: true,
        };
    } catch (error: any) {
        console.error("Student update error:", error);
        set.status = 500;
        return {
            error: "Failed to update student details",
            details: error.message,
            status: false
        };
    }
};
// export const updateStudentProfile = async (
//     ctx: Context<{ body: StudentUpdateInput }>
// ) => {
//     const { body, set, store } = ctx;
//     const { studentProfile, ...updateDetails } = body;
//     const { id } = store as StoreType;
//     const studentCollection = await getCollection(STUDENT_COLLECTION);

//     try {

//         const updateFields: any = {
//             ...updateDetails,
//             grade: new ObjectId(updateDetails.grade),
//             nameOfTheBoard: new ObjectId(updateDetails.nameOfTheBoard),
//             updatedAt: new Date(),
//         };

//         if (updateDetails.email) {
//             updateFields.email = updateDetails.email.toLowerCase();
//         }

//         const duplicateCheck: any = { $or: [] };
//         if (updateDetails.studentPhoneNumber) {
//             duplicateCheck.$or.push({ studentPhoneNumber: updateDetails.studentPhoneNumber });
//         }
//         if (updateDetails.email) {
//             duplicateCheck.$or.push({ email: updateFields.email });
//         }
//         if (duplicateCheck.$or.length > 0) {
//             duplicateCheck._id = { $ne: new ObjectId(id) };
//             const existing = await studentCollection.findOne(duplicateCheck);
//             if (existing) {
//                 set.status = 400;
//                 return {
//                     error: "Another student with this phone or email already exists",
//                     status: false,
//                 };
//             }
//         }

//         if (studentProfile) {
//             const { fullUrl: profileImageUrl } = await uploadFileToS3(studentProfile, "students/profile");
//             updateFields.profileImageUrl = profileImageUrl;
//         }

//         const result = await studentCollection.updateOne(
//             { _id: new ObjectId(id) },
//             { $set: updateFields }
//         );

//         if (result.matchedCount === 0) {
//             set.status = 404;
//             return { error: "Student not found", status: false };
//         }

//         return {
//             message: "Student profile updated successfully",
//             studentId: id,
//         };
//     } catch (error: any) {
//         console.error("Update student error:", error);
//         set.status = 500;
//         return { error: "Failed to update student", details: error.message };
//     }
// };
// export const getStudentSession = async (ctx: Context) => {
//     const { set, store } = ctx;
//     const { id, role } = store as StoreType;

//     try {
//         if (!id) {
//             set.status = 401;
//             return {
//                 message: "Unauthorized",
//             };
//         }

//         const studentCollection = await getCollection(STUDENT_COLLECTION);

//         const student = await studentCollection.findOne(
//             { _id: new ObjectId(id) },
//             {
//                 projection: {
//                     mobileNumber: 1,
//                     email: 1,
//                     loginMethod: 1,
//                     registrationComplete: 1,
//                     profileImageUrl: 1,
//                     studentName: 1,
//                     studentType: 1,
//                     isActive: 1,
//                     isDeleted: 1,
//                 },
//             }
//         );

//         if (!student) {
//             set.status = 401;
//             return {
//                 message: "Unauthorized",
//             };
//         }

//         if (!student.isActive || student.isDeleted) {
//             set.status = 401;
//             return {
//                 message: "Account is inactive",
//             };
//         }

//         // Get latest enrolled course with complete details including mentor
//         const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);

//         const latestEnrollment = await enrollmentCollection.aggregate([
//             {
//                 $match: {
//                     studentId: new ObjectId(id),
//                     status: "active"
//                 }
//             },
//             {
//                 $sort: { enrolledAt: -1 }
//             },
//             {
//                 $limit: 1
//             },
//             {
//                 $lookup: {
//                     from: COURSE_COLLECTION,
//                     localField: "courseId",
//                     foreignField: "_id",
//                     as: "courseDetails"
//                 }
//             },
//             {
//                 $unwind: {
//                     path: "$courseDetails",
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             {
//                 $lookup: {
//                     from: STAFFS_COLLECTION,
//                     localField: "courseDetails.mentor",
//                     foreignField: "_id",
//                     as: "mentorDetails"
//                 }
//             },
//             {
//                 $unwind: {
//                     path: "$mentorDetails",
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             {
//                 $lookup: {
//                     from: COURSE_FORECASTING,
//                     localField: "_id",
//                     foreignField: "enrollmentId",
//                     as: "forecasting"
//                 }
//             },
//             {
//                 $unwind: {
//                     path: "$forecasting",
//                     preserveNullAndEmptyArrays: true
//                 }
//             },
//             {
//                 $project: {
//                     enrollmentId: "$_id",
//                     courseId: "$courseId",
//                     courseName: "$courseDetails.courseName",
//                     courseBanner: "$courseDetails.bannerImage",
//                     strikePrice: "$courseDetails.strikePrice",
//                     actualPrice: "$courseDetails.actualPrice",
//                     courseDurationMinutes: "$courseDetails.courseDurationMinutes",
//                     mentorName: "$mentorDetails.staffName",
//                     mentorImage: "$mentorDetails.image",
//                     enrolledAt: 1,
//                     forecasting: {
//                         $cond: {
//                             if: { $ifNull: ["$forecasting", false] },
//                             then: {
//                                 expectedCompletionDate: "$forecasting.expectedCompletionDate",
//                                 lastSetupAt: "$forecasting.lastSetupAt",
//                             },
//                             else: null
//                         }
//                     }
//                 }
//             }
//         ]).toArray();

//         const enrolledCourse = latestEnrollment.length > 0 ? {
//             isEnrolled: true,
//             enrollmentId: latestEnrollment[0].enrollmentId,
//             courseId: latestEnrollment[0].courseId,
//             courseName: latestEnrollment[0].courseName || "",
//             courseBanner: latestEnrollment[0].courseBanner || "",
//             strikePrice: latestEnrollment[0].strikePrice || 0,
//             actualPrice: latestEnrollment[0].actualPrice || 0,
//             mentorName: latestEnrollment[0].mentorName || "",
//             mentorImage: latestEnrollment[0].mentorImage || "",
//             enrolledAt: latestEnrollment[0].enrolledAt,
//             forecasting: latestEnrollment[0].forecasting || {}
//         } : null;

//         const studentDetails = {
//             id: student._id,
//             role,
//             loginMethod: student.loginMethod,
//             mobileNumber: student.mobileNumber,
//             email: student.email,
//             registrationComplete: student.registrationComplete || false,
//             studentType: student.studentType,
//             studentName: student.studentName,
//             profileImageUrl: student.profileImageUrl,
//         }

//         return {
//             studentDetails,
//             enrolledCourse: enrolledCourse
//         };
//     } catch (error: any) {
//         console.error("Student Session Error:", error);
//         set.status = 500;
//         return {
//             message: "Internal Server Error",
//         };
//     }
// };
export const getStudentSession = async (ctx: Context) => {
    const { set, store } = ctx;
    const { id, role } = store as StoreType;

    try {
        if (!id) {
            set.status = 401;
            return { message: "Unauthorized" };
        }

        const studentColl = await getCollection(STUDENT_COLLECTION);
        const enrollmentColl = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        const taskColl = await getCollection(TASK_COLLECTION);
        const taskSubmissionColl = await getCollection(TASK_SUBMISSION_COLLECTION);

        const student = await studentColl.findOne(
            { _id: new ObjectId(id) },
            {
                projection: {
                    mobileNumber: 1,
                    email: 1,
                    loginMethod: 1,
                    registrationComplete: 1,
                    profileImageUrl: 1,
                    studentName: 1,
                    studentType: 1,
                    isActive: 1,
                    isDeleted: 1,
                },
            }
        );

        if (!student) {
            set.status = 401;
            return { message: "Unauthorized" };
        }

        if (!student.isActive || student.isDeleted) {
            set.status = 401;
            return { message: "Account is inactive" };
        }

        // ────────────────────────────────────────────────
        // Get latest enrolled course (existing logic kept)
        // ────────────────────────────────────────────────
        const latestEnrollment = await enrollmentColl.aggregate([
            // { $match: { studentId: new ObjectId(id), status: "active" } },
            { $match: { studentId: new ObjectId(id) } },

            { $sort: { enrolledAt: -1 } },
            { $limit: 1 },
            {
                $lookup: {
                    from: COURSE_COLLECTION,
                    localField: "courseId",
                    foreignField: "_id",
                    as: "courseDetails"
                }
            },
            { $unwind: { path: "$courseDetails", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: STAFFS_COLLECTION,
                    localField: "courseDetails.mentor",
                    foreignField: "_id",
                    as: "mentorDetails"
                }
            },
            { $unwind: { path: "$mentorDetails", preserveNullAndEmptyArrays: true } },
            {
                $lookup: {
                    from: COURSE_FORECASTING,
                    localField: "_id",
                    foreignField: "enrollmentId",
                    as: "forecasting"
                }
            },
            { $unwind: { path: "$forecasting", preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    enrollmentId: "$_id",
                    overallProgress: 1,
                    courseId: "$courseId",
                    courseName: "$courseDetails.courseName",
                    courseBanner: "$courseDetails.bannerImage",
                    strikePrice: "$courseDetails.strikePrice",
                    actualPrice: "$courseDetails.actualPrice",
                    courseDurationMinutes: "$courseDetails.courseDurationMinutes",
                    mentorName: "$mentorDetails.staffName",
                    mentorImage: "$mentorDetails.image",
                    enrolledAt: 1,
                    forecasting: {
                        $cond: {
                            if: { $ifNull: ["$forecasting", false] },
                            then: {
                                expectedCompletionDate: "$forecasting.expectedCompletionDate",
                                lastSetupAt: "$forecasting.lastSetupAt",
                            },
                            else: null
                        }
                    }
                }
            }
        ]).toArray();

        const enrolledCourse = latestEnrollment.length > 0 ? {
            isEnrolled: true,
            enrollmentId: latestEnrollment[0].enrollmentId.toString(),
            courseId: latestEnrollment[0].courseId.toString(),
            courseName: latestEnrollment[0].courseName || "",
            courseBanner: latestEnrollment[0].courseBanner || "",
            strikePrice: latestEnrollment[0].strikePrice || 0,
            actualPrice: latestEnrollment[0].actualPrice || 0,
            mentorName: latestEnrollment[0].mentorName || "",
            mentorImage: latestEnrollment[0].mentorImage || "",
            enrolledAt: latestEnrollment[0].enrolledAt,
            forecasting: latestEnrollment[0].forecasting || null,
            overallProgress: latestEnrollment[0].overallProgress
        } : null;

        // ────────────────────────────────────────────────
        // Count unattended (pending) tasks across ALL active courses
        // ────────────────────────────────────────────────
        const pendingTaskCount = await taskColl.aggregate([
            // 1. Only active enrollments of this student
            {
                $lookup: {
                    from: COURSE_ENROLLMENT_COLLECTION,
                    localField: "courseId",
                    foreignField: "courseId",
                    as: "enrollment"
                }
            },
            { $unwind: "$enrollment" },
            {
                $match: {
                    "enrollment.studentId": new ObjectId(id),
                    // "enrollment.status": "active",
                    isActive: true,
                    isDeleted: false
                }
            },

            // 2. Exclude tasks already submitted by this student
            {
                $lookup: {
                    from: TASK_SUBMISSION_COLLECTION,
                    let: { taskId: "$_id", studentId: new ObjectId(id) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$taskId", "$$taskId"] },
                                        { $eq: ["$studentId", "$$studentId"] }
                                    ]
                                }
                            }
                        }
                    ],
                    as: "submission"
                }
            },
            {
                $match: { submission: { $size: 0 } }
            },

            // 3. Optional: only future due tasks (remove if you want all pending)
            {
                $match: {
                    $or: [
                        { dueDateTime: { $gte: new Date() } },
                        { dueDateTime: { $exists: false } }
                    ]
                }
            },

            { $count: "pendingTasks" }
        ]).toArray();

        const unattendedTasksCount = pendingTaskCount.length > 0
            ? pendingTaskCount[0].pendingTasks
            : 0;

        // ────────────────────────────────────────────────
        // Final response
        // ────────────────────────────────────────────────
        const studentDetails = {
            id: student._id.toString(),
            role,
            loginMethod: student.loginMethod,
            mobileNumber: student.mobileNumber,
            email: student.email,
            registrationComplete: student.registrationComplete || false,
            studentType: student.studentType,
            studentName: student.studentName,
            profileImageUrl: student.profileImageUrl,
            unattendedTaskCount: unattendedTasksCount   // ← added here
        };

        return {
            studentDetails,
            enrolledCourse
        };

    } catch (error: any) {
        console.error("Student Session Error:", error);
        set.status = 500;
        return { message: "Internal Server Error" };
    }
};
export const getAllStudents = async (ctx: Context<{ query: StudentListSchema }>) => {
    const { set, query } = ctx;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = query.search?.trim();
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder === "desc" ? -1 : 1;
    const gradeId = query.grade;
    const boardId = query.board;

    try {
        const studentCollection = await getCollection(STUDENT_COLLECTION);

        const pipeline: any[] = [];

        const filter: any = {
            isDeleted: false,
        };

        if (gradeId) filter.grade = new ObjectId(gradeId);
        if (boardId) filter.nameOfTheBoard = new ObjectId(boardId);

        pipeline.push({ $match: filter });

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { studentName: { $regex: search, $options: "i" } },
                        { email: { $regex: search, $options: "i" } },
                        { studentPhoneNumber: { $regex: search, $options: "i" } },
                    ],
                },
            });
        }


        pipeline.push({
            $facet: {
                metaData: [{ $count: "total" }],
                data: [
                    { $sort: { [sortBy]: sortOrder } },
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            studentName: 1,
                            mobileNumber: 1,
                            studentPhoneNumber: 1,
                            email: 1,
                            gender: 1,
                            registrationComplete: 1,
                            isActive: 1,
                            createdAt: 1,
                        },
                    },
                ],
            },
        });

        const [result] = await studentCollection.aggregate(pipeline).toArray();

        const total = result?.metaData[0]?.total || 0;
        const students = result?.data || [];

        return {
            students,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page * limit < total,
                hasPrevPage: page > 1,
            },
            message: "Students retrieved successfully",
        };
    } catch (error) {
        console.error("Students Retrieve Error", error);
        set.status = 500;
        return {
            message: "Failed to fetch students",
        };
    }
}
export const getStudentById = async (ctx: Context<{ params: GetStudentByIdSchema }>) => {
    const { set, params } = ctx;
    const { studentId } = params;
    try {
        const studentCollection = await getCollection(STUDENT_COLLECTION);
        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        const courseCollection = await getCollection(COURSE_COLLECTION);
        const boardCollection = await getCollection(BOARD_COLLECTION);
        const gradeCollection = await getCollection(GRADE_COLLECTION);

        // Fetch student details
        const student = await studentCollection.findOne({
            _id: new ObjectId(studentId)
        })



        if (!student) {
            set.status = 404;
            return {
                message: "Student not found"
            };
        }

        // Fetch board and grade details in parallel
        const [boardDetails, gradeDetails] = await Promise.all([
            student.nameOfTheBoard
                ? boardCollection.findOne(
                    { _id: new ObjectId(student.nameOfTheBoard), isDeleted: false, isActive: true },
                    { projection: { boardName: 1 } }
                )
                : null,
            student.grade
                ? gradeCollection.findOne(
                    { _id: new ObjectId(student.grade), isDeleted: false, isActive: true },
                    { projection: { grade: 1 } }
                )
                : null
        ]);

        // Fetch all active enrollments for the student
        const enrollments = await enrollmentCollection
            .find({
                studentId: new ObjectId(studentId),
                // status: "active"
            })
            .project({
                courseId: 1,
                enrolledAt: 1,
                overallProgress: 1,
                completedChapters: 1,
                certificateIssued: 1
            })
            .toArray();

        // If student has no enrollments, return student with empty courses array
        if (enrollments.length === 0) {
            set.status = 200;
            return {
                student: {
                    ...student,
                    boardName: boardDetails?.boardName || null,
                    grade: gradeDetails?.grade || null,
                    enrolledCourses: []
                },
                message: "Student details retrieved successfully"
            };
        }

        // Get all course IDs from enrollments
        const courseIds = enrollments.map(e => e.courseId);

        // Fetch course details in one query
        const courses = await courseCollection
            .find({
                _id: { $in: courseIds },
                isDeleted: false,
                isActive: true
            })
            .project({
                _id: 1,
                courseName: 1,
                bannerImage: 1,
            })
            .toArray();

        // Create a map for quick course lookup
        const courseMap = new Map(
            courses.map(course => [course._id.toString(), course])
        );

        // Combine enrollment data with course details
        const enrolledCourses = enrollments
            .map(enrollment => {
                const course = courseMap.get(enrollment.courseId.toString());

                // If course not found or inactive, skip it
                if (!course) return null;

                return {
                    enrollmentId: enrollment._id.toString(),
                    courseId: enrollment.courseId,
                    courseName: course.courseName,
                    bannerImage: course.bannerImage,
                    enrolledAt: enrollment.enrolledAt,
                    overallProgress: enrollment.overallProgress,
                };
            })
            .filter(course => course !== null); // Remove null entries

        set.status = 200;
        return {
            student: {
                ...student,
                boardName: boardDetails?.boardName || null,
                grade: gradeDetails?.grade || null,
                enrolledCourses
            },
            message: "Student details retrieved successfully"
        };

    } catch (error: any) {
        console.error("Get student by id error", error);
        set.status = 500;
        return {
            message: error.message || "Internal server error"
        };
    }
};
// export const getEnrolledCourses = async (ctx: Context) => {
//     const { set, query, params } = ctx;
//     const { studentId } = params;

//     // ────────────────────────────────────────────────
//     // Pagination parameters (query string)
//     // ────────────────────────────────────────────────
//     const page = Math.max(1, Number(query.page) || 1);
//     const limit = Math.min(50, Math.max(1, Number(query.limit) || 10)); // reasonable bounds
//     const skip = (page - 1) * limit;

//     try {
//         const studentColl = await getCollection(STUDENT_COLLECTION);
//         const enrollmentColl = await getCollection(COURSE_ENROLLMENT_COLLECTION);
//         const courseColl = await getCollection(COURSE_COLLECTION);
//         const lessonColl = await getCollection(LESSONS_COLLECTION);
//         // const chapterColl  = await getCollection(CHAPTER_COLLECTION); // if chapters are separate

//         const student = await studentColl.findOne({ _id: new ObjectId(studentId) });

//         if (!student) {
//             set.status = 404;
//             return { message: "Student not found" };
//         }

//         // ────────────────────────────────────────────────
//         // 1. Get total count of active enrollments (for pagination metadata)
//         // ────────────────────────────────────────────────
//         const totalEnrollments = await enrollmentColl.countDocuments({
//             studentId: new ObjectId(studentId),
//             status: "active",
//         });

//         // ────────────────────────────────────────────────
//         // 2. Fetch paginated enrollments
//         // ────────────────────────────────────────────────
//         const enrollments = await enrollmentColl
//             .find({
//                 studentId: new ObjectId(studentId),
//                 status: "active",
//             })
//             .sort({ enrolledAt: -1 })           // newest first – adjust as needed
//             .skip(skip)
//             .limit(limit)
//             .project({
//                 courseId: 1,
//                 enrolledAt: 1,
//                 overallProgress: 1,
//             })
//             .toArray();

//         if (enrollments.length === 0) {
//             set.status = 200;
//             return {
//                 enrolledCourses: [],
//                 pagination: {
//                     currentPage: page,
//                     totalPages: 0,
//                     totalItems: totalEnrollments,
//                     limit,
//                     hasNext: false,
//                     hasPrev: page > 1,
//                 },
//                 message: "No active enrolled courses found",
//             };
//         }

//         const courseIds = enrollments.map((e) => e.courseId);

//         // ────────────────────────────────────────────────
//         // 3. Fetch course details
//         // ────────────────────────────────────────────────
//         const courses = await courseColl
//             .find({
//                 _id: { $in: courseIds },
//                 isDeleted: false,
//                 isActive: true,
//             })
//             .project({
//                 _id: 1,
//                 courseName: 1,
//                 bannerImage: 1,
//             })
//             .toArray();

//         const courseMap = new Map(courses.map((c) => [c._id.toString(), c]));

//         // ────────────────────────────────────────────────
//         // 4. Count total lessons per course (batch query)
//         // ────────────────────────────────────────────────
//         const lessonCounts = await lessonColl
//             .aggregate([
//                 { $match: { courseId: { $in: courseIds } } },
//                 { $group: { _id: "$courseId", totalLessons: { $sum: 1 } } },
//             ])
//             .toArray();

//         const lessonCountMap = new Map(
//             lessonCounts.map((lc) => [lc._id.toString(), lc.totalLessons])
//         );

//         // If you have chapters in separate collection → similar aggregation
//         // const chapterCounts = await chapterColl.aggregate([...]).toArray();
//         // const chapterCountMap = new Map(...);

//         // ────────────────────────────────────────────────
//         // 5. Build response
//         // ────────────────────────────────────────────────
//         const enrolledCourses = enrollments
//             .map((enrollment) => {
//                 const course = courseMap.get(enrollment.courseId.toString());
//                 if (!course) return null;

//                 const courseIdStr = enrollment.courseId.toString();

//                 return {
//                     courseId: courseIdStr,
//                     courseName: course.courseName,
//                     bannerImage: course.bannerImage,
//                     enrolledAt: enrollment.enrolledAt,
//                     overallProgress: enrollment.overallProgress || 0,

//                     totalLessons: lessonCountMap.get(courseIdStr) || 0,
//                     totalChapters: 0, // ← replace with real value if you have chapters
//                     // totalChapters: chapterCountMap.get(courseIdStr) || 0,
//                 };
//             })
//             .filter((c): c is NonNullable<typeof c> => c !== null);

//         const totalPages = Math.ceil(totalEnrollments / limit);

//         set.status = 200;
//         return {
//             enrolledCourses,
//             pagination: {
//                 currentPage: page,
//                 totalPages,
//                 totalItems: totalEnrollments,
//                 limit,
//                 hasNext: page < totalPages,
//                 hasPrev: page > 1,
//             },
//             message: "Enrolled courses retrieved successfully",
//         };
//     } catch (error: any) {
//         console.error("Error fetching enrolled courses:", error);
//         set.status = 500;
//         return { message: error.message || "Internal server error" };
//     }
// }
export const getEnrolledCourses = async (ctx: Context) => {
    const { set, query, params } = ctx;
    const { studentId } = params;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    try {
        const studentColl = await getCollection(STUDENT_COLLECTION);
        const enrollmentColl = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        const courseColl = await getCollection(COURSE_COLLECTION);
        const lessonColl = await getCollection(LESSONS_COLLECTION);
        const chapterColl = await getCollection(CHAPTERS_COLLECTION);
        const forecastingColl = await getCollection(COURSE_FORECASTING);  // ← added

        const student = await studentColl.findOne({ _id: new ObjectId(studentId) });
        if (!student) {
            set.status = 404;
            return { message: "Student not found" };
        }


        const totalEnrollments = await enrollmentColl.countDocuments({
            studentId: new ObjectId(studentId),
            // status: "active",
        });


        const enrollments = await enrollmentColl
            .find({
                studentId: new ObjectId(studentId),
                // status: "active",
            })
            .sort({ enrolledAt: -1 })
            .skip(skip)
            .limit(limit)
            .project({
                courseId: 1,
                enrolledAt: 1,
                overallProgress: 1,
            })
            .toArray();

        if (enrollments.length === 0) {
            set.status = 200;
            return {
                enrolledCourses: [],
                pagination: {
                    currentPage: page,
                    totalPages: 0,
                    totalItems: totalEnrollments,
                    limit,
                    hasNext: false,
                    hasPrev: page > 1,
                },
                message: "No active enrolled courses found",
            };
        }

        const courseIds = enrollments.map(e => e.courseId);


        const courses = await courseColl
            .aggregate([
                { $match: { _id: { $in: courseIds }, isDeleted: false, isActive: true } },
                {
                    $lookup: {
                        from: STAFFS_COLLECTION,
                        localField: "mentor",
                        foreignField: "_id",
                        as: "mentorInfo"
                    }
                },
                { $unwind: { path: "$mentorInfo", preserveNullAndEmptyArrays: true } },
                {
                    $project: {
                        _id: 1,
                        courseName: 1,
                        bannerImage: 1,
                        actualPrice: 1,
                        strikePrice: 1,
                        mentorName: { $ifNull: ["$mentorInfo.staffName", "—"] },
                        mentorImage: { $ifNull: ["$mentorInfo.image", null] },
                    }
                }
            ])
            .toArray();

        const courseMap = new Map(courses.map(c => [c._id.toString(), c]));

        const lessonCounts = await lessonColl
            .aggregate([
                { $match: { courseId: { $in: courseIds } } },
                { $group: { _id: "$courseId", totalLessons: { $sum: 1 } } },
            ])
            .toArray();
        const chapterCounts = await chapterColl
            .aggregate([
                { $match: { courseId: { $in: courseIds } } },
                { $group: { _id: "$courseId", totalChapters: { $sum: 1 } } },
            ])
            .toArray();

        const lessonCountMap = new Map(lessonCounts.map(lc => [lc._id.toString(), lc.totalLessons]));
        const chapterCountMap = new Map(chapterCounts.map(cc => [cc._id.toString(), cc.totalChapters]));

        const forecasts = await forecastingColl
            .find({
                courseId: { $in: courseIds },
                studentId: new ObjectId(studentId),
            })
            .sort({ lastSetupAt: -1 })
            .limit(courseIds.length)
            .project({
                courseId: 1,
                expectedCompletionDate: 1,
                lastSetupAt: 1,
            })
            .toArray();

        const forecastMap = new Map(forecasts.map(f => [f.courseId.toString(), f]));

        // 6. Build final response
        const enrolledCourses = enrollments
            .map((enrollment) => {
                const course = courseMap.get(enrollment.courseId.toString());
                if (!course) return null;

                const courseIdStr = enrollment.courseId.toString();
                const forecast = forecastMap.get(courseIdStr);

                return {
                    isEnrolled: true,
                    enrollmentId: enrollment._id.toString(),
                    overallProgress: enrollment.overallProgress,
                    courseId: courseIdStr,
                    courseName: course.courseName,
                    bannerImage: course.bannerImage,
                    strikePrice: course.strikePrice,
                    actualPrice: course.actualPrice,
                    mentorName: course.mentorName,
                    mentorImage: course.mentorImage,
                    enrolledAt: enrollment.enrolledAt,
                    totalLessons: lessonCountMap.get(courseIdStr) || 0,
                    totalChapters: chapterCountMap.get(courseIdStr) || 0,
                    forecasting: forecast ? {
                        expectedCompletionDate: forecast.expectedCompletionDate,
                        lastSetupAt: forecast.lastSetupAt,
                    } : null,
                };
            })
            .filter((c): c is NonNullable<typeof c> => c !== null);

        const totalPages = Math.ceil(totalEnrollments / limit);

        set.status = 200;
        return {
            enrolledCourses,
            pagination: {
                currentPage: page,
                totalPages,
                totalItems: totalEnrollments,
                limit,
                hasNext: page < totalPages,
                hasPrev: page > 1,
            },
            message: "Enrolled courses retrieved successfully",
        };
    } catch (error: any) {
        console.error("Error fetching enrolled courses:", error);
        set.status = 500;
        return { message: error.message || "Internal server error" };
    }
};
export const getStudentProfile = async (ctx: Context) => {
    const { set, store } = ctx;
    const { id } = store as StoreType;
    console.log("id", id)
    try {
        if (!id) {
            set.status = 401;
            return {
                message: "Unauthorized",
            };
        }

        const studentCollection = await getCollection(STUDENT_COLLECTION);
        const boardCollection = await getCollection(BOARD_COLLECTION);
        const gradeCollection = await getCollection(GRADE_COLLECTION);

        const student = await studentCollection.findOne(
            { _id: new ObjectId(id) },
        );

        if (!student) {
            set.status = 401;
            return {
                message: "Unauthorized",
            };
        }

        if (!student.isActive || student.isDeleted) {
            set.status = 401;
            return {
                message: "Account is inactive",
            };
        }

        const [boardDetails, gradeDetails] = await Promise.all([
            student.nameOfTheBoard
                ? boardCollection.findOne(
                    { _id: new ObjectId(student.nameOfTheBoard), isDeleted: false, isActive: true },
                    { projection: { boardName: 1 } }
                )
                : null,
            student.grade
                ? gradeCollection.findOne(
                    { _id: new ObjectId(student.grade), isDeleted: false, isActive: true },
                    { projection: { grade: 1 } }
                )
                : null
        ]);

        return {
            student: {
                ...student,
                gradeId: student.grade || null,
                gradeName: gradeDetails?.grade || null,
                boardId: student.nameOfTheBoard || null,
                boardName: boardDetails?.boardName || null,
            }
        };
    } catch (error: any) {
        console.error("Student Profile Error:", error);
        set.status = 500;
        return {
            message: "Internal Server Error",
        };
    }
};
export const getStudentEnrolledCourseDetails = async (
    ctx: Context<{ params: { enrollmentId: string } }>
) => {
    const { set, params } = ctx;
    const { enrollmentId } = params;

    try {
        // 1. Get enrollment details
        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        const enrollment = await enrollmentCollection.findOne({
            _id: new ObjectId(enrollmentId),
        });

        if (!enrollment) {
            set.status = 404;
            return {
                message: "Enrollment not found",
                status: false,
            };
        }

        // 2. Get course details
        const courseCollection = await getCollection(COURSE_COLLECTION);
        const course = await courseCollection.findOne({
            _id: enrollment.courseId,
            isDeleted: false,
            isActive: true,
        });

        if (!course) {
            set.status = 404;
            return {
                message: "Course not found",
                status: false,
            };
        }

        // 3. Get overall course progress
        const courseProgressCollection = await getCollection(COURSE_PROGRESS_COLLECTION);
        const overallProgress = await courseProgressCollection.findOne({
            enrollmentId: new ObjectId(enrollmentId),
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
            // chapterId: { $exists: false },
        });

        // 4. Get all chapters progress
        const chaptersCollection = await getCollection(CHAPTERS_COLLECTION);
        const lessonsCollection = await getCollection(LESSONS_COLLECTION);
        const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);

        const allChapters = await chaptersCollection
            .find({
                courseId: enrollment.courseId,
                isDeleted: false,
                isActive: true,
            })
            .sort({ order: 1 })
            .toArray();

        const chapterProgressList = await courseProgressCollection
            .find({
                enrollmentId: new ObjectId(enrollmentId),
                // chapterId: { $exists: true },
            })
            .toArray();

        // Build simplified chapter summary
        const chaptersSummary = [];

        for (const chapter of allChapters) {
            // Count total lessons for this chapter from lessons collection
            const totalLessons = await lessonsCollection.countDocuments({
                chapterId: chapter._id,
                courseId: enrollment.courseId,
                isDeleted: false,
                isActive: true,
            });

            // Count completed lessons for this chapter
            const completedLessons = await lessonProgressCollection.countDocuments({
                enrollmentId: new ObjectId(enrollmentId),
                chapterId: chapter._id,
                isLessonCompleted: true,
            });

            const completionPercentage = totalLessons > 0
                ? Math.round((completedLessons / totalLessons) * 100)
                : 0;

            chaptersSummary.push({
                chapterId: chapter._id,
                chapterName: chapter.chapterName,
                order: chapter.order,
                totalLessons,
                completedLessons,
                completionPercentage,
            });
        }

        // 5. Get lesson progress summary
        const allLessonProgress = await lessonProgressCollection
            .find({
                enrollmentId: new ObjectId(enrollmentId),
            })
            .toArray();

        const totalLessons = allLessonProgress.length;
        const completedLessons = allLessonProgress.filter(
            (l) => l.isLessonCompleted
        ).length;
        const lessonsInProgress = totalLessons - completedLessons;

        // 6. Get quiz attempts summary
        const quizAttemptsCollection = await getCollection(QUIZ_ATTEMPTS_COLLECTION);
        const allQuizAttempts = await quizAttemptsCollection
            .find({
                studentId: enrollment.studentId,
                courseId: enrollment.courseId,
            })
            .toArray();

        const totalQuizAttempts = allQuizAttempts.reduce(
            (sum, q) => sum + (q.attemptsCount || 0),
            0
        );

        const lessonsWithQuizPassed = allLessonProgress.filter(
            (l) => l.quizPassed
        ).length;

        // 7. Get task submission summary
        const taskCollection = await getCollection(TASK_COLLECTION);
        const taskSubmissionCollection = await getCollection(TASK_SUBMISSION_COLLECTION);

        const totalTasks = await taskCollection.countDocuments({
            courseId: enrollment.courseId,
            isDeleted: false,
            isActive: true,
        });

        const submittedTasks = await taskSubmissionCollection.countDocuments({
            studentId: enrollment.studentId,
            courseId: enrollment.courseId,
        });

        // 8. Build response
        set.status = 200;
        return {
            message: "Course progress fetched successfully",
            status: true,
            data: {
                course: {
                    courseId: course._id,
                    courseName: course.courseName,
                    bannerImage: course.bannerImage,
                    courseDurationMinutes: course.courseDurationMinutes,
                },
                enrollment: {
                    enrollmentId: enrollment._id,
                    enrolledAt: enrollment.enrolledAt,
                    status: enrollment.status,
                },
                overallProgress: {
                    completionPercentage: Math.round(overallProgress?.overallProgress || 0),
                    totalChapters: allChapters.length,
                    completedChapters: overallProgress?.completedChapters || 0,
                },
                chapters: chaptersSummary,
                lessons: {
                    total: totalLessons,
                    completed: completedLessons,
                    inProgress: lessonsInProgress,
                    completionPercentage:
                        totalLessons > 0
                            ? Math.round((completedLessons / totalLessons) * 100)
                            : 0,
                },
                quizzes: {
                    totalAttempts: totalQuizAttempts,
                    passed: lessonsWithQuizPassed,
                    passPercentage:
                        totalLessons > 0
                            ? Math.round((lessonsWithQuizPassed / totalLessons) * 100)
                            : 0,
                },
                tasks: {
                    total: totalTasks,
                    submitted: submittedTasks,
                    pending: totalTasks - submittedTasks,
                    completionPercentage:
                        totalTasks > 0
                            ? Math.round((submittedTasks / totalTasks) * 100)
                            : 0,
                },
            },
        };
    } catch (error: any) {
        console.error("Student Enrolled Course Error: ", error);
        set.status = 500;
        return {
            message: error?.message || "Internal Server Error",
            status: false,
        };
    }
};
export const deleteMyAccount = async (ctx: Context) => {
    const { set, store } = ctx;
    const { id: studentId } = store as StoreType;

    if (!studentId) {
        set.status = 401;
        return { message: "Unauthorized" };
    }

    const studentObjectId = new ObjectId(studentId);

    try {
        const studentCollection = await getCollection(STUDENT_COLLECTION);
        const chapterProgressCollection = await getCollection(CHAPTER_PROGRESS_COLLECTION);
        const courseProgressCollection = await getCollection(COURSE_PROGRESS_COLLECTION);
        const lessonProgressCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
        const courseForecastingCollection = await getCollection(COURSE_FORECASTING);
        const courseEnrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        const quizAttemptsCollection = await getCollection(QUIZ_ATTEMPTS_COLLECTION);
        const taskSubmissionCollection = await getCollection(TASK_SUBMISSION_COLLECTION);
        const taskSubmissionHistoryCollection = await getCollection(TASK_SUBMISSION_HISTORY_COLLECTION);
        const taskTimelineCollection = await getCollection(TASK_TIMELINE_COLLECTION);



        const studentSubmissions = await taskSubmissionCollection
            .find({ studentId: studentObjectId })
            .project({ _id: 1 })
            .toArray();

        const submissionIds = studentSubmissions.map(doc => doc._id);

        if (submissionIds.length > 0) {
            await taskTimelineCollection.deleteMany({
                submissionId: { $in: submissionIds }
            });

            await taskSubmissionHistoryCollection.deleteMany({
                submissionId: { $in: submissionIds }
            });
        }

        await taskSubmissionCollection.deleteMany({ studentId: studentObjectId });

        await quizAttemptsCollection.deleteMany({ studentId: studentObjectId });
        await courseForecastingCollection.deleteMany({ studentId: studentObjectId });
        await lessonProgressCollection.deleteMany({ studentId: studentObjectId });
        await chapterProgressCollection.deleteMany({ studentId: studentObjectId });
        await courseProgressCollection.deleteMany({ studentId: studentObjectId });
        await courseEnrollmentCollection.deleteMany({ studentId: studentObjectId });
        const deleteResult = await studentCollection.deleteOne({ _id: studentObjectId });

        if (deleteResult.deletedCount === 0) {
            set.status = 404;
            return { message: "Account not found" };
        }

        return {
            message: "Account   deleted successfully",
            status: true
        };

    } catch (error: any) {
        console.error("Student Account Deletion Error:", error);
        set.status = 500;
        return {
            message: "Internal Server Error",
            ...(process.env.NODE_ENV === "development" && { error: error.message })
        };
    }
};
/**
 * Get enrolled course details by studentId and courseId
 */
export const getStudentCourseDetailsByIds = async (
    ctx: Context<{ params: { studentId: string; courseId: string } }>
) => {
    const { set, params } = ctx;
    const { studentId, courseId } = params;

    try {
        const enrollmentCollection = await getCollection(COURSE_ENROLLMENT_COLLECTION);
        const enrollment = await enrollmentCollection.findOne({
            studentId: new ObjectId(studentId),
            courseId: new ObjectId(courseId),
        });

        if (!enrollment) {
            set.status = 404;
            return {
                message: "Student is not enrolled in this course",
                status: false,
            };
        }

        return getStudentEnrolledCourseDetails({
            ...ctx,
            params: { enrollmentId: enrollment._id.toString() },
        } as any);
    } catch (error: any) {
        console.error("Get Course Details By IDs Error: ", error);
        set.status = 500;
        return {
            message: error?.message || "Internal Server Error",
            status: false,
        };
    }
};