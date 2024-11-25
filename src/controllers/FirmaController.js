import mysqlpro from "mysql2/promise";
import { connData } from "./config.js";
import { GetFromTable, InsertIntoTable, UpdateTableRow, DataCombine, Msg } from "./db.js";

const EntFieldNamesToDB = {
  ident: "Ident",
  dateCreate: "DateCreate",
  keyName: "KeyName",
  fullName: "FullName",
  region: "Region",
  opForm: "OPForm",
  formVlasn: "FormVlasn",
  vidDijal: "VidDijal",
  statutSize: "StatutSize",
  addressDeUre: "AddressDeUre",
  addressDeFacto: "AddressDeFacto",
  phones: "Phones",
  faxes: "Faxes",
  rosRah: "RosRah",
  rosUst: "RosUst",
  rosMFO: "RosMFO",
  afilEnterp: "AfilEnterp",
  addInfo: "AddInfo",
  hideInfo: "HideInfo",
  shevron: "Shevron",
  podatok: "Podatok",
  stateRisk: "StateRisk",
  editor: "byUserId"
}

const OrderFieldNamesToDB = {
  orderType: "OrderType",
  dateZajav: "DateZajav",
  humanId: "HumanId",
  numZajav: "NumZajav",
  category: "Category",
  options: "Options",
  editor: "byUserId"
}

const LicNewFieldNamesToDB = {
  typeLicenze: "TypeLicenze",
  serLicenze: "SerLicenze",
  numLicenze: "NumLicenze",
  dateLicenze: "DateLicenz",
  dateClose: "DateClose",
  reasonStart: "ReasonStart",
  editor: "byUserId",
}

const LicStateFieldNamesToDB = { state: "State", reasonClose: "ReasonClose" }

const LicUpdFieldNamesToDB = { ...LicNewFieldNamesToDB, ...LicStateFieldNamesToDB }

const CheckFieldNamesToDB = {
  checkSertifDate: "CheckSertificateDate",
  checkSertifNo: "CheckSertificateNo",
  checkType: "CheckType",
  checkDateStart: "StartCheckDate",
  checkDateEnd: "EndCheckDate",
  checkActNo: "CheckActNo",
  checker: "Checker",
  checkObjCount: "CheckObjCount",
  noViolations: "NoViolations",
  licUmov: "LicUmov",
  p211: "P211", p212: "P212", p213: "P213", p214: "P214", p215: "P215",
  p221: "P221", p222: "P222", p223: "P223", p224: "P224", p225: "P225", p226: "P226",
  p31: "P31", p32: "P32", p33: "P33", p34: "P34", p35: "P35", p44: "P44",
  p451: "P451", p452: "P452", p453: "P453", p456: "P456",
  p461: "P461", p462: "P462", p463: "P463", p464: "P464",
  p471: "P471", p472: "P472", p473: "P473", p474: "P474", p475: "P475", p476: "P476", p477: "P477", p478: "P478",
  n429: "N429", n4210: "N4210", n4211: "N4211", n4212: "N4212", n4213: "N4213",
  n4214: "N4214", n4215: "N4215", n4216: "N4216", n4217: "N4217",
  content: "Content",
  checkRozporDate: "CheckRozporDate",
  checkRozporNo: "CheckRozporNo",
  checkRozporDateAnswer: "CheckRozporDateAnswer",
  editor: "byUserId"
}

export const getSome = (req, res) => {
  let query = "SELECT * FROM enterprs WHERE";
  let flagAnd = false;
  if (req.body.name) {
    query += " FullName like '%" + req.body.name + "%'";
    flagAnd = true;
  }
  if (req.body.edrpou) {
    flagAnd ? (query += " AND") : (flagAnd = true);
    query += " Ident like '%" + req.body.edrpou + "%'";
  }
  if (req.body.address) {
    flagAnd ? (query += " AND") : (flagAnd = true);
    query += " AddressDeUre like '%" + req.body.address + "%'";
  }
  if (req.body.region) {
    flagAnd ? (query += " AND") : (flagAnd = true);
    query += " Region=" + req.body.region;
  }
  flagAnd ? (query += " AND") : (flagAnd = true);
  if (req.body.area === "0") {
    query += " Id IN (SELECT EnterpriseId FROM licenze";
    if (req.body.license < 4) {
      query += " WHERE State=";
      if (req.body.license === 2) query += "0 AND DateClose<CURDATE()"
      else query += req.body.license;
      if (req.body.license === 0) query += " AND DateClose>=CURDATE()";
    }
  }
  if (req.body.area === "1") query += " Id IN (SELECT EnterpriseId FROM orders WHERE State=" + req.body.order;
  query += ")";
  GetFromTable(res, query, [], false, `${Msg.err}${Msg.get_err.slice(0, 24)}`);
};

export const getEnterprNames = (req, res) => {
  const query = "SELECT Id, Ident, FullName, Shevron FROM enterprs WHERE Id<>317 AND Id<>? ORDER BY KeyName";
  GetFromTable(res, query, req.params.id, false, `${Msg.err}${Msg.get_err}недержавні охоронні підприємства`);
};

export const getOneShort = (req, res) => {
  GetFromTable(res, "SELECT * FROM enterprs WHERE Id=?", req.params.id, false, `${Msg.err}${Msg.get_err}${Msg.yur_os2}`);
};

export const getOneFull = async (req, res) => {
  let query = "SELECT * FROM enterprs WHERE Id=?";
  let fullInfo = await GetFromTable(res, query, req.params.id, true, `${Msg.err}${Msg.get_err}${Msg.yur_os2}`);
  if (fullInfo.length !== 0) {
    fullInfo[0].res_key = 0;
    let result;
    if (fullInfo[0].AfilEnterp) {
      query = "SELECT Id, Ident, KeyName, FullName, Shevron FROM enterprs WHERE Id IN (" + fullInfo[0].AfilEnterp + ")";
      result = await GetFromTable(res, query, [], true, `${Msg.err}${Msg.get_err}афільовані юридичні особи`);
      fullInfo = DataCombine(result, 1, fullInfo);
    }
    query = "SELECT * FROM peoples p, p_founds f WHERE f.HumanId=p.Id AND f.Enterprise=? ORDER BY p.Name";
    result = await GetFromTable(res, query, req.params.id, true, `${Msg.err}${Msg.get_err}${Msg.founder}ів ${Msg.yur_os}`);
    fullInfo = DataCombine(result, 2, fullInfo);
    query = "SELECT * FROM enterp_f WHERE EnterpriseId=? ORDER BY DateEnter";
    result = await GetFromTable(res, query, req.params.id, true, `${Msg.err}${Msg.get_err}${Msg.founder}ів ${Msg.yur_os}`);
    fullInfo = DataCombine(result, 3, fullInfo);
    query = "SELECT * FROM peoples p, p_heads h WHERE h.HumanId=p.Id AND h.Enterprise=? ORDER BY h.EnterDate, p.Name";
    result = await GetFromTable(res, query, req.params.id, true, `${Msg.err}${Msg.get_err}${Msg.head}ів ${Msg.yur_os}`);
    fullInfo = DataCombine(result, 4, fullInfo);
    query = "SELECT *, (SELECT Name FROM peoples WHERE Id=o.HumanId) AS Name FROM orders o WHERE o.EnterpriseId=? ORDER BY o.DateZajav, o.NumZajav";
    result = await GetFromTable(res, query, req.params.id, true, `${Msg.err}${Msg.get_err}заяви ${Msg.yur_os}`);
    fullInfo = DataCombine(result, 5, fullInfo);
    query = "SELECT * FROM lic_type t, licenze l WHERE l.TypeLicenze=t.Id AND l.EnterpriseId=? ORDER BY l.DateLicenz, t.Category";
    result = await GetFromTable(res, query, req.params.id, true, `${Msg.err}${Msg.get_err}${Msg.lic}ї ${Msg.yur_os}`);
    fullInfo = DataCombine(result, 6, fullInfo);
    query = "SELECT * FROM peoples p, p_sequr s WHERE s.HumanId=p.Id AND s.Enterprise=? ORDER BY p.Name";
    result = await GetFromTable(res, query, req.params.id, true, `${Msg.err}${Msg.get_err}персонал охорони ${Msg.yur_os}`);
    fullInfo = DataCombine(result, 7, fullInfo);
    query = "SELECT * FROM objects WHERE SequrState=1 AND Enterprise=?";
    result = await GetFromTable(res, query, req.params.id, true, `${Msg.err}${Msg.get_err}об'єкти під охороною ${Msg.yur_os}`);
    fullInfo = DataCombine(result, 8, fullInfo);
    query = "SELECT * FROM checks WHERE EnterpriseId=? ORDER BY StartCheckDate";
    result = await GetFromTable(res, query, req.params.id, true, `${Msg.err}${Msg.get_err}${Msg.check}и ${Msg.yur_os}`);
    fullInfo = DataCombine(result, 9, fullInfo);
    res.json(fullInfo);
  } else res.status(404).json({ message: `${Msg.yur_os1} ${Msg.not_found}а!` });
};

export const newEnterpr = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const insertRes = await InsertIntoTable(db, "enterprs", req.body, EntFieldNamesToDB);
  if (insertRes.affectedRows === 1) {
    try {
      const [insertOrd] = await db.query("INSERT INTO orders SET EnterpriseId=?, DateZajav=CURDATE(), byUserId=?", [insertRes.insertId, req.body.editor]);
      if (insertOrd.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.ins_err.slice(0, 29)}заяву нової ${Msg.yur_os}!` });
      res.status(200).json({ message: `${Msg.new_data.slice(0, 9)}заяву нової ${Msg.yur_os}${Msg.saved}`, newId: insertRes.insertId });
    } catch (err) {
      res.status(500).json({ message: "Помилка додавання запису до бази даних!", error: err });
    }
  } else res.status(500).json({ message: `${Msg.err}${Msg.ins_err}у ${Msg.yur_os2}!` });
  db.end();
};

export const updateEnterpr = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const updateRes = await UpdateTableRow(db, "enterprs", req.body, { ...EntFieldNamesToDB, PrKey: "id" });
  if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err}${Msg.yur_os2}!` });
  res.status(200).json({ message: `${Msg.update}${Msg.yur_os2}${Msg.saved}` });
  db.end();
};

export const getRegions = (req, res) => {
  GetFromTable(res, "SELECT * FROM region", [], false, `${Msg.err}${Msg.get_err}регіони України`);
};

export const getOPForms = (req, res) => {
  GetFromTable(res, "SELECT * FROM opforms ORDER BY Name", [], false, `${Msg.err}${Msg.get_err}організаційно-правові форми ${Msg.yur_os3}`);
};

export const getFormVlasn = (req, res) => {
  GetFromTable(res, "SELECT * FROM formvlsn", [], false, `${Msg.err}${Msg.get_err}форми власності ${Msg.yur_os3}`);
};

export const getActivities = (req, res) => {
  GetFromTable(res, "SELECT * FROM viddijal ORDER BY Name", [], false, `${Msg.err}${Msg.get_err}види діяльності ${Msg.yur_os3}`);
};

export const getLicTypes = (req, res) => {
  GetFromTable(res, "SELECT * FROM lic_type", [], false, `${Msg.err}${Msg.get_err}типи ${Msg.lic}й`);
};

export const getAfilEnterprs = (req, res) => {
  const query = `SELECT Id, Ident, KeyName, FullName, Shevron FROM enterprs WHERE Id IN (${req.body.list}) ORDER BY KeyName`;
  GetFromTable(res, query, [], false, `${Msg.err}${Msg.get_err}афільовані юридичні особи`);
};

export const getFounders = (req, res) => {
  const query = "SELECT * FROM peoples p, p_founds f WHERE f.HumanId=p.Id AND f.Enterprise=? ORDER BY Name";
  GetFromTable(res, query, req.params.id, false, `${Msg.err}${Msg.get_err}${Msg.founder}ів ${Msg.yur_os}`);
};

export const getFoundersE = (req, res) => {
  const query = "SELECT * FROM enterp_f WHERE EnterpriseId=? ORDER BY DateEnter";
  GetFromTable(res, query, req.params.id, false, `${Msg.err}${Msg.get_err}${Msg.founder}ів ${Msg.yur_os}`);
};

export const getHeads = (req, res) => {
  const query = "SELECT * FROM peoples p, p_heads h WHERE h.HumanId=p.Id AND h.Enterprise=? ORDER BY EnterDate, Name";
  GetFromTable(res, query, req.params.id, false, `${Msg.err}${Msg.get_err}${Msg.head}ів ${Msg.yur_os}`);
};

export const getOrders = (req, res) => {
  const query = "SELECT *, (SELECT Name FROM peoples WHERE Id=o.HumanId) AS Name FROM orders o WHERE o.EnterpriseId=? ORDER BY o.DateZajav, o.NumZajav";
  GetFromTable(res, query, req.params.id, false, `${Msg.err}${Msg.get_err}заяви ${Msg.yur_os}`);
};

export const getLicenses = (req, res) => {
  const query = "SELECT * FROM lic_type t, licenze l WHERE l.TypeLicenze=t.Id AND l.EnterpriseId=? ORDER BY l.DateLicenz, t.Category";
  GetFromTable(res, query, req.params.id, false, `${Msg.err}${Msg.get_err}${Msg.lic}ї ${Msg.yur_os}`);
};

export const getEmployees = (req, res) => {
  const query = "SELECT * FROM peoples p, p_sequr s WHERE s.HumanId=p.Id AND s.Enterprise=? ORDER BY p.Name";
  GetFromTable(res, query, req.params.id, false, `${Msg.err}${Msg.get_err}персонал охорони ${Msg.yur_os}`);
};

export const getChecks = (req, res) => {
  const query = "SELECT * FROM checks WHERE EnterpriseId=? ORDER BY StartCheckDate";
  GetFromTable(res, query, req.params.id, false, `${Msg.err}${Msg.get_err}${Msg.check}и ${Msg.yur_os}`);
};

export const getSameIdent = (req, res) => {
  const query = "SELECT * FROM enterprs WHERE Ident=?";
  GetFromTable(res, query, req.params.ident, false, `${Msg.err}${Msg.get_err}фізичних осіб з таким же кодом ЄДРПОУ`);
};

export const newOrder = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const insertRes = await InsertIntoTable(db, "orders", req.body, { ...OrderFieldNamesToDB, enterprId: "EnterpriseId" });
  if (insertRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.ins_err}у заяву!` });
  res.status(200).json({ message: `${Msg.new_data}у заяву ${Msg.yur_os}${Msg.saved}` });
  db.end();
};

export const updateOrder = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const updateRes = await UpdateTableRow(db, "orders", req.body, { ...OrderFieldNamesToDB, PrKey: "id" });
  if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err}заяву!` });
  res.status(200).json({ message: `${Msg.update}заяву${Msg.saved}` });
  db.end();
};

export const closeOrder = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const updateRes = await UpdateTableRow(db, "orders", req.body, { state: "State", options: "Options", editor: "byUserId", PrKey: "id" });
  if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err}заяву!` });
  res.status(200).json({ message: `${Msg.update}${Msg.state.toLowerCase()}заяви${Msg.saved}` });
  db.end();
};

export const newLicense = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const insertRes = await InsertIntoTable(db, "licenze", req.body, { ...LicNewFieldNamesToDB, enterpriseId: "EnterpriseId" });
  if (insertRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.ins_err}у ${Msg.lic}ю!` });
  res.status(200).json({ message: `${Msg.new_data}у ${Msg.lic}ю для ${Msg.yur_os}${Msg.saved}` });
  db.end();
};

export const updateLicense = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const updateRes = await UpdateTableRow(db, "licenze", req.body, { ...LicUpdFieldNamesToDB, PrKey: "id" });
  if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err}${Msg.lic}ю!` });
  res.status(200).json({ message: `${Msg.update}${Msg.lic}ю для ${Msg.yur_os}${Msg.saved}` });
  db.end();
};

export const updateLicenseState = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const updateRes = await UpdateTableRow(db, "licenze", req.body, { ...LicStateFieldNamesToDB, editor: "byUserId", PrKey: "id" });
  if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}змінити ${Msg.state.toLowerCase()}${Msg.lic}ї!` });
  res.status(200).json({ message: `${Msg.state}${Msg.lic}ї для ${Msg.yur_os} змінено успішно!` });
  db.end();
};

export const newCheck = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const insertRes = await InsertIntoTable(db, "checks", req.body, { ...CheckFieldNamesToDB, enterprId: "EnterpriseID" });
  if (insertRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.ins_err}у ${Msg.check}у!` });
  res.status(200).json({ message: `${Msg.new_data}у ${Msg.check}у ${Msg.yur_os}${Msg.saved}` });
  db.end();
};

export const updateCheck = async (req, res) => {
  const db = await mysqlpro.createConnection(connData);
  const updateRes = await UpdateTableRow(db, "checks", req.body, { ...CheckFieldNamesToDB, PrKey: "id" });
  if (updateRes.affectedRows !== 1) return res.status(500).json({ message: `${Msg.err}${Msg.upd_err}${Msg.check}у!` });
  res.status(200).json({ message: `${Msg.update}${Msg.check}у ${Msg.yur_os}${Msg.saved}` });
  db.end();
};