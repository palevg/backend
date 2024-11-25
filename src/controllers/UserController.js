import mysqlpro from "mysql2/promise";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { connData } from "./config.js";
import { GetFromTable, InsertIntoTable, UpdateTableRow, Msg } from "./db.js";

const SessionFieldNamesToDB = {
  userId: "UserId",
  name: "UserName",
  timeStart: "DateTimeStart",
  host: "HostIP"
}

export const login = async (req, res) => {
  const accDateTime = new Date().toLocaleTimeString("uk") + " " + new Date().toLocaleDateString("uk");
  const sessionData = {
    userId: 1,
    name: req.body.email,
    timeStart: "У доступі відмовлено",
    host: req.body.ip
  }
  let userData = await GetFromTable(res, "SELECT * FROM users WHERE Email=?", req.body.email, true, `${Msg.err}авторизуватися!`);
  const db = await mysqlpro.createConnection(connData);
  if (userData.length === 0) {
    const insertRes = await InsertIntoTable(db, "sessions", { ...sessionData, timeFinish: accDateTime }, { ...SessionFieldNamesToDB, timeFinish: "DateTimeFinish" });
    if (insertRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.ins_err}ий ${Msg.session}!` });
    return res.status(404).json({ message: `${Msg.user} ${Msg.not_found}ий!` });
  }
  sessionData.userId = userData[0].Id;
  sessionData.name = userData[0].FullName;
  sessionData.level = userData[0].accLevel;

  const isValidPass = bcrypt.compareSync(req.body.password, userData[0].Password);
  if (!isValidPass) {
    const insertRes = await InsertIntoTable(db, "sessions", { ...sessionData, timeFinish: accDateTime }, { ...SessionFieldNamesToDB, level: "Level", timeFinish: "DateTimeFinish" });
    if (insertRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.ins_err}ий ${Msg.session}!` });
    return res.status(400).json({ message: "Не вірний логін або пароль!" });
  }

  sessionData.timeStart = accDateTime;
  const insertRes = await InsertIntoTable(db, "sessions", sessionData, { ...SessionFieldNamesToDB, level: "Level" });
  db.end();
  if (insertRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.ins_err}ий ${Msg.session}!` });
  userData[0].accId = insertRes.insertId;
  userData[0].acc = 1;
  if (bcrypt.compareSync("user", userData[0].accLevel)) userData[0].acc = 2;
  if (bcrypt.compareSync("user-pro", userData[0].accLevel)) userData[0].acc = 3;

  const token = jwt.sign({ id: userData[0].Id, accId: userData[0].accId, acc: userData[0].acc }, process.env.JWT_KEY, { expiresIn: '30d' });
  const { Password, ...accData } = userData[0];
  res.status(200).json({ ...accData, token });
};

const UserFieldNamesToDB = {
  fullName: "FullName",
  posada: "Posada",
  email: "Email"
}

export const update = async (req, res) => {
  if (req.body.changePassword) {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.newPassword, salt);
    const userData = await GetFromTable(res, "SELECT * FROM users WHERE Id=?", req.body.id, true, `${Msg.err}перевірити ідентичність паролю у профілі`);
    const isValidPass = bcrypt.compareSync(req.body.oldPassword, userData[0].Password);
    if (isValidPass) {
      const db = await mysqlpro.createConnection(connData);
      const updateRes = await UpdateTableRow(db, "users", { ...req.body, password: hash }, { ...UserFieldNamesToDB, password: "Password", PrKey: "id" });
      db.end();
      if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err.slice(0, 28)}філю` });
      res.status(200).json({ message: `${Msg.profile}${Msg.updated}` });
    } else res.status(500).json({ message: `${Msg.profile} не оновлено - невірно вказаний поточний пароль!` });
  } else {
    const db = await mysqlpro.createConnection(connData);
    const updateRes = await UpdateTableRow(db, "users", req.body, { ...UserFieldNamesToDB, PrKey: "id" });
    db.end();
    if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err.slice(0, 28)}філю` });
    res.status(200).json({ message: `${Msg.profile}${Msg.updated}` });
  }
}

export const logout = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const exitDateTime = new Date().toLocaleTimeString("uk") + " " + new Date().toLocaleDateString("uk");
  const updateRes = await UpdateTableRow(db, "sessions", { ...req.body, timeFinish: exitDateTime }, { timeFinish: "DateTimeFinish", PrKey: "accId" });
  if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err}${Msg.session} ${Msg.user.toLowerCase()}а!` });
  res.status(200).json({ message: `${Msg.update}${Msg.session} ${Msg.user.toLowerCase()}а${Msg.saved}` });
  db.end();
}

export const getMe = async (req, res) => {
  let userData = await GetFromTable(res, "SELECT * FROM users WHERE Id=?", req.userId, true, "Немає доступу!");
  if (userData.length === 0) return res.status(404).json({ message: `${Msg.user} ${Msg.not_found}ий!` });
  userData[0].accId = req.userAccId;
  userData[0].acc = req.userAcc;
  const { Password, ...accData } = userData[0];
  res.json(accData);
};

export const getSessionsList = (req, res) => {
  const query = "SELECT * FROM users u, sessions s WHERE u.Id=s.UserId ORDER BY s.Id DESC LIMIT 200";
  GetFromTable(res, query, [], false, `${Msg.err}${Msg.get_err.slice(0, 24)}`);
};