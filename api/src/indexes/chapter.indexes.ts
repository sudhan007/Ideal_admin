import { getCollection } from "@lib/config/db.config";
import { CHAPTERS_COLLECTION, CHAPTER_PROGRESS_COLLECTION } from "@lib/Db_collections";


export const chapterIndexes = async () => {
    try {
        const lessonCollection = await getCollection(CHAPTERS_COLLECTION);
        await lessonCollection.createIndex({ courseId: 1 })
        await lessonCollection.createIndex({ type: 1 })

    } catch (error) {
        console.log(error)
    }
}

export const chapterProgressIndexes = async () => {
    try {
        const questionCollection = await getCollection(CHAPTER_PROGRESS_COLLECTION);
        await questionCollection.createIndex({ enrollmentId: 1 })
        await questionCollection.createIndex({ courseId: 1 })
        await questionCollection.createIndex({ chapterId: 1 })
        await questionCollection.createIndex({ lessonId: 1 })
        await questionCollection.createIndex({ studentId: 1 })


    } catch (error) {
        console.log(error)
    }
}