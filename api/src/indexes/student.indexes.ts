import { getCollection } from "@lib/config/db.config";

const STUDENT_COLLECTION = "students";

export const createStudentIndexes = async () => {
    try {
        const studentCollection = await getCollection(STUDENT_COLLECTION);
        await studentCollection.createIndex({ studentName: 1 })
        await studentCollection.createIndex({ studentPhoneNumber: 1 })
        await studentCollection.createIndex({ email: 1 })
        await studentCollection.createIndex({ mobileNumber: 1 }, { unique: true })
        await studentCollection.createIndex({ grade: 1 })
        await studentCollection.createIndex({ board: 1 })
        console.log("Student indexes created successfully");
    } catch (error) {
        console.log(error)
    }
}
