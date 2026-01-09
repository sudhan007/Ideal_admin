import { type Context } from "elysia";
import { COURSE_COLLECTION, CourseCreateInput, CourseNamesQuery, CourseUpdateInput, GetCoursesInput } from "./course.model";
import { getCollection } from "@lib/config/db.config";
import { uploadFileToS3 } from "@lib/utils/s3";
import { ObjectId } from "mongodb";
import { STAFFS_COLLECTION } from "../staffs/staffs.model";
import { LESSONS_COLLECTION } from "modules/lessons/lessons.model";
import { CHAPTERS_COLLECTION } from "modules/chapters/chapters.model";
import { BOARD_COLLECTION } from "modules/board/board.model";
import { GRADE_COLLECTION } from "modules/grade/grade.model";


export const createCourse = async (ctx: Context<{ body: CourseCreateInput }>) => {
  const { body, set } = ctx;
  const { courseName, mentor, strikePrice, actualPrice, bannerImage, board, grade, courseDurationMinutes } = body
  try {
    const courseCollection = await getCollection(COURSE_COLLECTION);
    const staffCollection = await getCollection(STAFFS_COLLECTION);
    const boardCollection = await getCollection(BOARD_COLLECTION);
    const gradeCollection = await getCollection(GRADE_COLLECTION);

    if (mentor) {
      const mentorExists = await staffCollection.findOne({ _id: new ObjectId(mentor), isDeleted: false, isActive: true });
      if (!mentorExists) {
        set.status = 400;
        return { error: "Invalid mentor ID", status: false };
      }
    }

    if (board) {
      const boardExist = await boardCollection.findOne({ _id: new ObjectId(board), isDeleted: false, isActive: true });
      if (!boardExist) {
        set.status = 400;
        return { error: "Invalid board ID", status: false };
      }
    }

    if (grade) {
      const gradeExist = await gradeCollection.findOne({ _id: new ObjectId(grade), isDeleted: false, isActive: true });
      if (!gradeExist) {
        set.status = 400;
        return { error: "Invalid grade ID", status: false };
      }
    }

    const courseExists = await courseCollection.findOne({ courseName });
    if (courseExists) {
      set.status = 400;
      return { error: "Course name already exists", status: false };
    }
    const { fullUrl, fileKey } = await uploadFileToS3(bannerImage, "courses");
    const courseData = {
      courseName,
      mentor: mentor ? new ObjectId(mentor) : null,
      strikePrice: Number(strikePrice),
      actualPrice: Number(actualPrice),
      board: board ? new ObjectId(board) : null,
      grade: grade ? new ObjectId(grade) : null,
      bannerImage: fullUrl ?? fileKey,
      createdAt: new Date(),
      courseDurationMinutes: Number(courseDurationMinutes),
      isDeleted: false,
      isActive: true
    };
    const result = await courseCollection.insertOne(courseData);
    console.log(result)
    set.status = 201;
    return {
      message: "Course created successfully",
      courseId: result,
    }
  } catch (error) {
    console.log(error)
    set.status = 500;
    return { error: "Failed to create course" };
  }
}

export const updateCourse = async (ctx: Context<{ body: CourseUpdateInput, params: { courseId: string } }>) => {
  const { body, params, set } = ctx;
  const { courseId } = params;

  try {
    const courseCollection = await getCollection(COURSE_COLLECTION);
    const course = await courseCollection.findOne({ _id: new ObjectId(courseId), isDeleted: false });

    if (!course) {
      return { error: "Course not found" };
    }

    const { courseName, mentor, strikePrice, actualPrice, bannerImage, board, grade, courseDurationMinutes } = body
    let bannerUrl = course.bannerImage;

    if (bannerImage instanceof File) {
      const { fullUrl, fileKey } = await uploadFileToS3(bannerImage, "courses");
      bannerUrl = fullUrl ?? fileKey;
    }

    const courseData = {
      courseName,
      mentor: mentor ? new ObjectId(mentor) : null,
      strikePrice: Number(strikePrice),
      actualPrice: Number(actualPrice),
      board: board ? new ObjectId(board) : null,
      grade: grade ? new ObjectId(grade) : null,
      bannerImage: bannerUrl,
      courseDurationMinutes: Number(courseDurationMinutes),
    };
    const result = await courseCollection.updateOne({ _id: new ObjectId(courseId) }, { $set: courseData });
    return {
      message: "Course updated successfully",
      courseId: result,
    }
  } catch (error) {
    set.status = 500;
    console.log(error)
    return { error: "Failed to update course" };
  }
}

export const getAllCourses = async (ctx: Context<{ query: GetCoursesInput }>) => {
  const { set, query } = ctx;

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = query.search?.trim() || '';
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
  const gradeId = query.grade;
  const boardId = query.board;

  try {
    const courseCollection = await getCollection(COURSE_COLLECTION);
    const pipeline: any[] = [];

    const filter: any = {
      isDeleted: false,
      isActive: true,
    };

    if (gradeId) {
      filter.grade = new ObjectId(gradeId);
    }

    if (boardId) {
      filter.board = new ObjectId(boardId);
    }

    pipeline.push({ $match: filter });

    pipeline.push({
      $lookup: {
        from: STAFFS_COLLECTION,
        localField: 'mentor',
        foreignField: '_id',
        as: 'mentor',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$mentor',
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push({
      $lookup: {
        from: GRADE_COLLECTION,
        localField: 'grade',
        foreignField: '_id',
        as: 'grade',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$grade',
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push({
      $lookup: {
        from: BOARD_COLLECTION,
        localField: 'board',
        foreignField: '_id',
        as: 'board',
      },
    });

    pipeline.push({
      $unwind: {
        path: '$board',
        preserveNullAndEmptyArrays: true,
      },
    });

    pipeline.push({
      $lookup: {
        from: CHAPTERS_COLLECTION,
        let: { courseId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$courseId', '$$courseId'] },
                  { $eq: ['$isActive', true] },
                  { $eq: ['$isDeleted', false] },
                ],
              },
            },
          },
        ],
        as: 'chapters',
      },
    });

    pipeline.push({
      $lookup: {
        from: LESSONS_COLLECTION,
        let: { courseId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ['$courseId', '$$courseId'] },
                  { $eq: ['$isActive', true] },
                  { $eq: ['$isDeleted', false] },
                ],
              },
            },
          },
        ],
        as: 'lessons',
      },
    });

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { courseName: { $regex: search, $options: 'i' } },
            { 'mentor.staffName': { $regex: search, $options: 'i' } },
            { 'grade.grade': { $regex: search, $options: 'i' } },
            { 'board.boardName': { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        metaData: [{ $count: 'total' }],
        data: [
          { $sort: { [sortBy]: sortOrder } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              courseName: 1,
              strikePrice: 1,
              actualPrice: 1,
              bannerImage: 1,
              createdAt: 1,
              chapterCount: { $size: '$chapters' },
              lessonCount: { $size: '$lessons' },
              courseDurationMinutes: 1,
              mentor: {
                id: '$mentor._id',
                staffName: '$mentor.staffName',
                phoneNumber: '$mentor.phoneNumber',
                role: '$mentor.role',
                image: '$mentor.image',
              },
              grade: {
                id: '$grade._id',
                name: '$grade.grade',
              },
              board: {
                id: '$board._id',
                name: '$board.boardName',
              },
            },
          },
        ],
      },
    });

    const [result] = await courseCollection.aggregate(pipeline).toArray();

    const total = result?.metaData[0]?.total || 0;
    const courses = result?.data || [];

    return {
      courses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPrevPage: page > 1,
      },
      meta: {
        sortBy,
        sortOrder,
        search: search || undefined,
      },
      message: "Courses retrieved successfully",
    };
  } catch (error) {
    console.error(error);
    set.status = 500;
    return { error: "Failed to retrieve courses" };
  }
}

export const getCourseById = async (ctx: Context<{ params: { courseId: string } }>) => {
  const { params, set } = ctx;
  const { courseId } = params;
  try {
    const courseCollection = await getCollection(COURSE_COLLECTION);
    const pipline: any[] = [];

    pipline.push({
      $match: { _id: new ObjectId(courseId), isDeleted: false, isActive: true }
    });

    pipline.push({
      $lookup: {
        from: STAFFS_COLLECTION,
        localField: 'mentor',
        foreignField: '_id',
        as: 'mentor'
      },
    });
    pipline.push({ $unwind: { path: '$mentor', preserveNullAndEmptyArrays: true } });

    const course = await courseCollection.aggregate(pipline).toArray();


    if (!course) {
      set.status = 404;
      return { error: "Course not found" };
    }
    return {
      course,
      message: "Course retrieved successfully",
    };
  } catch (error) {
    console.log(error);
    set.status = 500;
    return { error: "Failed to retrieve course" };
  }
}

export const getAllCourseNames = async (ctx: Context<{ query: CourseNamesQuery }>) => {
  const { set, query } = ctx;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  const skip = (page - 1) * limit;
  const search = query.search?.trim() || '';

  try {
    const courseCollection = await getCollection(COURSE_COLLECTION);

    const filter: any = { isDeleted: false, isActive: true };
    //  const filter: any = {};
    if (search) {
      filter.courseName = { $regex: search, $options: 'i' };
    }

    const [result] = await courseCollection
      .aggregate([
        { $match: filter },
        {
          $facet: {
            metadata: [{ $count: 'total' }],
            data: [
              { $sort: { courseName: 1 } },
              { $skip: skip },
              { $limit: limit },
              {
                $project: {
                  _id: 1,
                  courseName: 1,
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const total = result.metadata[0]?.total || 0;
    const courses = result.data || [];

    set.status = 200;
    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
      meta: {
        search: search || null,
      },
      message: 'Course names retrieved successfully',
    };
  } catch (error) {
    console.error('Error in getAllCourseNames:', error);
    set.status = 500;
    return {
      courses: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      message: 'Failed to retrieve course names',
    };
  }
};

export const deleteCourseById = async (ctx: Context<{ params: { courseId: string } }>) => {
  const { params, set } = ctx;
  const { courseId } = params;
  try {
    const courseCollection = await getCollection(COURSE_COLLECTION);
    const result = await courseCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { $set: { isDeleted: true } }
    );
    if (result.modifiedCount === 0) {
      set.status = 404;
      return { error: "Course not found" };
    }
    return {
      message: "Course deleted successfully",
    };
  } catch (error) {
    console.log(error);
    set.status = 500;
    return { error: "Failed to delete course" };
  }
}

export const toggeleCourseStatusById = async (ctx: Context<{ params: { courseId: string } }>) => {
  const { params, set } = ctx;
  const { courseId } = params;
  try {
    const courseCollection = await getCollection(COURSE_COLLECTION);
    const course = await courseCollection.findOne({ _id: new ObjectId(courseId) });
    if (!course) {
      set.status = 404;
      return { error: "Course not found" };
    }
    const newStatus = !course.isActive;
    const result = await courseCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { $set: { isActive: newStatus } }
    );
    if (result.modifiedCount === 0) {
      set.status = 500;
      return { error: "Failed to update course status" };
    }
    return {
      message: `Course has been ${newStatus ? 'activated' : 'deactivated'} successfully`,
    };
  } catch (error) {
    console.log(error);
    set.status = 500;
    return { error: "Failed to deactivate course" };
  }
}