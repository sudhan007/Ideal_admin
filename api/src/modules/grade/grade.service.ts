import { Context } from "elysia";
import { getCollection } from "@lib/config/db.config";
import { ObjectId } from "mongodb";
import { CreateGradeSchema, GetGradeSchema, GRADE_COLLECTION, UpdateGradeSchema } from "./grade.model";


export const createGrade = async (ctx: Context<{ body: CreateGradeSchema }>) => {
    const { body, set } = ctx;
    const { grade } = body

    try {
        const gradeCollection = await getCollection(GRADE_COLLECTION);
        const gradedata = {
            grade,
            createdAt: new Date(),
            isDeleted: false,
            isActive: true
        };
        await gradeCollection.insertOne(gradedata);
        set.status = 201;
        return {
            message: "Grade created successfully",
        }
    } catch (error) {
        console.log("Grade Creation Error", error)
        set.status = 500;
        return { error: "Failed to create grade " };
    }
}
export const updateGrade = async (ctx: Context<{ body: UpdateGradeSchema, params: { gradeId: string } }>) => {
    const { body, set, params } = ctx;
    const { grade } = body
    const { gradeId } = params

    try {
        const gradeCollection = await getCollection(GRADE_COLLECTION);

        const grade = await gradeCollection.findOne({ _id: new ObjectId(gradeId), isDeleted: false, isActive: true });

        if (!grade) {
            return { error: "grade not found" };
        }

        await gradeCollection.updateOne({ _id: new ObjectId(gradeId) }, { $set: { grade } });
        set.status = 200;
        return {
            message: "Grade updated successfully",
        }


    } catch (error) {
        console.log("Grade updation Error", error)
        set.status = 500;
        return { error: "Failed to update Grade " };
    }
}
export const getAllGrades = async (ctx: Context<{ query: GetGradeSchema }>) => {
    const { set, query } = ctx;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 15));
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
            meta: {
                search: search || null,
            },
            message: 'Grades retrieved successfully',
        };
    } catch (error) {
        console.error('Error in getAll Grades:', error);
        set.status = 500;
        return {
            error: 'Failed to fetch Grades',
            staffs: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
        };
    }
};
