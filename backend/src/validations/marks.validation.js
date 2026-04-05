import { body, param, query } from 'express-validator';

export const submitMarks = [
  body('enrollmentId')
    .isInt({ min: 1 })
    .withMessage('Valid enrollment ID is required'),
  body('subjectId')
    .isInt({ min: 1 })
    .withMessage('Valid subject ID is required'),
  body('markObtained')
    .isInt({ min: 0, max: 100 })
    .withMessage('Mark must be between 0 and 100'),
  body('teacherId')
    .isInt({ min: 1 })
    .withMessage('Valid teacher ID is required')
];

export const getClassMarks = [
  param('classId')
    .isInt({ min: 1 })
    .withMessage('Valid class ID is required'),
  query('termId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid term ID is required')
];

export const getStudentMarks = [
  param('studentId')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
  query('termId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid term ID is required')
];

export const getMarkById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid mark ID is required')
];

export const updateMark = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid mark ID is required'),
  body('markObtained')
    .isInt({ min: 0, max: 100 })
    .withMessage('Mark must be between 0 and 100'),
  body('teacherId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid teacher ID is required')
];
