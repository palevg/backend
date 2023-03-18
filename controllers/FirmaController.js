const mysql2 = require('mysql2');
const connData = require('./config.js');

const getAll = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM enterprs WHERE Id IN (SELECT EnterpriseId FROM licenze)", (err, results) => {
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
    results.map((item) => { item.res_key = 0; });
    fullInfo = results;
  });
  db.query("SELECT * FROM peoples p, p_founds f WHERE f.HumanId=p.Id AND f.Enterprise=? ORDER BY p.Name", id, (err, results) => {
    results.map((item) => { if (!item.res_key) item.res_key = 1; });
    fullInfo = [...fullInfo, ...results];     // fullInfo = fullInfo.concat(results);
  });
  db.query("SELECT * FROM enterp_f WHERE EnterpriseId=? ORDER BY DateEnter", id, (err, results) => {
    results.map((item) => { if (!item.res_key) item.res_key = 2; });
    fullInfo = [...fullInfo, ...results];
  });
  db.query("SELECT * FROM peoples p, p_heads h WHERE h.HumanId=p.Id AND h.Enterprise=? ORDER BY DateStartWork,Name", id, (err, results) => {
    results.map((item) => { if (!item.res_key) item.res_key = 3; });
    fullInfo = [...fullInfo, ...results];
  });
  db.query("SELECT * FROM licenze WHERE EnterpriseId=? ORDER BY DateLicenz,Category", id, (err, results) => {
    results.map((item) => { if (!item.res_key) item.res_key = 4; });
    fullInfo = [...fullInfo, ...results];
  });
  db.query("SELECT * FROM peoples p, p_sequr s WHERE s.HumanId=p.Id AND s.Enterprise=? ORDER BY p.Name", id, (err, results) => {
    results.map((item) => { if (!item.res_key) item.res_key = 5; });
    fullInfo = [...fullInfo, ...results];
  });
  db.query("SELECT * FROM objects WHERE Enterprise=?", id, (err, results) => {
    results.map((item) => { if (!item.res_key) item.res_key = 6; });
    fullInfo = [...fullInfo, ...results];
  });
  db.query("SELECT * FROM violat WHERE EnterpriseId=?", id, (err, results) => {
    results.map((item) => { if (!item.res_key) item.res_key = 7; });
    fullInfo = [...fullInfo, ...results];
    res.json(fullInfo);
  });
  db.end();
};

module.exports = { getAll, getOne };