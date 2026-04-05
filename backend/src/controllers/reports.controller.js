import { catchAsync } from "../utils/catchAsync.js";
import { sendResponse } from "../utils/response.js";
import { reportsService } from "../services/reports.service.js";

export const reportsController = {
  getClassReport: catchAsync(async (req, res) => {
    const data = await reportsService.getClassReport(req.params.classId, req.user);
    return sendResponse(res, 200, "Class report fetched", data);
  }),

  getDepartmentReport: catchAsync(async (req, res) => {
    const data = await reportsService.getDepartmentReport(req.params.departmentId);
    return sendResponse(res, 200, "Department report fetched", data);
  }),

  getMarkCompletionStatus: catchAsync(async (req, res) => {
    const data = await reportsService.getMarkCompletionStatus(req.params.classId);
    return sendResponse(res, 200, "Mark completion status fetched", data);
  })
};
