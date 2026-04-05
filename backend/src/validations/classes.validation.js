import { body, param } from 'express-validator';

export const createClass = [
  body('className')
    .trim()
    .notEmpty()
    .withMessage('Class name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Class name must be between 1 and 100 characters'),
  body('grade')
    .trim()
    .notEmpty()
    .withMessage('Grade is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Grade must be between 1 and 50 characters'),
  body('termId')
    .isInt({ min: 1 })
    .withMessage('Valid term ID is required'),
  body('homeroomTeacherId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid homeroom teacher ID is required')
];

export const updateClass = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid class ID is required'),
  body('className')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Class name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Class name must be between 1 and 100 characters'),
  body('grade')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Grade cannot be empty')
    .isLength({ min: 1, max: 50 })
    .withMessage('Grade must be between 1 and 50 characters'),
  body('termId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid term ID is required'),
  body('homeroomTeacherId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Valid homeroom teacher ID is required')
];

export const publishResults = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid class ID is required')
];

export const getClassById = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid class ID is required')
];

export const deleteClass = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid class ID is required')
];
