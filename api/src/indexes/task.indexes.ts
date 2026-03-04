import { getCollection } from "@lib/config/db.config";
import { TASK_COLLECTION, TASK_SUBMISSION_COLLECTION, TASK_SUBMISSION_HISTORY_COLLECTION, TASK_TIMELINE_COLLECTION } from "@lib/Db_collections";


export const createTaskIndexes = async () => {
    try {
        const taskCollection = await getCollection(TASK_COLLECTION);
        await taskCollection.createIndex({ taskName: 1 })
        await taskCollection.createIndex({ courseId: 1 })
        await taskCollection.createIndex({ chapterId: 1 })
        await taskCollection.createIndex({ lessonId: 1 })
    } catch (error) {
        console.log(error)
    }
}

export const createTaskSubmissionIndexes = async () => {
    try {
        const taskCollection = await getCollection(TASK_SUBMISSION_COLLECTION);
        await taskCollection.createIndex({ taskId: 1 })
        await taskCollection.createIndex({ studentId: 1 })

    } catch (error) {
        console.log(error)
    }
}

export const createTaskSubmissionHistoryIndexes = async () => {
    try {
        const taskCollection = await getCollection(TASK_SUBMISSION_HISTORY_COLLECTION);
        await taskCollection.createIndex({ submissionId: 1 })
        await taskCollection.createIndex({ taskId: 1 })
        await taskCollection.createIndex({ studentId: 1 })
        await taskCollection.createIndex({ currentStatus: 1 })

    } catch (error) {
        console.log(error)
    }
}

export const createTaskSubmissionTimeLineIndexes = async () => {
    try {
        const taskCollection = await getCollection(TASK_TIMELINE_COLLECTION);
        await taskCollection.createIndex({ submissionId: 1 })
        await taskCollection.createIndex({ historyId: 1 })
        await taskCollection.createIndex({ studentId: 1 })

    } catch (error) {
        console.log(error)
    }
}