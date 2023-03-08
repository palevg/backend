import express from 'express';
import fs from 'fs';
import multer from 'multer';
import cors from 'cors';

import { registerValidation, loginValidation, postCreateValidation } from './validations.js';

import checkAuth from './utils/checkAuth.js';
import handleValidationErrors from './utils/handleValidationErrors.js';

import * as FirmaController from './controllers/FirmaController.js';
import * as PersonController from './controllers/PersonController.js';
import * as UserController from './controllers/UserController.js';

const app = express();

const storage = multer.diskStorage({
  destination: (_, __, cb) => {
    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads');
    }
    cb(null, 'uploads');
  },
  filename: (_, file, cb) => {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage });

app.use(express.json());
app.use(cors());
app.use('/uploads', express.static('uploads'));

app.post('/auth/login', loginValidation, handleValidationErrors, UserController.login);
// app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  res.json({
    url: `/uploads/${req.file.originalname}`,
  });
});

app.get('/enterprs', FirmaController.getAll);
app.get('/enterprs/:id', FirmaController.getOne);
app.get('/peoples/:id', PersonController.getOne);
// app.post('/enterprs', checkAuth, enterprCreateValidation, handleValidationErrors, FirmaController.create);
// app.delete('/enterprs/:id', checkAuth, FirmaController.remove);
// app.patch('/enterprs/:id', checkAuth, enterprCreateValidation, handleValidationErrors, FirmaController.update);

app.listen(process.env.PORT || 4444, (err) => {
  if (err) {
    return console.log(err);
  }

  console.log('Server OK');
});