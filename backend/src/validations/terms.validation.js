import { body, param } from 'express-validator';

export const createTerm = [
  body('academicYear')
    .trim()
    .notEmpty()
    .withMessage('Academic year is required')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)'),
  body('semester')
    .trim()
    .notEmpty()
    .withMessage('Semester is required')
    .isIn(['S1', 'S2'])
    .withMessage('Semester must be S1 or S2')
];

export const updateTerm = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid term ID is required'),
  body('academicYear')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Academic year cannot be empty')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2023-2024)'),
  body('semester')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Semester cannot be empty')
    .isIn(['S1', 'S2'])
    .withMessage('Semester must be S1 or S2')
];

export const getTermById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid term ID is required')
];

export const deleteTerm = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid term ID is required')
];
