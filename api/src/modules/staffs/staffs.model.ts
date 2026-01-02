import { t } from "elysia";
import { baseFields } from "../../lib/models/base-model.config";


export const STAFFS_COLLECTION = "staffs";


const staffBase = t.Object({
  staffName: t.String({ default: "John Doe" }),
  phoneNumber: t.String({ default: "1234567890", pattern: "^[0-9]{10}$" }),
  role: t.String({ default: 'staff' }),
  isActive: t.Boolean({ default: true }),
  ...baseFields.properties,
  // permissions: t.Array(t.Object({ moduleName: t.String(), actions: t.Array(t.String()) }), { default: [] }),
});


const staffCreateModel = t.Object({
  ...staffBase.properties,
  image: t.File({
    type: "image/*",
  }),
});

const staffUpdateModel = t.Object({
  ...staffBase.properties,
  image: t.Union([
    t.File({ type: "image/*" }),
    t.String({ format: "uri", description: "URL of the  image" }),
  ], {
    description: "Either upload a new  image or provide a URL"
  }),
}, {
  additionalProperties: false
});


export const staffCreateSchema = {
  body: staffCreateModel,
  detail: {
    summary: "Create a new staff",
    description: "Requires uploading a profile image",
    tags: ["Staffs"],
  },
  contentTypes: ["multipart/form-data"]
};

export const staffUpdateSchema = {
  body: staffUpdateModel,
  detail: {
    summary: "Update a staff",
    description: "Partially update staff details. image can be a new file or a URL.",
    tags: ["Staffs"],
  },
  contentTypes: ["multipart/form-data"]
};

export const getStaffsSchema = {
  query: t.Object({
    page: t.Optional(t.Number({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 15 })),
    search: t.Optional(t.String()),
    sortBy: t.Optional(
      t.Union([
        t.Literal('staffName'),
        t.Literal('phoneNumber'),
        t.Literal('role'),
        t.Literal('createdAt'),
      ], { default: 'createdAt' })
    ),
    sortOrder: t.Optional(
      t.Union([t.Literal('asc'), t.Literal('desc')], { default: 'asc' })
    ),
  }),
  detail: {
    summary: 'Get all staff members',
    description: 'Retrieve paginated list of staff with search and sorting',
    tags: ['Staffs'],
  },
};

export const getStaffsDropdownSchema = {
  query: t.Object({
    search: t.Optional(t.String({ minLength: 1 })),
    page: t.Optional(t.Number({ minimum: 1, default: 1 })),
    limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  }),
  detail: {
    summary: 'Get staff list for dropdown with search & pagination',
    description: 'Perfect for autocomplete, select boxes, typeahead. Returns only _id and staffName.',
    tags: ['Staffs'],
  },
};

export const staffDeleteSchema = {
  detail: {
    summary: "Delete a staff",
    description: "Delete a staff by its ID",
    tags: ["Staffs"],
  }
};

export const staffStatusToggleSchema = {
  detail: {
    summary: "Toggle staff block status",
    description: "Block or unblock a staff by its ID",
    tags: ["Staffs"],
  }
};

export type StaffCreateInput = typeof staffCreateSchema.body.static;
export type StaffUpdateInput = typeof staffUpdateSchema.body.static;
export type GetStaffsQuery = typeof getStaffsSchema.query.static;
export type GetStaffsDropdownQuery = typeof getStaffsDropdownSchema.query.static;