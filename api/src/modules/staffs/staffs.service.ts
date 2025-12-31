import { type Context } from "elysia";
import { getCollection } from "@lib/config/db.config";
import { GetStaffsDropdownQuery, GetStaffsQuery, STAFFS_COLLECTION, StaffUpdateInput, type StaffCreateInput } from "./staffs.model";
import { uploadFileToS3 } from "@lib/utils/s3";
import { ObjectId } from "mongodb";


export const createStaff = async (ctx: Context<{ body: StaffCreateInput }>) => {
  const { body, set } = ctx;
  const { staffName, phoneNumber, role, image } = body

  try {
    const staffsCollection = await getCollection(STAFFS_COLLECTION);
    const { fullUrl, fileKey } = await uploadFileToS3(image, "staffs");
    const staffData = {
      staffName,
      phoneNumber,
      role,
      // permissions,
      image: fullUrl ?? fileKey,
      createdAt: new Date(),
    };
    const result = await staffsCollection.insertOne(staffData);
    set.status = 201;
    return {
      message: "Staff created successfully",
      staffId: result.insertedId,
    }
  } catch (error) {
    console.log(error)
    set.status = 500;
    return { error: "Failed to create staff" };
  }
}

export const updateStaff = async (ctx: Context<{ params: { staffId: string }, body: StaffUpdateInput }>) => {
  const { params, body } = ctx;

  try {
    const { staffId } = params;
    const { staffName, phoneNumber, role, image } = body;

    const staffsCollection = await getCollection(STAFFS_COLLECTION);

    const staff = await staffsCollection.findOne({ _id: new ObjectId(staffId), isDeleted: false });

    if (!staff) {
      return { error: "Staff not found" };
    }

    let url = staff.image;
    if (image instanceof File) {
      const { fullUrl, fileKey } = await uploadFileToS3(image, "staffs");
      url = fullUrl ?? fileKey;
    }

    await staffsCollection.updateOne(
      { _id: new ObjectId(staffId) },
      {
        $set: {
          staffName,
          phoneNumber,
          role,
          // permissions,
          image: url,
        },
      }
    );

    return {
      message: "Staff updated successfully",
    };
  } catch (error) {
    console.log(error)
  }
}

export const getAllStaffs = async (ctx: Context<{ query: GetStaffsQuery }>) => {
  const { set, query } = ctx;

  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 15));
  const skip = (page - 1) * limit;
  const search = query.search?.trim() || '';

  const sortFieldMap: Record<string, string> = {
    staffName: 'staffName',
    phoneNumber: 'phoneNumber',
    role: 'role',
    createdAt: 'createdAt',
  };
  const sortBy = sortFieldMap[query.sortBy || ''] || 'createdAt';
  const sortOrder = query.sortOrder === 'desc' ? -1 : 1;

  try {
    const staffsCollection = await getCollection(STAFFS_COLLECTION);

    const pipeline: any[] = [
      { $match: { isDeleted: false } }
    ];

    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { staffName: { $regex: search, $options: 'i' } },
            { phoneNumber: { $regex: search, $options: 'i' } },
            { role: { $regex: search, $options: 'i' } },
          ],
        },
      });
    }

    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { [sortBy]: sortOrder } },
          { $skip: skip },
          { $limit: limit },
          {
            $project: {
              _id: 1,
              staffName: 1,
              phoneNumber: 1,
              role: 1,
              image: 1,
              createdAt: 1,
            },
          },
        ],
      },
    });

    const [result] = await staffsCollection.aggregate(pipeline).toArray();

    const total = result.metadata[0]?.total || 0;
    const staffs = result.data || [];

    set.status = 200;
    return {
      staffs,
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
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'asc',
      },
      message: 'Staffs retrieved successfully',
    };
  } catch (error) {
    console.error('Error in getAllStaffs:', error);
    set.status = 500;
    return {
      error: 'Failed to fetch staffs',
      staffs: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    };
  }
};

export const getAllStaffsForDropdown = async (ctx: Context<{ query: GetStaffsDropdownQuery }>) => {
  const { query, set } = ctx;

  const search = query.search?.trim() || '';
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20)); // default 20 for dropdowns
  const skip = (page - 1) * limit;

  try {
    const staffsCollection = await getCollection(STAFFS_COLLECTION);

    const filter: any = { isDeleted: false };
    if (search) {
      filter.staffName = { $regex: search, $options: 'i' };
    }

    const pipeline = [
      { $match: filter },
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          data: [
            { $sort: { staffName: 1 } },
            { $skip: skip },
            { $limit: limit },
            {
              $project: {
                _id: 1,
                staffName: 1,
              },
            },
          ],
        },
      },
    ];

    const [result] = await staffsCollection.aggregate(pipeline).toArray();

    const total = result.metadata[0]?.total || 0;
    const staffs = result.data || [];

    return {
      staffs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < total,
        hasPrevPage: page > 1,
      },
      meta: {
        search: search || null,
      },
      message: 'Staffs for dropdown retrieved successfully',
    };
  } catch (error) {
    console.error('Error in getAllStaffsForDropdown:', error);
    set.status = 500;
    return {
      staffs: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
      error: 'Failed to fetch staffs for dropdown',
    };
  }
};

export const deleteStaff = async (ctx: Context<{ params: { staffId: string } }>) => {
  const { params, set } = ctx;
  const { staffId } = params;
  try {
    const staffsCollection = await getCollection(STAFFS_COLLECTION);
    const result = await staffsCollection.updateOne(
      { _id: new ObjectId(staffId) },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );
    if (result.modifiedCount === 1) {
      set.status = 200;
      return { message: "Staff deleted successfully" };
    } else {
      set.status = 404;
      return { error: "Staff not found" };
    }
  } catch (error) {
    console.error("Error deleting staff:", error);
    set.status = 500;
    return { error: "Failed to delete staff" };
  }
}

export const toggleStaffBlockStatus = async (ctx: Context<{ params: { staffId: string } }>) => {
  const { params, set } = ctx;
  const { staffId } = params;
  try {
    const staffsCollection = await getCollection(STAFFS_COLLECTION);
    const staff = await staffsCollection.findOne({ _id: new ObjectId(staffId), isDeleted: false });
    if (!staff) {
      set.status = 404;
      return { error: "Staff not found" };
    }

    const newBlockStatus = !staff.isBlocked;
    const result = await staffsCollection.updateOne(
      { _id: new ObjectId(staffId) },
      { $set: { isBlocked: newBlockStatus } }
    );

    if (result.modifiedCount === 1) {
      set.status = 200;
      return { message: `Staff has been ${newBlockStatus ? 'blocked' : 'unblocked'} successfully` };
    } else {
      set.status = 500;
      return { error: "Failed to update staff block status" };
    }
  } catch (error) {
    console.error("Error toggling staff block status:", error);
    set.status = 500;
    return { error: "Failed to toggle staff block status" };
  }
}