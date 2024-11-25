import express from "express";
import checkAuth from "../utils/checkAuth.js";
import * as PersonController from "../controllers/PersonController.js";

export const PersonRouter = express.Router();

PersonRouter.post('/peoples', PersonController.getSome);
PersonRouter.get('/peoples/:id', checkAuth, PersonController.getOne);
PersonRouter.post('/peoples/new', checkAuth, PersonController.newPerson);
PersonRouter.get('/peoples/with/:name', checkAuth, PersonController.getSameNames);
PersonRouter.get('/peoples/with/:ident', checkAuth, PersonController.getSameIdent);
PersonRouter.patch('/peoples/editperson', checkAuth, PersonController.updatePersonOnly);
PersonRouter.patch('/peoples/edit', checkAuth, PersonController.updatePersonPlace);
PersonRouter.patch('/peoples/editnewplace', checkAuth, PersonController.updatePersonNewPlace);
PersonRouter.patch('/peoples/exit', checkAuth, PersonController.exitPerson);