import { teachersService } from "../services/teachers.service.js";
import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse as successResponse } from "../utils/response.js";

export const teachersController = {
  list: catchAsync(async (req, res) => {
    const { departmentId } = req.query;
    
    // If user is DEPARTMENT_ADMIN, filter by their department
    const filters = {};
    if (req.user.roles.includes('DEPARTMENT_ADMIN')) {
      filters.departmentId = req.user.departmentId;
    } else if (departmentId) {
      filters.departmentId = departmentId;
    }
    
    const teachers = await teachersService.list(filters);
    successResponse(res, teachers, 'Teachers retrieved successfully');
  }),

  getById: catchAsync(async (req, res) => {
    const teacher = await teachersService.getById(req.params.id);
    successResponse(res, teacher, 'Teacher retrieved successfully');
  }),

  create: catchAsync(async (req, res) => {
    const teacher = await teachersService.create(req.body);
    successResponse(res, teacher, 'Teacher created successfully', 201);
  }),

  update: catchAsync(async (req, res) => {
    const teacher = await teachersService.update(req.params.id, req.body);
    successResponse(res, teacher, 'Teacher updated successfully');
  }),

  remove: catchAsync(async (req, res) => {
    await teachersService.remove(req.params.id);
    successResponse(res, null, 'Teacher deleted successfully');
  }),

  assignToSubject: catchAsync(async (req, res) => {
    const { id } = req.params;
    const { classSubjectId } = req.body;
    
    const assignment = await teachersService.assignToSubject(
      id,
      classSubjectId,
      req.user
    );
    
    successResponse(res, assignment, 'Teacher assigned to subject successfully', 201);
  }),

  removeFromSubject: catchAsync(async (req, res) => {
    const { id, classSubjectId } = req.params;
    
    await teachersService.removeFromSubject(id, classSubjectId);
    successResponse(res, null, 'Teacher removed from subject successfully');
  }),

  getAssignments: catchAsync(async (req, res) => {
    const { id } = req.params;
    const assignments = await teachersService.getAssignments(id);
    successResponse(res, assignments, 'Teacher assignments retrieved successfully');
  }),

  getHomeroomClass: catchAsync(async (req, res) => {
    const { id } = req.params;
    const homeroomClass = await teachersService.getHomeroomClass(id);
    successResponse(res, homeroomClass, 'Homeroom class retrieved successfully');
  })
};
