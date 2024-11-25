import express from "express";
import checkAuth from "../utils/checkAuth.js";
import * as FirmaController from "../controllers/FirmaController.js";

export const EntRouter = express.Router();

EntRouter.post('/enterprs', FirmaController.getSome);
EntRouter.get('/enterprlist/:id', checkAuth, FirmaController.getEnterprNames);
EntRouter.get('/enterpr/:id', checkAuth, FirmaController.getOneShort);
EntRouter.get('/enterprs/:id', checkAuth, FirmaController.getOneFull);
EntRouter.get('/enterprs/with/:ident', checkAuth, FirmaController.getSameIdent);
EntRouter.post('/enterpr/new', checkAuth, FirmaController.newEnterpr);
EntRouter.patch('/enterpr/edit', checkAuth, FirmaController.updateEnterpr);
EntRouter.post('/enterprs/listafil', checkAuth, FirmaController.getAfilEnterprs);
EntRouter.get('/founders/:id', checkAuth, FirmaController.getFounders);
EntRouter.get('/foundersent/:id', checkAuth, FirmaController.getFoundersE);
EntRouter.get('/heads/:id', checkAuth, FirmaController.getHeads);
EntRouter.patch('/order/new', checkAuth, FirmaController.newOrder);
EntRouter.patch('/order/edit', checkAuth, FirmaController.updateOrder);
EntRouter.patch('/order/close', checkAuth, FirmaController.closeOrder);
EntRouter.get('/orders/:id', checkAuth, FirmaController.getOrders);
EntRouter.post('/license/new', checkAuth, FirmaController.newLicense);
EntRouter.get('/licenses/:id', checkAuth, FirmaController.getLicenses);
EntRouter.patch('/license/edit', checkAuth, FirmaController.updateLicense);
EntRouter.patch('/license/state', checkAuth, FirmaController.updateLicenseState);
EntRouter.get('/employees/:id', checkAuth, FirmaController.getEmployees);
EntRouter.get('/checks/:id', checkAuth, FirmaController.getChecks);
EntRouter.patch('/check/new', checkAuth, FirmaController.newCheck);
EntRouter.patch('/check/edit', checkAuth, FirmaController.updateCheck);
EntRouter.get('/regions', FirmaController.getRegions);
EntRouter.get('/opforms', FirmaController.getOPForms);
EntRouter.get('/formvlasn', FirmaController.getFormVlasn);
EntRouter.get('/activities', FirmaController.getActivities);
EntRouter.get('/lictypes', FirmaController.getLicTypes);

// app.post('/enterprs', checkAuth, enterprCreateValidation, handleValidationErrors, FirmaController.create);
// app.delete('/enterprs/:id', checkAuth, FirmaController.remove);
// app.patch('/enterprs/:id', checkAuth, enterprCreateValidation, handleValidationErrors, FirmaController.update);