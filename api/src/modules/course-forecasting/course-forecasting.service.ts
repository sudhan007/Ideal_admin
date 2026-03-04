import { StoreType } from "@types";
import { Context } from "elysia";
import { CourseForecastSchema } from "./course-forecasting.model";
import { ObjectId } from "mongodb";
import { getCollection } from "@lib/config/db.config";
import { COURSE_COLLECTION, COURSE_ENROLLMENT_COLLECTION, COURSE_FORECASTING } from "@lib/Db_collections";

export const getForeCastDetails = async (ctx: Context<{ params: CourseForecastSchema }>) => {
    const { params, set, store } = ctx;
    const { courseId } = params;
    const { id } = store as StoreType;
    try {
        const forecastingCollection = await getCollection(COURSE_FORECASTING)
        const courseCollection = await getCollection(COURSE_COLLECTION)
        const forecast = await forecastingCollection.findOne({
            courseId: new ObjectId(courseId),
            studentId: new ObjectId(id)
        })
        if (!forecast) {
            set.status = 404;
            return { error: "Forecast details not found" };
        }

        const course = await courseCollection.findOne(
            { _id: new ObjectId(courseId) },
            { projection: { courseDurationMinutes: 1 } }
        )



        const data = {
            remainingAttempts: forecast.remainingAttempts,
            currentAttempt: forecast.currentAttempt,
            daysPerWeek: forecast.daysPerWeek,
            minutesPerDay: forecast.minutesPerDay,
            expectedCompletionDate: forecast.expectedCompletionDate,
            lastSetupAt: forecast.lastSetupAt,
            courseDuration: course?.courseDurationMinutes,
        }

        return {
            success: true,
            message: "Forecast details fetched successfully",
            data
        };
    } catch (error) {
        console.log("Failed to retrieve forecast details", error);
        set.status = 500;
        return { error: "Internal server error" };
    }
};

export const updateForeCast = async (ctx: Context<{ params: { courseId: string }, body: { daysPerWeek: number, minutesPerDay: number, expectedCompletionDate: string } }>) => {
    const { params, body, set, store } = ctx;
    const { courseId } = params;
    const { id } = store as StoreType;
    try {
        const forecastingCollection = await getCollection(COURSE_FORECASTING)

        const forecast = await forecastingCollection.findOne({
            courseId: new ObjectId(courseId),
            studentId: new ObjectId(id)
        });
        if (!forecast) {
            set.status = 404;
            return { error: "Forecast details not found" };
        }
        if (forecast.remainingAttempts <= 0) {
            set.status = 400;
            return { error: "No remaining attempts to update the study plan" };
        }
        const updateData = {
            daysPerWeek: body.daysPerWeek,
            minutesPerDay: body.minutesPerDay,
            expectedCompletionDate: new Date(body.expectedCompletionDate), // Convert string to Date
            currentAttempt: forecast.currentAttempt + 1,
            remainingAttempts: forecast.remainingAttempts - 1,
            lastSetupAt: new Date(),
            updatedAt: new Date()
        };
        await forecastingCollection.updateOne(
            { _id: forecast._id },
            { $set: updateData }
        );
        return { success: true, message: "Study plan updated successfully" };
    } catch (error) {
        console.log("Failed to update forecast details", error);
        set.status = 500;
        return { error: "Internal server error" };
    }
};

export const getAllForecasting = async (ctx: Context<{
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
        if (!ObjectId.isValid(studentId)) {
            set.status = 400;
            return { error: "Invalid student ID" };
        }

        const forecastingCollection = await getCollection(COURSE_FORECASTING);

        const pipeline: any[] = [
            {
                $match: { studentId: new ObjectId(studentId) }
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
                $unwind: { path: "$course", preserveNullAndEmptyArrays: true }
            }
        ];

        // Search filter
        if (search) {
            pipeline.push({
                $match: {
                    "course.courseName": { $regex: search, $options: "i" }
                }
            });
        }

        // Count total
        const countPipeline = [...pipeline, { $count: "total" }];
        const countResult = await forecastingCollection.aggregate(countPipeline).toArray();
        const totalForecasts = countResult[0]?.total || 0;

        // Project only required fields
        pipeline.push(
            {
                $project: {
                    _id: 1,
                    courseName: "$course.courseName",
                    currentAttempt: 1,
                    remainingAttempts: 1,
                    daysPerWeek: 1,
                    minutesPerDay: 1,
                    expectedCompletionDate: 1,
                    lastSetupAt: 1,
                    createdAt: 1,
                    updatedAt: 1
                }
            },
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit }
        );

        const forecasts = await forecastingCollection.aggregate(pipeline).toArray();
        const totalPages = Math.ceil(totalForecasts / limit);

        return {
            success: true,
            message: "Forecasting records retrieved successfully",
            data: forecasts,
            pagination: {
                currentPage: page,
                totalPages,
                totalForecasts,
                limit,
                hasNextPage: page < totalPages,
                hasPreviousPage: page > 1
            }
        };

    } catch (error) {
        console.log("Error fetching forecasting records:", error);
        set.status = 500;
        return { error: "Internal server error" };
    }
};