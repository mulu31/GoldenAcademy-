import { body, param } from 'express-validator';

export const createTeacher = [
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid department ID is required'),
  body('fullName')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 1, max: 255 })
    .withMessage('Full name must be between 1 and 255 characters')
];

export const updateTeacher = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid teacher ID is required'),
  body('userId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid user ID is required'),
  body('departmentId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid department ID is required'),
  body('fullName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Full name cannot be empty')
    .isLength({ min: 1, max: 255 })
    .withMessage('Full name must be between 1 and 255 characters')
];

export const assignTeacherToSubject = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid teacher ID is required'),
  body('classSubjectId')
    .isInt({ min: 1 })
    .withMessage('Valid class subject ID is required')
];

export const getTeacherById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid teacher ID is required')
];

export const deleteTeacher = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid teacher ID is required')
];
