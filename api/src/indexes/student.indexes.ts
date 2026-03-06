import { getCollection } from "@lib/config/db.config";
import { STUDENT_COLLECTION } from "@lib/Db_collections";


export const createStudentIndexes = async () => {
    try {
        const studentCollection = await getCollection(STUDENT_COLLECTION);
        await studentCollection.createIndex({ studentName: 1 })
        await studentCollection.createIndex({ email: 1 }, { unique: true })
        await studentCollection.createIndex({ mobileNumber: 1 }, { unique: true })
        await studentCollection.createIndex({ grade: 1 })
        await studentCollection.createIndex({ nameOfTheBoard: 1 })
        await studentCollection.createIndex({ fcmToken: 1 })
    } catch (error) {
        console.log(error)
    }
}
