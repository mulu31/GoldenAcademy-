import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";
import { marksService } from "../services/marks.service.js";

export const marksController = {
  list: catchAsync(async (req, res) => {
    const data = await marksService.list(req.query);
    return sendResponse(res, 200, "Marks retrieved", data);
  }),

  getById: catchAsync(async (req, res) => {
    const data = await marksService.getById(req.params.id);
    return sendResponse(res, 200, "Mark retrieved", data);
  }),

  getByClassId: catchAsync(async (req, res) => {
    const data = await marksService.getByClassId(req.params.classId);
    return sendResponse(res, 200, "Class marks retrieved", data);
  }),

  getByStudentId: catchAsync(async (req, res) => {
    const data = await marksService.getByStudentId(req.params.studentId, req.query.termId);
    return sendResponse(res, 200, "Student marks retrieved", data);
  }),

  getByTeacherId: catchAsync(async (req, res) => {
    const data = await marksService.getByTeacherId(req.params.teacherId);
    return sendResponse(res, 200, "Teacher marks retrieved", data);
  }),

  submitMark: catchAsync(async (req, res) => {
    const data = await marksService.submitMark({
      teacherId: req.body.teacherId,
      enrollmentId: req.body.enrollmentId,
      subjectId: req.body.subjectId,
      markObtained: req.body.markObtained
    });
    return sendResponse(res, 201, "Mark submitted", data);
  }),

  updateMarkByTeacher: catchAsync(async (req, res) => {
    const data = await marksService.updateMarkByTeacher({
      markId: req.params.id,
      teacherId: req.body.teacherId,
      markObtained: req.body.markObtained,
    });
    return sendResponse(res, 200, "Mark updated", data);
  }),

  create: catchAsync(async (req, res) => {
    const data = await marksService.create(req.body);
    return sendResponse(res, 201, "Mark created", data);
  }),

  update: catchAsync(async (req, res) => {
    const data = await marksService.update(req.params.id, req.body);
    return sendResponse(res, 200, "Mark updated", data);
  }),

  remove: catchAsync(async (req, res) => {
    await marksService.remove(req.params.id);
    return sendResponse(res, 200, "Mark deleted", null);
  })
};
