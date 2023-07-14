const mysql2 = require('mysql2');
const connData = require('./config.js');

// const convertDateToISO = () => {
//   const date = new Date();
//   const year = date.toLocaleString("default", { year: "numeric" });
//   const month = date.toLocaleString("default", { month: "2-digit" });
//   const day = date.toLocaleString("default", { day: "2-digit" });
//   return year + "-" + month + "-" + day;
// }

const getSome = (req, res) => {
  let query = "SELECT * FROM enterprs WHERE";
  let flagAnd = false;
  if (req.body.name) {
    query += " FullName like '%" + req.body.name + "%'";
    flagAnd = true;
  }
  if (req.body.edrpou) {
    flagAnd ? query += " AND" : flagAnd = true;
    query += " Ident like '%" + req.body.edrpou + "%'";
  }
  if (req.body.address) {
    flagAnd ? query += " AND" : flagAnd = true;
    query += " AddressDeUre like '%" + req.body.address + "%'";
  }
  if (req.body.region) {
    flagAnd ? query += " AND" : flagAnd = true;
    query += " Region=" + req.body.region;
  }
  flagAnd ? query += " AND" : flagAnd = true;
  query += " Id IN (SELECT EnterpriseId FROM licenze";
  if (req.body.license < 4) {
    query += " WHERE State=";
    if (req.body.license === 2)
      query += "0 AND DateClose<CURDATE()"
    else query += req.body.license;
    if (req.body.license === 0)
      query += " AND DateClose>=CURDATE()";
  }
  query += ") ORDER BY KeyName";
  const db = mysql2.createConnection(connData);
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані' });
    res.json(results);
  });
  db.end();
};

const getOne = (req, res) => {
  const id = req.params.id;
  let fullInfo;
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM enterprs WHERE Id=?", id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані про підприємство' });
    if (results.length !== 0) {
      results[0].res_key = 0;
      fullInfo = results;
      const dbAdd = mysql2.createConnection(connData);
      fullInfo[0].AfilEnterp &&
        dbAdd.query("SELECT Id, Ident, FullName FROM enterprs WHERE Id IN (" + fullInfo[0].AfilEnterp + ") ORDER BY KeyName", (err, listEnt) => {
          listEnt.map((itemAfil) => { itemAfil.res_key = 1; });
          fullInfo = [...fullInfo, ...listEnt];
        });
      dbAdd.query("SELECT * FROM peoples p, p_founds f WHERE f.HumanId=p.Id AND f.Enterprise=? ORDER BY p.Name", id, (err, results) => {
        results.map((item) => { if (!item.res_key) item.res_key = 2; });
        fullInfo = [...fullInfo, ...results];     // fullInfo = fullInfo.concat(results);
      });
      dbAdd.query("SELECT * FROM enterp_f WHERE EnterpriseId=? ORDER BY DateEnter", id, (err, results) => {
        results.map((item) => { if (!item.res_key) item.res_key = 3; });
        fullInfo = [...fullInfo, ...results];
      });
      dbAdd.query("SELECT * FROM peoples p, p_heads h WHERE h.HumanId=p.Id AND h.Enterprise=? ORDER BY DateStartWork,Name", id, (err, results) => {
        results.map((item) => { if (!item.res_key) item.res_key = 4; });
        fullInfo = [...fullInfo, ...results];
      });
      dbAdd.query("SELECT * FROM licenze l, lic_type t WHERE l.TypeLicenze=t.Id AND l.EnterpriseId=? ORDER BY l.DateLicenz,l.Category", id, (err, results) => {
        results.map((item) => { if (!item.res_key) item.res_key = 5; });
        fullInfo = [...fullInfo, ...results];
      });
      dbAdd.query("SELECT * FROM peoples p, p_sequr s WHERE s.HumanId=p.Id AND s.Enterprise=? ORDER BY p.Name", id, (err, results) => {
        results.map((item) => { if (!item.res_key) item.res_key = 6; });
        fullInfo = [...fullInfo, ...results];
      });
      dbAdd.query("SELECT * FROM objects WHERE Enterprise=?", id, (err, results) => {
        results.map((item) => { if (!item.res_key) item.res_key = 7; });
        fullInfo = [...fullInfo, ...results];
      });
      dbAdd.query("SELECT * FROM violat WHERE EnterpriseId=?", id, (err, results) => {
        results.map((item) => { if (!item.res_key) item.res_key = 8; });
        fullInfo = [...fullInfo, ...results];
        res.json(fullInfo);
      });
      dbAdd.end();
    } else
      return res.status(404).json({ message: "Юридична особа не знайдена!" });
  });
  db.end();
};

module.exports = { getSome, getOne };