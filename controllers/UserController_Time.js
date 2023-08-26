const mysql2 = require('mysql2');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const connData = require('./config.js');

const writeConnectInfo = (sql, data) => {
  const db_acc = mysql2.createConnection(connData);
  db_acc.query(sql, data, (err, results) => {
    if (err) console.log(err);
  });
  db_acc.end();
}

// const passHashing = async (pass) => {
//   const salt = await bcrypt.genSalt(10);
//   const hash = await bcrypt.hash(pass, salt);
//   return hash;
// }

const login = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM users WHERE Email=?", req.body.email, (err, data) => {
    if (err) return res.status(500).json({ message: 'Не вдалося авторизуватися!', error: err });

    if (data.length === 0) {
      writeConnectInfo(
        "INSERT INTO sessions(UserId, UserName, DateTimeStart, DateTimeFinish, HostIP) VALUES(?, ?, ?, ?, ?)",
        [1, req.body.email, "У доступі відмовлено", new Date().toLocaleTimeString("uk") + " " + new Date().toLocaleDateString("uk"), req.body.ip]
      );
      return res.status(404).json({ message: "Користувач не знайдений!" });
    }

    const isValidPass = bcrypt.compareSync(req.body.password, data[0].Password);

    if (!isValidPass) {
      writeConnectInfo(
        "INSERT INTO sessions(UserId, UserName, Level, DateTimeStart, DateTimeFinish, HostIP) VALUES(?, ?, ?, ?, ?, ?)",
        [data[0].Id, data[0].FullName, data[0].accLevel, "У доступі відмовлено", new Date().toLocaleTimeString("uk") + " " + new Date().toLocaleDateString("uk"), req.body.ip]
      );
      return res.status(400).json({ message: 'Не вірний логін або пароль!' });
    }

    const db_acc = mysql2.createConnection(connData);
    // db_acc.query("SHOW TABLE STATUS FROM `nop` LIKE 'sessions'", (err, result) => {
    //   if (err) console.log(err)
    //   else data[0].accId = result[0].Auto_increment;
    // });
    db_acc.query("SELECT MAX(id) AS id FROM sessions", (err, result) => {
      if (err) console.log(err)
      else data[0].accId = result[0].id + 1;
    });
    db_acc.query("INSERT INTO sessions(UserId, UserName, Level, DateTimeStart, HostIP) VALUES(?, ?, ?, ?, ?)",
      [data[0].Id, data[0].FullName, data[0].accLevel, new Date().toLocaleTimeString("uk") + " " + new Date().toLocaleDateString("uk"), req.body.ip],
      (err, result) => {
        if (err) console.log(err);
      });
    db_acc.end();

    setTimeout(() => {
      data[0].acc = 1;
      if (bcrypt.compareSync("user", data[0].accLevel)) data[0].acc = 2;
      if (bcrypt.compareSync("user-pro", data[0].accLevel)) data[0].acc = 3;
      const token = jwt.sign({ id: data[0].Id, accId: data[0].accId, acc: data[0].acc }, process.env.JWT_KEY, { expiresIn: '30d' });
      const { Password, ...userData } = data[0];
      res.status(200).json({ ...userData, token });
    }, "800");
  });
  db.end();
};

const update = async (req, res) => {
  const db = mysql2.createConnection(connData);
  if (req.body.changePassword) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.newPassword, salt);

    db.query("SELECT * FROM users WHERE Id=?", req.body.id, (err, data) => {
      if (err) return res.status(500).json({ message: 'Не вдалося перевірити ідентичність паролю у профілі', error: err });
      const isValidPass = bcrypt.compareSync(req.body.oldPassword, data[0].Password);
      console.log(req.body.oldPassword);
      console.log("valid? ", isValidPass);

      if (isValidPass) {
        const db2 = mysql2.createConnection(connData);
        console.log("newPassword ", hash);
        db2.query("UPDATE users SET FullName=?, Posada=?, Email=?, Password=? WHERE Id=?",
          [req.body.fullName, req.body.posada, req.body.email, hash, req.body.id], (err, results) => {
            if (err) return res.status(500).json({ message: 'Не вдалося оновити дані профілю', error: err });
            res.status(200).json("Профіль оновлено успішно!");
          });
        db2.end();
      } else {
        res.status(500).json("Профіль не оновлено - невірно вказаний поточний пароль!");
      }
    });
  } else {
    db.query("UPDATE users SET FullName=?, Posada=?, Email=? WHERE Id=?",
      [req.body.fullName, req.body.posada, req.body.email, req.body.id], (err, results) => {
        if (err) return res.status(500).json({ message: 'Не вдалося авторизуватись', error: err });
        res.status(200).json("Профіль оновлено успішно!");
      });
  }
  db.end();
}

const logout = (req, res) => {
  writeConnectInfo(
    "UPDATE sessions SET DateTimeFinish=? WHERE Id=?",
    [new Date().toLocaleTimeString("uk") + " " + new Date().toLocaleDateString("uk"), req.body.accId]
  );
}

const getMe = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM users WHERE Id=?", req.userId, (err, data) => {
    if (err) return res.status(500).json({ message: 'Немає доступу' });
    if (data.length === 0) return res.status(404).json({ message: 'Користувач не знайдений!' });

    data[0].accId = req.userAccId;
    data[0].acc = req.userAcc;
    const { Password, ...userData } = data[0];
    res.json(userData);
  });
  db.end();
};

const getSessionsList = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM sessions s, users u WHERE u.Id=s.UserId ORDER BY s.Id DESC", (err, results) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані' });
    res.json(results);
  });
  db.end();
};

module.exports = { login, update, logout, getMe, getSessionsList };

// export const register = async (req, res) => {
//   try {
//     const password = req.body.password;
//     const salt = await bcrypt.genSalt(10);
//     const hash = await bcrypt.hash(password, salt);

//     const doc = new UserModel({
//       email: req.body.email,
//       fullName: req.body.fullName,
//       avatarUrl: req.body.avatarUrl,
//       Password: hash,
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

//     const { Password, ...userData } = user._doc;

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