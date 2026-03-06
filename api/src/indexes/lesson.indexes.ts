import { getCollection } from "@lib/config/db.config";
import { LESSONS_COLLECTION, LESSON_PROGRESS_COLLECTION } from "@lib/Db_collections";


export const lessonIndexes = async () => {
    try {
        const lessonCollection = await getCollection(LESSONS_COLLECTION);
        await lessonCollection.createIndex({ courseId: 1 })
        await lessonCollection.createIndex({ chapterId: 1 })
        await lessonCollection.createIndex({ type: 1 })

    } catch (error) {
        console.log(error)
    }
}

export const lessonProgressIndexes = async () => {
    try {
        const questionCollection = await getCollection(LESSON_PROGRESS_COLLECTION);
        await questionCollection.createIndex({ enrollmentId: 1 })
        await questionCollection.createIndex({ courseId: 1 })
        await questionCollection.createIndex({ chapterId: 1 })
        await questionCollection.createIndex({ lessonId: 1 })
        await questionCollection.createIndex({ studentId: 1 })


    } catch (error) {
        console.log(error)
    }
}