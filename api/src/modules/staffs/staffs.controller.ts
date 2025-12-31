import { Elysia } from "elysia";
import { createStaff, deleteStaff, getAllStaffs, getAllStaffsForDropdown, toggleStaffBlockStatus, updateStaff } from "./staffs.service";
import { getStaffsDropdownSchema, getStaffsSchema, staffCreateSchema, staffDeleteSchema, staffStatusToggleSchema, staffUpdateSchema } from "./staffs.model";

export const staffsController = new Elysia({
    prefix: "/staffs",
})
.post('/', createStaff, staffCreateSchema)
.put('/:staffId', updateStaff, staffUpdateSchema)
.get('/', getAllStaffs, getStaffsSchema)
.get('/names', getAllStaffsForDropdown, getStaffsDropdownSchema)
.patch('/:staffId', toggleStaffBlockStatus, staffStatusToggleSchema)
.delete('/:staffId', deleteStaff, staffDeleteSchema);