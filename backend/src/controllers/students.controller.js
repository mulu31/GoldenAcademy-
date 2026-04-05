import { studentsService } from "../services/students.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse as successResponse } from "../utils/response.js";

export const studentsController = {
  list: catchAsync(async (req, res) => {
    const students = await studentsService.list();
    successResponse(res, students, 'Students retrieved successfully');
  }),

  getById: catchAsync(async (req, res) => {
    const student = await studentsService.getById(req.params.id);
    successResponse(res, student, 'Student retrieved successfully');
  }),

  create: catchAsync(async (req, res) => {
    const student = await studentsService.create(req.body);
    successResponse(res, student, 'Student created successfully', 201);
  }),

  update: catchAsync(async (req, res) => {
    const student = await studentsService.update(req.params.id, req.body);
    successResponse(res, student, 'Student updated successfully');
  }),

  remove: catchAsync(async (req, res) => {
    await studentsService.remove(req.params.id);
    successResponse(res, null, 'Student deleted successfully');
  }),

  search: catchAsync(async (req, res) => {
    const { search, page, limit } = req.query;
    const result = await studentsService.search(
      search,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50
    );
    successResponse(res, result, 'Students search completed successfully');
  })
};
