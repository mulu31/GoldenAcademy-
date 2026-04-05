import { param, query } from "express-validator";
import { validatePagination } from "./common.validation.js";

export const listAuditLogs = [
  ...validatePagination,
  query("userId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Valid user ID is required"),
  query("action")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Action is required"),
  query("resourceType")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Resource type is required"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO date"),
];

export const getAuditLog = [
  param("id").isInt({ min: 1 }).withMessage("Valid audit log ID is required"),
];

export const getUserAuditLogs = [
  ...validatePagination,
  param("userId").isInt({ min: 1 }).withMessage("Valid user ID is required"),
  query("action")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Action is required"),
  query("resourceType")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Resource type is required"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO date"),
];

export const getActionAuditLogs = [
  ...validatePagination,
  param("action")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Action is required"),
  query("userId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Valid user ID is required"),
  query("resourceType")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Resource type is required"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO date"),
];

export const getResourceTypeAuditLogs = [
  ...validatePagination,
  param("resourceType")
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Resource type is required"),
  query("userId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Valid user ID is required"),
  query("action")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Action is required"),
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO date"),
];

export const getDateRangeAuditLogs = [
  ...validatePagination,
  query("startDate")
    .isISO8601()
    .withMessage("Start date must be a valid ISO date"),
  query("endDate").isISO8601().withMessage("End date must be a valid ISO date"),
  query("userId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Valid user ID is required"),
  query("action")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Action is required"),
  query("resourceType")
    .optional()
    .isString()
    .trim()
    .notEmpty()
    .withMessage("Resource type is required"),
];

export const exportAuditLogs = [
  ...listAuditLogs,
  query("limit")
    .optional()
    .isInt({ min: 1, max: 5000 })
    .withMessage("Limit must be between 1 and 5000"),
];
