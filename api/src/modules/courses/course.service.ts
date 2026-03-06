import { type Context } from "elysia";
import { CourseCreateInput, CourseNamesQuery, CourseUpdateInput, GetCoursesInput } from "./course.model";
import { getCollection } from "@lib/config/db.config";
import { uploadFileToS3 } from "@lib/utils/s3";
import { ObjectId } from "mongodb";
import { StoreType } from "@types";
import { BOARD_COLLECTION, CHAPTERS_COLLECTION, COURSE_COLLECTION, COURSE_ENROLLMENT_COLLECTION, DEMO_COURSE_COLLECTION, GRADE_COLLECTION, LESSONS_COLLECTION, STAFFS_COLLECTION } from "@lib/Db_collections";


export const createCourse = async (ctx: Context<{ body: CourseCreateInput }>) => {
  const { body, set } = ctx;
  const { courseName, mentor, strikePrice, actualPrice, bannerImage, board, grade, isTrending = false, } = body
  try {
    const courseCollection = await getCollection(COURSE_COLLECTION);
    const staffCollection = await getCollection(STAFFS_COLLECTION);
    const boardCollection = await getCollection(BOARD_COLLECTION);
    const gradeCollection = await getCollection(GRADE_COLLECTION);

    const existingCourse = await courseCollection.findOne({
      courseName: { $regex: `^${courseName}$`, $options: "i" },
      isDeleted: false,
    });

    if (existingCourse) {
      set.status = 400;
      return {
        status: false,
        error: "Course name already exists",
      };
    }
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
      isTrending: !!isTrending,
      createdAt: new Date(),
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
    console.log("Course Created Error", error)
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
      set.status = 404;
      return { error: "Course not found" };
    }

    const {
      courseName, mentor, strikePrice, actualPrice,
      bannerImage, board, grade, isTrending,
    } = body;

    if (courseName) {
      const duplicateCourse = await courseCollection.findOne({
        _id: { $ne: new ObjectId(courseId) },
        courseName: { $regex: `^${courseName}$`, $options: "i" },
        isDeleted: false,
      });

      if (duplicateCourse) {
        set.status = 400;
        return {
          status: false,
          error: "Course name already exists",
        };
      }
    }


    let bannerUrl = course.bannerImage;

    if (bannerImage instanceof File) {
      const { fullUrl, fileKey } = await uploadFileToS3(bannerImage, "courses");
      bannerUrl = fullUrl ?? fileKey;
    }

    const updateData: any = {
      courseName,
      mentor: mentor ? new ObjectId(mentor) : null,
      strikePrice: Number(strikePrice),
      actualPrice: Number(actualPrice),
      board: board ? new ObjectId(board) : null,
      grade: grade ? new ObjectId(grade) : null,
      bannerImage: bannerUrl,
      updatedAt: new Date(),
    };

    if (isTrending !== undefined) {
      updateData.isTrending = !!isTrending;
    }

    const result = await courseCollection.updateOne(
      { _id: new ObjectId(courseId) },
      { $set: updateData }
    );

    set.status = 200;
    return {
      message: "Course updated successfully",
      courseId,
    };
  } catch (error) {
    console.error("Course Updated Errror", error);
    set.status = 500;
    return { error: "Failed to update course" };
  }
};
export const getAllCourses = async (ctx: Context<{ query: GetCoursesInput }>) => {
  const { set, query, store } = ctx;
  const { role, id } = store as StoreType;
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = query.search?.trim() || '';
  const sortBy = query.sortBy || 'createdAt';
  const sortOrder = query.sortOrder === 'desc' ? -1 : 1;
  const gradeId = query.grade;
  const boardId = query.board;
  const trendingOnly = query.trending === 'true';   // ← NEW
  try {
    const courseCollection = await getCollection(COURSE_COLLECTION);

    const pipeline: any[] = [];

    const filter: any = {
      isDeleted: false,
      isActive: true,
    };

    if (trendingOnly) {
      filter.isTrending = true;                      // ← NEW FILTER
    }

    if (gradeId) filter.grade = new ObjectId(gradeId);
    if (boardId) filter.board = new ObjectId(boardId);

    pipeline.push({ $match: filter });

    // ── Basic lookups (mentor, grade, board) ───────────────────────────────
    pipeline.push({
      $lookup: {
        from: STAFFS_COLLECTION,
        localField: 'mentor',
        foreignField: '_id',
        as: 'mentor',
      },
    });
    pipeline.push({ $unwind: { path: '$mentor', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: {
        from: GRADE_COLLECTION,
        localField: 'grade',
        foreignField: '_id',
        as: 'grade',
      },
    });
    pipeline.push({ $unwind: { path: '$grade', preserveNullAndEmptyArrays: true } });

    pipeline.push({
      $lookup: {
        from: BOARD_COLLECTION,
        localField: 'board',
        foreignField: '_id',
        as: 'board',
      },
    });
    pipeline.push({ $unwind: { path: '$board', preserveNullAndEmptyArrays: true } });

    // Chapters & Lessons count
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



    pipeline.push({
      $lookup: {
        from: DEMO_COURSE_COLLECTION,
        localField: "_id",
        foreignField: "courseId",
        as: "demo",
      },
    });

    pipeline.push({
      $addFields: {
        demoVideo: { $arrayElemAt: ["$demo", 0] },
      },
    });

    pipeline.push({
      $addFields: {
        demoVideoUrl: "$demoVideo.videoUrl",
        demoId: "$demoVideo._id",
      },
    });

    pipeline.push({
      $unset: "demo",
    });

    // ── IMPORTANT: Add isEnrolled field only for STUDENTS ──────────────────
    if (role === 'STUDENT' && id) {
      pipeline.push({
        $lookup: {
          from: COURSE_ENROLLMENT_COLLECTION,
          let: { courseId: '$_id', studentId: new ObjectId(id) },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$courseId', '$$courseId'] },
                    { $eq: ['$studentId', '$$studentId'] },
                    // { $eq: ['$status', 'active'] },
                  ],
                },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
          ],
          as: 'enrollment',
        },
      });


      pipeline.push({
        $addFields: {
          isEnrolled: { $gt: [{ $size: '$enrollment' }, 0] },
          enrollmentId: {
            $cond: [
              { $gt: [{ $size: '$enrollment' }, 0] },
              { $arrayElemAt: ['$enrollment._id', 0] },
              null,
            ],
          },
        },
      });

      pipeline.push({
        $unset: 'enrollment',
      });
    }

    // Search (after lookups so we can search joined fields)
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

    // Final facet + pagination + projection
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
              isActive: 1,
              chapterCount: { $size: '$chapters' },
              lessonCount: { $size: '$lessons' },
              courseDurationMinutes: 1,
              isTrending: 1,
              demoVideoUrl: 1,
              demoId: 1,
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
              ...(role === 'STUDENT' && {
                isEnrolled: 1,
                enrollmentId: 1,
              }),
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

      message: "Courses retrieved successfully",
    };
  } catch (error) {
    console.error("Course Retrived Error", error);
    set.status = 500;
    return { error: "Failed to retrieve courses" };
  }
};
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
    console.log("Course Retrived Error", error);
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
    console.log("Course Deleted Error", error);
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
    console.log("Course Deactivated Error", error);
    set.status = 500;
    return { error: "Failed to deactivate course" };
  }
}
export const toggleTrendingCourse = async (ctx: Context<{ params: { courseId: string } }>) => {
  const { params, set } = ctx;
  const { courseId } = params;

  try {
    const courseCollection = await getCollection(COURSE_COLLECTION);

    const course = await courseCollection.findOne({
      _id: new ObjectId(courseId),
      isDeleted: false,
    });

    if (!course) {
      set.status = 404;
      return { error: "Course not found" };
    }

    const newTrendingStatus = !course.isTrending;

    await courseCollection.updateOne(
      { _id: new ObjectId(courseId) },
      {
        $set: {
          isTrending: newTrendingStatus,
          updatedAt: new Date(),
        },
      }
    );

    set.status = 200;
    return {
      message: `Course trending status updated to ${newTrendingStatus}`,
      isTrending: newTrendingStatus,
      courseId,
    };
  } catch (error) {
    console.error("Course Toggle Trending Error", error);
    set.status = 500;
    return { error: "Failed to toggle trending status" };
  }
};