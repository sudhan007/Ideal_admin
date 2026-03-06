import { getCollection } from "@lib/config/db.config";
import { QUESTIONS_COLLECTION, QUIZ_ATTEMPTS_COLLECTION } from "@lib/Db_collections";


export const questionIndexes = async () => {
    try {
        const questionCollection = await getCollection(QUESTIONS_COLLECTION);
        await questionCollection.createIndex({ courseId: 1 })
        await questionCollection.createIndex({ chapterId: 1 })
        await questionCollection.createIndex({ lessonId: 1 })
        await questionCollection.createIndex({ type: 1 })

    } catch (error) {
        console.log(error)
    }
}

export const questionattemptsIndexes = async () => {
    try {
        const questionCollection = await getCollection(QUIZ_ATTEMPTS_COLLECTION);
        await questionCollection.createIndex({ studentId: 1 })

    } catch (error) {
        console.log(error)
    }
}