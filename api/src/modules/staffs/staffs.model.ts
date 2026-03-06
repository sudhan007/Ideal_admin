import { t } from "elysia";
import { baseFields } from "../../lib/models/base-model.config";


const staffBase = t.Object({
  staffName: t.String({ default: "John Doe" }),
  phoneNumber: t.String({ default: "1234567890", pattern: "^[0-9]{10}$" }),
  role: t.String({ default: 'staff' }),
  isActive: t.Boolean({ default: true }),
  ...baseFields.properties,
});


const staffCreateModel = t.Object({
  ...staffBase.properties,
  image: t.Optional(t.File({
    type: "image/*",
  }),)
});

const staffUpdateModel = t.Object({
  ...staffBase.properties,
  image: t.Union([
    t.File({ type: "image/*" }),
    t.String({ description: "URL of the  image" }),
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
  },
  contentTypes: ["multipart/form-data"]
};

export const staffUpdateSchema = {
  body: staffUpdateModel,
  detail: {
    summary: "Update a staff",
    description: "Partially update staff details. image can be a new file or a URL.",
  },
  contentTypes: ["multipart/form-data"]
};

export const getStaffsSchema = {
  query: t.Object({
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
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
  },
};

export const getStaffsDropdownSchema = {
  query: t.Object({
    search: t.Optional(t.String({ minLength: 1 })),
    page: t.Optional(t.String()),
    limit: t.Optional(t.String()),
  }),
  detail: {
    summary: 'Get staff list for dropdown with search & pagination',
    description: 'Perfect for autocomplete, select boxes, typeahead. Returns only _id and staffName.',
  },
};

export const staffDeleteSchema = {
  detail: {
    summary: "Delete a staff",
    description: "Delete a staff by its ID",
  }
};

export const staffStatusToggleSchema = {
  detail: {
    summary: "Toggle staff block status",
    description: "Block or unblock a staff by its ID",
  }
};

export type StaffCreateInput = typeof staffCreateSchema.body.static;
export type StaffUpdateInput = typeof staffUpdateSchema.body.static;
export type GetStaffsQuery = typeof getStaffsSchema.query.static;
export type GetStaffsDropdownQuery = typeof getStaffsDropdownSchema.query.static;