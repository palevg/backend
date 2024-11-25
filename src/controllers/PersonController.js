import mysqlpro from "mysql2/promise";
import { connData } from "./config.js";
import { GetFromTable, InsertIntoTable, UpdateTableRow, DataCombine, Msg } from "./db.js";

const PersFieldNamesToDB = {
  indnum: "Indnum",
  fullName: "Name",
  birthDate: "Birth",
  birthPlace: "BirthPlace",
  livePlace: "LivePlace",
  pasport: "Pasport",
  paspDate: "PaspDate",
  paspPlace: "PaspPlace",
  foto: "PhotoFile",
  osvita: "Osvita",
  editor: "byUserId"
}

const PlaceFieldNames = {
  enterDate: "EnterDate",
  exitDate: "ExitDate",
  editor: "byUserId"
}

const ConnectFieldNames = {
  humanId: "HumanId",
  enterpr: "Enterprise"
}

const PFoundNewFieldNamesToDB = { ...ConnectFieldNames, ...PlaceFieldNames, statutPart: "StatutPart" }

const PFoundUpdFieldNamesToDB = { ...PlaceFieldNames, statutPart: "StatutPart" }

const PHeadNewFieldNamesToDB = { ...ConnectFieldNames, ...PlaceFieldNames, posada: "Posada", inCombination: "InCombination", sequrBoss: "SequrBoss" }

const PHeadUpdFieldNamesToDB = { ...PlaceFieldNames, posada: "Posada", inCombination: "InCombination", sequrBoss: "SequrBoss" }

const PEmplNewFieldNamesToDB = { ...ConnectFieldNames, ...PlaceFieldNames, posada: "Posada" }

const PEmplUpdFieldNamesToDB = { ...PlaceFieldNames, posada: "Posada" }

export const getSome = (req, res) => {
  let query = "SELECT * FROM peoples WHERE";
  let flagAnd = false;
  if (req.body.name) {
    query += " Name like '%" + req.body.name + "%'";
    flagAnd = true;
  }
  if (req.body.address) {
    if (flagAnd) query += " AND";
    query += " LivePlace like '%" + req.body.address + "%'";
  }
  if (req.body.idkod) {
    if (flagAnd) query += " AND";
    query += " Indnum like '%" + req.body.idkod + "%'";
  }
  query += " ORDER BY Name";
  GetFromTable(res, query, [], false, `${Msg.err}${Msg.get_err.slice(0, 24)}`);
};

export const getOne = async (req, res) => {
  let query = "SELECT * FROM peoples WHERE Id=?";
  let fullInfo = await GetFromTable(res, query, req.params.id, true, `${Msg.err}${Msg.get_err}${Msg.human}`);
  if (fullInfo.length !== 0) {
    fullInfo[0].res_key = 0;
    query = "SELECT f.*,e.FullName FROM peoples p, p_founds f, enterprs e WHERE p.Id=f.HumanId AND e.Id=f.Enterprise AND p.Id=? ORDER BY f.EnterDate";
    let result = await GetFromTable(res, query, req.params.id, true, "");
    fullInfo = DataCombine(result, 1, fullInfo);
    query = "SELECT h.*,e.FullName FROM peoples p, p_heads h, enterprs e WHERE p.Id=h.HumanId AND e.Id=h.Enterprise AND p.Id=? ORDER BY h.EnterDate";
    result = await GetFromTable(res, query, req.params.id, true, "");
    fullInfo = DataCombine(result, 2, fullInfo);
    query = "SELECT s.*,e.FullName FROM peoples p, p_sequr s, enterprs e WHERE p.Id=s.HumanId AND e.Id=s.Enterprise AND p.Id=? ORDER BY s.EnterDate";
    result = await GetFromTable(res, query, req.params.id, true, "");
    fullInfo = DataCombine(result, 3, fullInfo);
    res.json(fullInfo);
  } else res.status(404).json({ message: `Фізична особа ${Msg.not_found}а!` });
};

export const getSameNames = (req, res) => {
  GetFromTable(res, "SELECT * FROM peoples WHERE Name=?", req.params.name, false, `${Msg.err}${Msg.get_err}осіб з таким же ПІБ`);
}

export const getSameIdent = (req, res) => {
  GetFromTable(res, "SELECT * FROM peoples WHERE Indnum=?", req.params.ident, false, `${Msg.err}${Msg.get_err}осіб з таким же ідентифікаційним кодом`);
}

const newPlace = async (req, res, db) => {
  let insertRes;
  switch (req.body.personType) {
    case 1:
      insertRes = await InsertIntoTable(db, "p_founds", req.body, PFoundNewFieldNamesToDB);
      if (insertRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.ins_err}ого ${Msg.founder}а!` });
      res.status(200).json({ message: `${Msg.new_data}ого ${Msg.founder}а${Msg.saved}` });
      break;
    case 2:
      insertRes = await InsertIntoTable(db, "p_heads", req.body, PHeadNewFieldNamesToDB);
      if (insertRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.ins_err}ого ${Msg.head}а!` });
      res.status(200).json({ message: `${Msg.new_data}ого ${Msg.head}а${Msg.saved}` });
      break;
    case 3:
      insertRes = await InsertIntoTable(db, "p_sequr", req.body, PEmplNewFieldNamesToDB);
      if (insertRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.ins_err}ого ${Msg.employee}!` });
      res.status(200).json({ message: `${Msg.new_data}ого ${Msg.employee}${Msg.saved}` });
      break;
    default:
      break;
  }
}

export const newPerson = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const insertRes = await InsertIntoTable(db, "peoples", req.body, PersFieldNamesToDB);
  if (insertRes.affectedRows === 1) {
    req.body.humanId = insertRes.insertId;
    await newPlace(req, res, db);
  } else res.status(500).json({ message: `${Msg.err}${Msg.ins_err}у ${Msg.human}!` });
  db.end();
}

export const updatePersonOnly = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const updateRes = await UpdateTableRow(db, "peoples", req.body, { ...PersFieldNamesToDB, PrKey: "humanId" });
  if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err}${Msg.human}!` });
  res.status(200).json({ message: `${Msg.update}${Msg.human}${Msg.saved}` });
  db.end();
}

export const updatePersonPlace = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  let updateRes = "";
  if (req.body.updatePerson) updateRes = await UpdateTableRow(db, "peoples", req.body, { ...PersFieldNamesToDB, PrKey: "humanId" });
  if (updateRes === "" || updateRes.affectedRows === 1) {
    switch (req.body.personType) {
      case 1:
        updateRes = await UpdateTableRow(db, "p_founds", req.body, { ...PFoundUpdFieldNamesToDB, PrKey: "id" });
        if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err}${Msg.founder}а!` });
        res.status(200).json({ message: `${Msg.update}${Msg.founder}а${Msg.saved}` });
        break;
      case 2:
        updateRes = await UpdateTableRow(db, "p_heads", req.body, { ...PHeadUpdFieldNamesToDB, PrKey: "id" });
        if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err}${Msg.head}а!` });
        res.status(200).json({ message: `${Msg.update}${Msg.head}а${Msg.saved}` });
        break;
      case 3:
        updateRes = await UpdateTableRow(db, "p_sequr", req.body, { ...PEmplUpdFieldNamesToDB, PrKey: "id" });
        if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err}${Msg.employee}!` });
        res.status(200).json({ message: `${Msg.update}${Msg.employee}${Msg.saved}` });
        break;
      default:
        break;
    }
  } else res.status(500).json({ message: `${Msg.err}${Msg.upd_err}${Msg.human}!` });
  db.end();
}

export const updatePersonNewPlace = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  req.body.updatePerson && await UpdateTableRow(db, "peoples", req.body, { ...PersFieldNamesToDB, PrKey: "humanId" });
  await newPlace(req, res, db);
  db.end();
}

export const exitPerson = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const query = { text: "UPDATE ", errText: Msg.err, succText: "Особу успішно " };
  if (req.body.personType === 1) {
    query.text += "p_founds SET ExitDate=?, State=1, byUserId=? WHERE Id=?";
    query.errText += `вивести ${Msg.human} зі складу ${Msg.founder}ів!`;
    query.succText += `виведено зі складу ${Msg.founder}ів!`;
  } else {
    query.text += `${req.body.personType === 2 ? "p_heads" : "p_sequr"} SET ExitDate=?, State=1, byUserId=? WHERE Id=?`;
    query.errText += `звільнити ${Msg.human}!`;
    query.succText += "звільнено із займаної посади!";
  }
  try {
    [query.cb] = await db.query(query.text, [req.body.date, req.body.editor, req.body.id]);
    if (query.cb.affectedRows !== 1) return res.status(500).json({ message: query.errText });
    res.status(200).json({ message: query.succText });
  } catch (err) {
    res.status(500).json({ message: "Помилка оновлення даних!", error: err });
  }
  db.end();
}