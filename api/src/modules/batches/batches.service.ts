import { Context } from "elysia";
import { batchCreateSchema, BatchGetQuerySchema, BatchUpdateSchema, RegisterStudentToBatchSchema } from "./batches.model";
import { getCollection } from "@lib/config/db.config";
import { ObjectId } from "mongodb";
import { BATCH_COLLECTION, BATCH_ENROLLMENTS_COLLECTION, COURSE_COLLECTION, STUDENT_COLLECTION } from "@lib/Db_collections";
import { uploadFileToS3 } from "@lib/utils/s3";
import { StoreType, StudentType } from "@types";

async function checkBatchUniqueness(
    batchCollection: any,
    batchName: string,
    batchCode: string,
    excludeBatchId?: ObjectId
) {
    const query: any = {
        $or: [
            { batchName: { $regex: `^${batchName}$`, $options: "i" } }, // case-insensitive exact match
            { batchCode: { $regex: `^${batchCode}$`, $options: "i" } },
        ],
        isDeleted: false,
    };

    if (excludeBatchId) {
        query._id = { $ne: excludeBatchId };
    }

    const existing = await batchCollection.findOne(query);

    if (existing) {
        if (existing.batchName.toLowerCase() === batchName.toLowerCase()) {
            throw new Error("Batch name already exists");
        }
        if (existing.batchCode.toLowerCase() === batchCode.toLowerCase()) {
            throw new Error("Batch code already exists");
        }
    }
}
export const createBatch = async (ctx: Context<{ body: batchCreateSchema }>) => {
    const { body, set } = ctx;
    const {
        batchName,
        batchCode,
        courseId,
        // days,
        endDate,
        endTime,
        startDate,
        startTime,
    } = body;
    try {
        const batchCollection = await getCollection(BATCH_COLLECTION)

        await checkBatchUniqueness(batchCollection, batchName, batchCode);

        const batchDocument = {
            courseId: new ObjectId(courseId),
            batchName,
            batchCode,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            // days,
            startTime,
            endTime,
            isActive: true,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const result = await batchCollection.insertOne(batchDocument);

        set.status = 201;
        return {
            message: "Batch created successfully",
            ok: true
        };

    } catch (error) {
        console.error("Error creating Batch:", error);
        set.status = 500;
        return { error: "Failed to create Batch" };
    }
};
export const updateBatch = async (ctx: Context<{ body: BatchUpdateSchema; params: { id: string } }>) => {
    const { body, set, params } = ctx;
    const batchId = params.id;

    try {
        const batchCollection = await getCollection(BATCH_COLLECTION);

        const existingBatch = await batchCollection.findOne({
            _id: new ObjectId(batchId),
            isDeleted: false,
        });

        if (!existingBatch) {
            set.status = 404;
            return { ok: false, error: "Batch not found" };
        }

        if (body.batchName !== undefined || body.batchCode !== undefined) {
            const nameToCheck = body.batchName ?? existingBatch.batchName;
            const codeToCheck = body.batchCode ?? existingBatch.batchCode;

            await checkBatchUniqueness(
                batchCollection,
                nameToCheck,
                codeToCheck,
                new ObjectId(batchId)
            );
        }

        const updateData: any = {
            updatedAt: new Date(),
        };

        if (body.batchName !== undefined) updateData.batchName = body.batchName;
        if (body.batchCode !== undefined) updateData.batchCode = body.batchCode;
        if (body.courseId !== undefined) updateData.courseId = new ObjectId(body.courseId);
        if (body.startDate !== undefined) updateData.startDate = new Date(body.startDate);
        if (body.endDate !== undefined) updateData.endDate = new Date(body.endDate);

        if (body.startTime !== undefined) updateData.startTime = body.startTime;
        if (body.endTime !== undefined) updateData.endTime = body.endTime;
        if (body.isActive !== undefined) updateData.isActive = body.isActive;

        if (Object.keys(updateData).length > 1) {
            await batchCollection.updateOne(
                { _id: new ObjectId(batchId) },
                { $set: updateData }
            );
        }

        set.status = 200;
        return {
            ok: true,
            message: "Batch updated successfully",
        };
    } catch (error) {
        console.error("Error updating Batch:", error);
        set.status = 500;
        return { ok: false, error: "Failed to update batch" };
    }
};
export const getBatches = async (ctx: Context<{ query: BatchGetQuerySchema }>) => {
    const { set, query } = ctx;

    try {
        const page = parseInt(query.page || "1", 10);
        const limit = parseInt(query.limit || "10", 10);
        const skip = (page - 1) * limit;

        const batchCollection = await getCollection(BATCH_COLLECTION);

        const filter: any = {
            isDeleted: false,
        };

        if (query.courseId) {
            filter.courseId = new ObjectId(query.courseId);
        }

        if (query.isActive !== undefined) {
            filter.isActive = query.isActive === "true";
        }

        if (query.search) {
            filter.$or = [
                { batchName: { $regex: query.search, $options: "i" } },
                { batchCode: { $regex: query.search, $options: "i" } },
            ];
        }

        const pipeline = [
            { $match: filter },
            {
                $facet: {
                    metadata: [{ $count: "total" }],
                    data: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: limit },
                        {
                            $lookup: {
                                from: COURSE_COLLECTION,
                                localField: "courseId",
                                foreignField: "_id",
                                as: "course"
                            }
                        },
                        { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                _id: 1,
                                batchName: 1,
                                batchCode: 1,
                                startDate: 1,
                                endDate: 1,
                                startTime: 1,
                                endTime: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                courseId: 1,
                                "course.courseName": 1
                            }
                        }
                    ],
                },
            },
        ];

        const [result] = await batchCollection.aggregate(pipeline).toArray();

        const total = result.metadata[0]?.total ?? 0;
        const batches = result.data;

        set.status = 200;
        return {
            ok: true,
            data: batches,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    } catch (error) {
        console.error("Error fetching batches:", error);
        set.status = 500;
        return { ok: false, error: "Failed to fetch batches" };
    }
};
export const registerStudentToBatch = async (
    ctx: Context<{ body: RegisterStudentToBatchSchema }>
) => {
    const { body, set, store } = ctx;
    const { id } = store as StoreType
    const {
        batchId,
        mobileNumber,
        email,
        loginMethod,
        studentName,
        dateOfBirth,
        gender,
        studentPhoneNumber,
        parentPhoneNumber,
        parentPhoneNumber2,
        parentName,
        address,
        studentProfile,
        grade,
        nameOfTheBoard,
        previousYearAnnualTotalMarks,
        previousYearMathMarks,
        referedBy,
    } = body;

    const studentCollection = await getCollection(STUDENT_COLLECTION);
    const batchCollection = await getCollection(BATCH_COLLECTION);
    const batchEnrollmentCollection = await getCollection(BATCH_ENROLLMENTS_COLLECTION);

    try {

        const batch = await batchCollection.findOne({
            _id: new ObjectId(batchId),
            isDeleted: false,
        });

        if (!batch) {
            set.status = 404;
            return {
                error: "Batch not found or has been deleted",
                status: false,
            };
        }

        if (!batch.isActive) {
            set.status = 400;
            return {
                error: "Batch is not active",
                status: false,
            };
        }
        const duplicateCheck: any = { $or: [] };

        // if (studentPhoneNumber) {
        //     duplicateCheck.$or.push({
        //         studentPhoneNumber: studentPhoneNumber,
        //     });
        // }

        if (email) {
            duplicateCheck.$or.push({
                email: email.toLowerCase(),
            });
        }

        if (mobileNumber) {
            duplicateCheck.$or.push({
                mobileNumber: mobileNumber,
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


        let profileImageUrl = "";
        if (studentProfile) {
            const upload = await uploadFileToS3(
                studentProfile,
                "students/profile"
            );
            profileImageUrl = upload.fullUrl;
        }


        const studentDocument = {
            studentName,
            dateOfBirth,
            gender,
            studentPhoneNumber,
            parentPhoneNumber,
            parentPhoneNumber2,
            parentName,
            address,
            profileImageUrl,
            grade: new ObjectId(grade),
            nameOfTheBoard: new ObjectId(nameOfTheBoard),
            previousYearAnnualTotalMarks: parseFloat(previousYearAnnualTotalMarks),
            previousYearMathMarks: parseFloat(previousYearMathMarks),
            referedBy,
            mobileNumber,
            email: email?.toLowerCase(),
            loginMethod,
            studentType: StudentType.OFFLINE,
            isActive: true,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            registrationComplete: true
            // createdBy: new ObjectId(adminId), // Add admin ID from auth context
        };

        const studentResult = await studentCollection.insertOne(studentDocument);
        const studentId = studentResult.insertedId;


        const batchEnrollment = {
            studentId,
            batchId: new ObjectId(batchId),
            courseId: batch.courseId,
            batchEnrollmentDate: new Date(),
            totalClassesAttended: 0,
            attendancePercentage: 0,
            onlineCourseAccess: false,
            createdAt: new Date(),
            updatedAt: new Date(),
            enrolledBy: new ObjectId(id),
        };

        await batchEnrollmentCollection.insertOne(batchEnrollment);

        set.status = 201;
        return {
            message: "Student registered and enrolled to batch successfully",
            status: true,
        };
    } catch (error: any) {
        console.error("Student batch registration error:", error);
        set.status = 500;
        return {
            error: "Failed to register student to batch",
            details: error.message,
            status: false,
        };
    }
};
export const getBatchStudents = async (
    ctx: Context<{
        params: { batchId: string };
        query: {
            page?: string;
            limit?: string;
        };
    }>
) => {
    const { params, query, set } = ctx;
    const { batchId } = params;

    // Parse pagination params with safe defaults
    const page = Math.max(1, parseInt(query.page || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(query.limit || "20", 10))); // max 50 per page
    const skip = (page - 1) * limit;

    try {
        const enrollmentCollection = await getCollection(BATCH_ENROLLMENTS_COLLECTION);

        // Build aggregation pipeline
        const pipeline = [
            // 1. Filter active enrollments for this batch
            {
                $match: {
                    batchId: new ObjectId(batchId),
                },
            },

            // 2. Lookup student info
            {
                $lookup: {
                    from: STUDENT_COLLECTION,
                    localField: "studentId",
                    foreignField: "_id",
                    as: "student",
                },
            },

            // 3. Unwind student array
            { $unwind: "$student" },

            // 5. Project only needed fields
            {
                $project: {
                    _id: 1,
                    enrollmentDate: 1,
                    status: 1,
                    courseId: 1,
                    totalClassesConducted: 1,
                    totalClassesAttended: 1,
                    attendancePercentage: 1,
                    batchEnrollmentDate: 1,
                    onlineCourseAccess: 1,
                    student: {
                        _id: 1,
                        studentName: 1,
                        profileImageUrl: 1,
                        studentType: 1,
                    },
                },
            },

            // 6. Sort (optional - newest first)
            { $sort: { batchEnrollmentDate: -1 } },

            // === Pagination Facet ===
            {
                $facet: {
                    metadata: [
                        { $count: "total" }
                    ],
                    data: [
                        { $skip: skip },
                        { $limit: limit }
                    ]
                }
            }
        ];

        const result = await enrollmentCollection.aggregate(pipeline).toArray();

        // Extract results
        const data = result[0]?.data || [];
        const total = result[0]?.metadata?.[0]?.total || 0;

        set.status = 200;
        return {
            status: true,
            data,
            pagination: {
                page,
                limit,
                total,
                totalPages: total > 0 ? Math.ceil(total / limit) : 1,
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
            count: data.length,
        };

    } catch (error: any) {
        console.error("Get batch students error:", error);
        set.status = 500;
        return {
            status: false,
            error: "Failed to fetch batch students",
            message: error.message || "Internal server error"
        };
    }
};
export const studentEnrolledBatches = async (ctx: Context<{
    params: { studentId: string },
    query: { page?: string, limit?: string, search?: string }
}>) => {
    const { params, query, set } = ctx;
    const { studentId } = params;
    const page = parseInt(query.page || "1");
    const limit = parseInt(query.limit || "10");
    const search = query.search?.trim() || "";
    const skip = (page - 1) * limit;

    try {
        // Validate studentId
        if (!ObjectId.isValid(studentId)) {
            set.status = 400;
            return { error: "Invalid student ID" };
        }

        const enrollmentsCollection = await getCollection(BATCH_ENROLLMENTS_COLLECTION);

        // Build match conditions
        const matchConditions: any = {
            studentId: new ObjectId(studentId)
        };

        // Build aggregation pipeline
        const pipeline: any[] = [
            {
                $match: matchConditions
            },
            {
                $lookup: {
                    from: BATCH_COLLECTION,
                    localField: "batchId",
                    foreignField: "_id",
                    as: "batch"
                }
            },
            {
                $unwind: {
                    path: "$batch",
                    preserveNullAndEmptyArrays: false
                }
            },
            {
                $match: {
                    "batch.isDeleted": false
                }
            },
            {
                $lookup: {
                    from: COURSE_COLLECTION,
                    localField: "courseId",
                    foreignField: "_id",
                    as: "course"
                }
            },
            {
                $unwind: {
                    path: "$course",
                    preserveNullAndEmptyArrays: true
                }
            }
        ];

        // Add search filter if provided
        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { "batch.batchName": { $regex: search, $options: "i" } },
                        { "batch.batchCode": { $regex: search, $options: "i" } },
                        { "course.courseName": { $regex: search, $options: "i" } }
                    ]
                }
            });
        }

        // Get total count
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await enrollmentsCollection.aggregate(countPipeline).toArray();
        const totalEnrollments = countResult[0]?.total || 0;

        // Add projection, sorting, skip and limit
        pipeline.push(
            {
                $project: {
                    _id: 1,
                    batch: {
                        _id: "$batch._id",
                        batchName: "$batch.batchName",
                        batchCode: "$batch.batchCode",
                        startDate: "$batch.startDate",
                        endDate: "$batch.endDate",
                        startTime: "$batch.startTime",
                        endTime: "$batch.endTime",
                    },
                    course: {
                        _id: "$course._id",
                        courseName: "$course.courseName",
                    }
                }
            },
            {
                $sort: { batchEnrollmentDate: -1 }
            },
            {
                $skip: skip
            },
            {
                $limit: limit
            }
        );

        const enrolledBatches = await enrollmentsCollection.aggregate(pipeline).toArray();

        const totalPages = Math.ceil(totalEnrollments / limit);

        return {
            message: "Student enrolled batches retrieved successfully",
            studentId,
            data: enrolledBatches,
            pagination: {
                currentPage: page,
                totalPages,
                totalEnrollments,
                limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        };

    } catch (error) {
        set.status = 500;
        console.error("Error fetching student enrolled batches:", error);
        return { error: "Failed to fetch student enrolled batches" };
    }
};
export const getBatchById = async (ctx: Context<{ params: { batchId: string } }>) => {
    const { params, set } = ctx;
    const { batchId } = params;
    try {
        const batchCollection = await getCollection(BATCH_COLLECTION);
        const pipline: any[] = [];

        pipline.push({
            $match: { _id: new ObjectId(batchId), isDeleted: false, isActive: true }
        });


        const batch = await batchCollection.aggregate(pipline).toArray();


        if (!batch) {
            set.status = 404;
            return { error: "Batch not found" };
        }
        return {
            batch,
            message: "Batch retrieved successfully",
        };
    } catch (error) {
        console.log("Batch Retrived Error", error);
        set.status = 500;
        return { error: "Failed to retrieve Batch" };
    }
}