import { Context } from "elysia";
import { getCollection } from "@lib/config/db.config";
import { ObjectId } from "mongodb";
import { CreateGradeSchema, GetGradeSchema, UpdateGradeSchema } from "./grade.model";
import { GRADE_COLLECTION } from "@lib/Db_collections";



export const createGrade = async (
    ctx: Context<{ body: CreateGradeSchema }>
) => {
    const { body, set } = ctx;
    const { grade } = body;

    try {
        const gradeCollection = await getCollection(GRADE_COLLECTION);

        const existingGrade = await gradeCollection.findOne({
            grade: { $regex: `^${grade}$`, $options: "i" },
            isDeleted: false,
        });

        if (existingGrade) {
            set.status = 409;
            return {
                error: "Grade already exists",
            };
        }

        await gradeCollection.insertOne({
            grade,
            isActive: true,
            isDeleted: false,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        set.status = 201;
        return {
            message: "Grade created successfully",
        };
    } catch (error) {
        console.error("Grade Creation Error", error);
        set.status = 500;
        return {
            message: "Failed to create grade",
        };
    }
};
export const updateGrade = async (
    ctx: Context<{ body: UpdateGradeSchema; params: { gradeId: string } }>
) => {
    const { body, set, params } = ctx;
    const { grade } = body;
    const { gradeId } = params;

    try {
        const gradeCollection = await getCollection(GRADE_COLLECTION);

        const existingGrade = await gradeCollection.findOne({
            _id: new ObjectId(gradeId),
            isDeleted: false,
        });

        if (!existingGrade) {
            set.status = 400;
            return {
                error: "Grade not found",
            };
        }

        const duplicateGrade = await gradeCollection.findOne({
            grade: { $regex: `^${grade}$`, $options: "i" },
            _id: { $ne: new ObjectId(gradeId) },
            isDeleted: false,
        });

        if (duplicateGrade) {
            set.status = 400;
            return {
                message: "Grade name already exists",
            };
        }

        await gradeCollection.updateOne(
            { _id: new ObjectId(gradeId) },
            {
                $set: {
                    grade,
                    updatedAt: new Date(),
                },
            }
        );

        set.status = 200;
        return {
            message: "Grade updated successfully",
        };
    } catch (error) {
        console.error("Grade Update Error", error);
        set.status = 500;
        return {
            message: "Failed to update grade",
        };
    }
};
export const getAllGrades = async (ctx: Context<{ query: GetGradeSchema }>) => {
    const { set, query } = ctx;

    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = query.search?.trim() || '';

    try {
        const gradeCollection = await getCollection(GRADE_COLLECTION);

        const pipeline: any[] = [
            { $match: { isDeleted: false, isActive: true } }
        ];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { grade: { $regex: search, $options: 'i' } },
                    ],
                },
            });
        }

        pipeline.push({
            $facet: {
                metadata: [{ $count: 'total' }],
                data: [
                    { $skip: skip },
                    { $limit: limit },
                    {
                        $project: {
                            _id: 1,
                            grade: 1,
                        },
                    },
                ],
            },
        });

        const [result] = await gradeCollection.aggregate(pipeline).toArray();

        const total = result.metadata[0]?.total || 0;
        const grades = result.data || [];

        set.status = 200;
        return {
            grades,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1,
            },
            message: 'Grades retrieved successfully',
        };
    } catch (error) {
        console.error('Error in getAll Grades:', error);
        set.status = 500;
        return {
            message: error
        }
    }
};
export const deleteGradeById = async (ctx: Context<{ params: { gradeId: string } }>) => {
    const { params, set } = ctx;
    const { gradeId } = params;
    try {
        const courseCollection = await getCollection(GRADE_COLLECTION);
        const result = await courseCollection.updateOne(
            { _id: new ObjectId(gradeId) },
            { $set: { isDeleted: true } }
        );
        if (result.modifiedCount === 0) {
            set.status = 404;
            return { error: "Grade not found" };
        }
        return {
            message: "Grade deleted successfully",
        };
    } catch (error) {
        console.log("Grade Deleted Error", error);
        set.status = 500;
        return { error: "Failed to delete Grade" };
    }
}
