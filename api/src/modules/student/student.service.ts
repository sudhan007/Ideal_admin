import { Context } from "elysia";
import { getCollection } from "@lib/config/db.config";
import {
    EducationDetailsCreateInput,
    StudentDetailsCreateInput,
    StudentUpdateInput,
    STUDENTS_COLLECTION,
} from "./student-model";
import { StoreType } from "@types";
import { uploadFileToS3 } from "@lib/utils/s3";
import { ObjectId } from "mongodb";



export const registerStudentDetails = async (
    ctx: Context<{ body: StudentDetailsCreateInput }>
) => {
    const { body, set, store } = ctx;
    const { studentProfile, ...personalDetails } = body;
    const { id } = store as StoreType;
    const studentCollection = await getCollection(STUDENTS_COLLECTION);

    try {

        const existingStudent = await studentCollection.findOne({
            _id: new ObjectId(id),
        });

        if (!existingStudent) {
            set.status = 404;
            return { error: "Student not found" };
        }

        const duplicateCheck: any = { $or: [] };

        if (personalDetails.studentPhoneNumber) {
            duplicateCheck.$or.push({
                studentPhoneNumber: personalDetails.studentPhoneNumber,
                _id: { $ne: new ObjectId(id) },
            });
        }

        if (personalDetails.email) {
            duplicateCheck.$or.push({
                email: personalDetails.email.toLowerCase(),
                _id: { $ne: new ObjectId(id) },
            });
        }

        if (duplicateCheck.$or.length) {
            const duplicate = await studentCollection.findOne(duplicateCheck);
            if (duplicate) {
                set.status = 400;
                return {
                    error: "Student with this phone number or email already exists",
                    status: false,
                };
            }
        }

        let profileImageUrl = existingStudent.profileImageUrl;
        if (studentProfile) {
            const upload = await uploadFileToS3(
                studentProfile,
                "students/profile"
            );
            profileImageUrl = upload.fullUrl;
        }

        await studentCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    ...personalDetails,
                    dateOfBirth: new Date(personalDetails.dateOfBirth),
                    email: personalDetails.email
                        ? personalDetails.email.toLowerCase()
                        : existingStudent.email,

                    profileImageUrl,
                    registrationComplete: true,
                    updatedAt: new Date(),
                },
            }
        );

        set.status = 201;
        return {
            message: "Student details registered successfully",
            studentId: id,
        };
    } catch (error: any) {
        console.error("Student registration error:", error);
        set.status = 500;
        return { error: "Failed to register student", details: error.message };
    }
};
export const addEducationDetails = async (
    ctx: Context<{ body: EducationDetailsCreateInput }>
) => {
    const { body, set, store } = ctx;
    const { grade, nameOfTheBoard, previousYearAnnualTotalMarks, previousYearMathMarks, referedBy } = body
    const { id } = store as StoreType;
    const studentCollection = await getCollection(STUDENTS_COLLECTION);

    try {

        const updateResult = await studentCollection.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    referedBy,
                    grade,
                    nameOfTheBoard,
                    previousYearMathMarks,
                    previousYearAnnualTotalMarks,
                    updatedAt: new Date(),
                    registrationComplete: true,
                },
            }
        );

        if (updateResult.matchedCount === 0) {
            set.status = 404;
            return { error: "Student not found", status: false };
        }

        return {
            message: "Education details added successfully",
            studentId: id,
            registrationComplete: true,
        };
    } catch (error: any) {
        console.error("Add education details error:", error);
        set.status = 500;
        return { error: "Failed to add education details", details: error.message };
    }
};
export const updateStudentProfile = async (
    ctx: Context<{ body: StudentUpdateInput }>
) => {
    const { body, set, store } = ctx;
    const { studentProfile, ...updateDetails } = body;
    const { id } = store as StoreType;
    const studentCollection = await getCollection(STUDENTS_COLLECTION);

    try {

        const updateFields: any = {
            ...updateDetails,
            updatedAt: new Date(),
        };

        if (updateDetails.email) {
            updateFields.email = updateDetails.email.toLowerCase();
        }

        const duplicateCheck: any = { $or: [] };
        if (updateDetails.studentPhoneNumber) {
            duplicateCheck.$or.push({ studentPhoneNumber: updateDetails.studentPhoneNumber });
        }
        if (updateDetails.email) {
            duplicateCheck.$or.push({ email: updateFields.email });
        }
        if (duplicateCheck.$or.length > 0) {
            duplicateCheck._id = { $ne: new ObjectId(id) };
            const existing = await studentCollection.findOne(duplicateCheck);
            if (existing) {
                set.status = 400;
                return {
                    error: "Another student with this phone or email already exists",
                    status: false,
                };
            }
        }

        if (studentProfile) {
            const { fullUrl: profileImageUrl } = await uploadFileToS3(studentProfile, "students/profile");
            updateFields.profileImageUrl = profileImageUrl;
        }

        const result = await studentCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updateFields }
        );

        if (result.matchedCount === 0) {
            set.status = 404;
            return { error: "Student not found", status: false };
        }

        return {
            message: "Student profile updated successfully",
            studentId: id,
        };
    } catch (error: any) {
        console.error("Update student error:", error);
        set.status = 500;
        return { error: "Failed to update student", details: error.message };
    }
};