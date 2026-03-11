import { getCollection } from "@lib/config/db.config";
import { APP_VERSION_COLLECTION } from "@lib/Db_collections";
import { Context } from "elysia";
import { AppVersionsCreateSchema } from "./appversion.model";

const APP_VERSION_DOC_ID: any = "singleton";

export const upsertAppVersion = async (ctx: Context<{ body: AppVersionsCreateSchema }>) => {
    const { body, set } = ctx;
    const { android, ios } = body;

    if (!android && !ios) {
        set.status = 400;
        return { error: "At least one of 'android' or 'ios' must be provided" };
    }

    try {
        const app_versions = await getCollection(APP_VERSION_COLLECTION);

        const updateFields: Record<string, string> = {};
        if (android) updateFields["android"] = android;
        if (ios) updateFields["ios"] = ios;

        await app_versions.updateOne(
            { _id: APP_VERSION_DOC_ID },
            {
                $set: {
                    ...updateFields,
                    updated_at: new Date(),
                },
                $setOnInsert: {
                    created_at: new Date(),
                }
            },
            { upsert: true }
        );

        const updated = await app_versions.findOne({ _id: APP_VERSION_DOC_ID });

        set.status = 200;
        return { message: "App version updated successfully", data: updated };

    } catch (error) {
        console.error("App version upsert error:", error);
        set.status = 500;
        return { error: "Failed to update app version" };
    }
}

export const getAppVersion = async ({ set }: Context) => {
    try {
        const app_versions = await getCollection(APP_VERSION_COLLECTION);

        const version = await app_versions.findOne({ _id: APP_VERSION_DOC_ID });

        if (!version) {
            set.status = 404;
            return { error: "App version not found" };
        }

        return { data: version };

    } catch (error) {
        console.error("App version fetch error:", error);
        set.status = 500;
        return { error: "Failed to fetch app version" };
    }
}