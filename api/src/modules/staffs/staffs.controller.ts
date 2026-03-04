import { Elysia } from "elysia";
import { createStaff, deleteStaff, getAllStaffs, getAllStaffsForDropdown, toggleStaffBlockStatus, updateStaff } from "./staffs.service";
import { getStaffsDropdownSchema, getStaffsSchema, staffCreateSchema, staffDeleteSchema, staffStatusToggleSchema, staffUpdateSchema } from "./staffs.model";
import { adminOnly } from "@lib/utils/roles-guard";

export const staffsController = new Elysia({
    prefix: "/staffs",
    detail: {
        tags: ["Staffs"],
    }
})
    .post('/', createStaff, { ...staffCreateSchema, beforeHandle: adminOnly })
    .put('/:staffId', updateStaff, { ...staffUpdateSchema, beforeHandle: adminOnly })
    .get('/', getAllStaffs, { ...getStaffsSchema, beforeHandle: adminOnly })
    .get('/names', getAllStaffsForDropdown, { ...getStaffsDropdownSchema, beforeHandle: adminOnly })
    .patch('/toggle-status/:staffId', toggleStaffBlockStatus, { ...staffStatusToggleSchema, beforeHandle: adminOnly })
    .delete('/:staffId', deleteStaff, { ...staffDeleteSchema, beforeHandle: adminOnly });