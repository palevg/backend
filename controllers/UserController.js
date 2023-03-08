import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import db from "./config.js";

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
//       'secret123',
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

export const login = (req, res) => {
  db.query("SELECT * FROM users WHERE email=?", req.body.email, (err, data) => {
    if (err) return res.status(500).json({ message: 'Не вдалося авторизуватись' });
    if (data.length === 0) return res.status(404).json("Користувач не знайдений!");

    const isValidPass = bcrypt.compareSync(req.body.password, data[0].passwordHash);

    if (!isValidPass) {
      return res.status(400).json({ message: 'Не вірний логін або пароль' });
    }

    const token = jwt.sign({ id: data[0].Id }, 'secret123', { expiresIn: '30d' });
    const { passwordHash, ...userData } = data[0];

    res.status(200).json({ ...userData, token });
  });
};

export const getMe = (req, res) => {
  db.query("SELECT * FROM users WHERE Id=?", req.userId, (err, data) => {
    if (err) return res.status(500).json({ message: 'Немає доступу' });
    if (data.length === 0) return res.status(404).json({ message: 'Користувач не знайдений!' });

    const { passwordHash, ...userData } = data[0];
    res.json(userData);
  });
};