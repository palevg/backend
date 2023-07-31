require('dotenv').config();
const express = require('express');
const fs = require('fs');
const multer = require('multer');
const cors = require('cors');

const { loginValidation } = require('./validations.js');
const checkAuth = require('./utils/checkAuth.js');
const handleValidationErrors = require('./utils/handleValidationErrors.js');
const FirmaController = require('./controllers/FirmaController.js');
const PersonController = require('./controllers/PersonController.js');
const UserController = require('./controllers/UserController.js');

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
app.post('/auth/logout', UserController.logout);
// app.post('/auth/register', registerValidation, handleValidationErrors, UserController.register);
app.get('/auth/me', checkAuth, UserController.getMe);
app.patch('/auth/profile', checkAuth, UserController.update);

app.post('/upload', checkAuth, upload.single('image'), (req, res) => {
  res.json({
    url: `${req.file.originalname}`,
  });
});

app.get('/sessions', checkAuth, UserController.getSessionsList);

app.post('/enterprs', checkAuth, FirmaController.getSome);
app.get('/enterprs/:id', checkAuth, FirmaController.getOne);
app.post('/peoples', checkAuth, PersonController.getSome);
app.get('/peoples/:id', checkAuth, PersonController.getOne);
app.post('/peoples/new', checkAuth, PersonController.insertPerson);
app.get('/peoples/with/:name', checkAuth, PersonController.getSameNames);
app.get('/peoples/with/:ident', checkAuth, PersonController.getSameIdent);
app.patch('/peoples/editperson', checkAuth, PersonController.updatePersonOnly);
app.patch('/peoples/edit', checkAuth, PersonController.updatePersonPlace);
app.patch('/peoples/editnewplace', checkAuth, PersonController.updatePersonNewPlace);
app.patch('/peoples/exit', checkAuth, PersonController.exitPerson);
app.get('/founders/:id', checkAuth, FirmaController.getFounders);
app.get('/heads/:id', checkAuth, FirmaController.getHeads);
// app.post('/enterprs', checkAuth, enterprCreateValidation, handleValidationErrors, FirmaController.create);
// app.delete('/enterprs/:id', checkAuth, FirmaController.remove);
// app.patch('/enterprs/:id', checkAuth, enterprCreateValidation, handleValidationErrors, FirmaController.update);

app.listen(process.env.PORT, (err) => {
  if (err) {
    return console.log(err);
  }

  console.log('Server OK');
});