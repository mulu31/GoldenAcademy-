import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";
import { enrollmentsService } from "../services/enrollments.service.js";

export const enrollmentsController = {
  list: catchAsync(async (req, res) => {
    const { classId, termId, page, limit } = req.query;
    const data = await enrollmentsService.list({ classId, termId, page, limit });
    return sendResponse(res, 200, "Enrollments fetched", data);
  }),
  
  enrollStudent: catchAsync(async (req, res) => {
    const data = await enrollmentsService.enrollStudent(req.body);
    return sendResponse(res, 201, "Student enrolled", data);
  }),
  
  getEnrollmentHistory: catchAsync(async (req, res) => {
    const { studentId } = req.params;
    const data = await enrollmentsService.getEnrollmentHistory(studentId);
    return sendResponse(res, 200, "Enrollment history fetched", data);
  }),
  
  promoteStudents: catchAsync(async (req, res) => {
    const data = await enrollmentsService.promoteStudents(req.body);
    return sendResponse(res, 200, "Students promoted", data);
  }),
};
