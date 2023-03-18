const mysql2 = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const connData = require('./config.js');

const login = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM users WHERE email=?", req.body.email, (err, data) => {
    if (err) return res.status(500).json({ message: 'Не вдалося авторизуватись', error: err });
    if (data.length === 0) return res.status(404).json({ message: "Користувач не знайдений!" });

    const isValidPass = bcrypt.compareSync(req.body.password, data[0].passwordHash);

    // const passCreate = async (p) => {
    //   const pas1 = p;
    //   const salt = await bcrypt.genSalt(10);
    //   const hash1 = await bcrypt.hash(pas1, salt);
    //   console.log(hash1);
    // }
    // passCreate('12345');

    if (!isValidPass) {
      return res.status(400).json({ message: 'Не вірний логін або пароль' });
    }

    const token = jwt.sign({ id: data[0].Id }, process.env.JWT_KEY, { expiresIn: '30d' });
    const { passwordHash, ...userData } = data[0];

    res.status(200).json({ ...userData, token });
  });
  db.end();
};

const getMe = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM users WHERE Id=?", req.userId, (err, data) => {
    if (err) return res.status(500).json({ message: 'Немає доступу' });
    if (data.length === 0) return res.status(404).json({ message: 'Користувач не знайдений!' });

    const { passwordHash, ...userData } = data[0];
    res.json(userData);
  });
  db.end();
};

module.exports = { login, getMe };

// export const register = async (req, res) => {
//   try {
//     const password = req.body.password;
//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(password, salt);

//     const doc = new UserModel({
//       email: req.body.email,
//       fullName: req.body.fullName,
//       avatarUrl: req.body.avatarUrl,
//       passwordHash: hash,
//     });

//     const user = await doc.save();

//     const token = jwt.sign(
//       {
//         _id: user._id,
//       },
//       process.env.JWT_KEY,
//       {
//         expiresIn: '30d',
//       },
//     );

//     const { passwordHash, ...userData } = user._doc;

//     res.json({
//       ...userData,
//       token,
//     });
//   } catch (err) {
//     console.log(err);
//     res.status(500).json({
//       message: 'Не вдалося зареєструватись',
//     });
//   }
// };