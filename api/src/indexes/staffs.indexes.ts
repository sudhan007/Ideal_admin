import { getCollection } from "../lib/config/db.config";

const STAFFS_COLLECTION = "staffs";

export const createStaffIndexes = async () => {
    try {
        const staffsCollection = await getCollection(STAFFS_COLLECTION);
        await staffsCollection.createIndex({ phoneNumber: 1 }, { unique: true });
        await staffsCollection.createIndex({ staffName: 1 });
    } catch (error) {
        console.log(error)
    }
}
