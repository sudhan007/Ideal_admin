import admin from "firebase-admin";
import { readFileSync } from "fs";
import { join } from "path";

const serviceAccount = JSON.parse(
    readFileSync(join(import.meta.dir, "../../../ideal_firebase.json"), "utf8")
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

export { admin };