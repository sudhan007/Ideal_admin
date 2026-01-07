import { Context } from "elysia";
import { BOARD_COLLECTION, CreateBoardSchema, GetBoardSchema, UpdateBoardSchema } from "./board.model";
import { getCollection } from "@lib/config/db.config";
import { ObjectId } from "mongodb";


export const createBoard = async (ctx: Context<{ body: CreateBoardSchema }>) => {
    const { body, set } = ctx;
    const { boardName } = body

    try {
        const boardCollection = await getCollection(BOARD_COLLECTION);
        const boarddata = {
            boardName,
            createdAt: new Date(),
            isDeleted: false,
            isActive: true
        };
        await boardCollection.insertOne(boarddata);
        set.status = 201;
        return {
            message: "Board created successfully",
        }
    } catch (error) {
        console.log("Board Creation Error", error)
        set.status = 500;
        return { error: "Failed to create board " };
    }
}
export const updateBoard = async (ctx: Context<{ body: UpdateBoardSchema, params: { boardId: string } }>) => {
    const { body, set, params } = ctx;
    const { boardName } = body
    const { boardId } = params

    try {
        const boardCollection = await getCollection(BOARD_COLLECTION);

        const board = await boardCollection.findOne({ _id: new ObjectId(boardId), isDeleted: false, isActive: true });

        if (!board) {
            return { error: "board not found" };
        }

        await boardCollection.updateOne({ _id: new ObjectId(boardId) }, { $set: { boardName } });
        set.status = 200;
        return {
            message: "Board updated successfully",
        }


    } catch (error) {
        console.log("Board updation Error", error)
        set.status = 500;
        return { error: "Failed to update board " };
    }
}
export const getAllBoards = async (ctx: Context<{ query: GetBoardSchema }>) => {
    const { set, query } = ctx;

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 15));
    const skip = (page - 1) * limit;
    const search = query.search?.trim() || '';



    try {
        const boardCollection = await getCollection(BOARD_COLLECTION);

        const pipeline: any[] = [
            { $match: { isDeleted: false, isActive: true } }
        ];

        if (search) {
            pipeline.push({
                $match: {
                    $or: [
                        { boardName: { $regex: search, $options: 'i' } },
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
                            boardName: 1,
                        },
                    },
                ],
            },
        });

        const [result] = await boardCollection.aggregate(pipeline).toArray();

        const total = result.metadata[0]?.total || 0;
        const boards = result.data || [];

        set.status = 200;
        return {
            boards,
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
            message: 'Boards retrieved successfully',
        };
    } catch (error) {
        console.error('Error in getAll Boards:', error);
        set.status = 500;
        return {
            error: 'Failed to fetch boards',
            staffs: [],
            pagination: { page, limit, total: 0, totalPages: 0 },
        };
    }
};
