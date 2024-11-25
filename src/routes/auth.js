import express from "express";
import { loginValidation } from "../utils/validations.js";
import handleValidationErrors from "../utils/handleValidationErrors.js";
import checkAuth from "../utils/checkAuth.js";
import * as UserController from "../controllers/UserController.js";

export const AuthRouter = express.Router();

AuthRouter.post('/auth/login', loginValidation, handleValidationErrors, UserController.login);
AuthRouter.post('/auth/logout', UserController.logout);
// app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);
AuthRouter.get('/auth/me', checkAuth, UserController.getMe);
AuthRouter.patch('/auth/profile', checkAuth, UserController.update);

AuthRouter.get('/sessions', checkAuth, UserController.getSessionsList);