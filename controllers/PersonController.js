const mysql2 = require('mysql2');
const connData = require('./config.js');

const getAll = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM peoples", (err, results) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані' });
    res.json(results);
  });
  db.end();
};

const getSome = (req, res) => {
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
  const db = mysql2.createConnection(connData);
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані' });
    res.json(results);
  });
  db.end();
};

const getOne = (req, res) => {
  const db = mysql2.createConnection(connData);
  let fullInfo;
  db.query("SELECT * FROM peoples WHERE Id=?", req.params.id, (err, results, fields) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані про особу' });
    results.map((item) => { item.res_key = 0; });
    fullInfo = results;
  });
  db.query("SELECT p.Id,f.*,e.FullName FROM peoples p, p_founds f, enterprs e WHERE p.Id=f.HumanId AND e.Id=f.Enterprise AND p.Id=? ORDER BY f.DateEnter", req.params.id, (err, results) => {
    results.map((item) => {
      if (!item.res_key) item.res_key = 1;
    });
    fullInfo = [...fullInfo, ...results];
  });
  db.query("SELECT p.Id,h.*,e.FullName FROM peoples p, p_heads h, enterprs e WHERE p.Id=h.HumanId AND e.Id=h.Enterprise AND p.Id=? ORDER BY h.DateStartWork", req.params.id, (err, results) => {
    results.map((item) => {
      if (!item.res_key) item.res_key = 2;
    });
    fullInfo = [...fullInfo, ...results];
  });
  db.query("SELECT p.Id,s.*,e.FullName FROM peoples p, p_sequr s, enterprs e WHERE p.Id=s.HumanId AND e.Id=s.Enterprise AND p.Id=?", req.params.id, (err, results) => {
    results.map((item) => {
      if (!item.res_key) item.res_key = 3;
    });
    fullInfo = [...fullInfo, ...results];
    res.json(fullInfo);
  });
  db.end();
};

module.exports = { getAll, getSome, getOne };