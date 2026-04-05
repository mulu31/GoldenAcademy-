import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validateRequest } from "../middlewares/validate.middleware.js";
import { register, login } from "../validations/auth.validation.js";

const router = Router();

// Route pattern: validation → controller
router.post(
  "/register",
  register,
  validateRequest,
  authController.register,
);

router.post(
  "/login",
  login,
  validateRequest,
  authController.login,
);

export default router;
