const mysql2 = require('mysql2');
const connData = require('./config.js');

const convertDateToISO = (notISO) => {
  return notISO.split(".").reverse().join("-");
}

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
  db.query("SELECT * FROM peoples WHERE Id=?", req.params.id, (err, results) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані про особу' });
    if (results.length !== 0) {
      results[0].res_key = 0;
      fullInfo = results;
      const dbAdd = mysql2.createConnection(connData);
      dbAdd.query("SELECT p.Id,f.*,e.FullName FROM peoples p, p_founds f, enterprs e WHERE p.Id=f.HumanId AND e.Id=f.Enterprise AND p.Id=? ORDER BY f.DateEnter", req.params.id, (err, results) => {
        results.map((item) => {
          if (!item.res_key) item.res_key = 1;
        });
        fullInfo = [...fullInfo, ...results];
      });
      dbAdd.query("SELECT p.Id,h.*,e.FullName FROM peoples p, p_heads h, enterprs e WHERE p.Id=h.HumanId AND e.Id=h.Enterprise AND p.Id=? ORDER BY h.DateStartWork", req.params.id, (err, results) => {
        results.map((item) => {
          if (!item.res_key) item.res_key = 2;
        });
        fullInfo = [...fullInfo, ...results];
      });
      dbAdd.query("SELECT p.Id,s.*,e.FullName FROM peoples p, p_sequr s, enterprs e WHERE p.Id=s.HumanId AND e.Id=s.Enterprise AND p.Id=?", req.params.id, (err, results) => {
        results.map((item) => {
          if (!item.res_key) item.res_key = 3;
        });
        fullInfo = [...fullInfo, ...results];
        res.json(fullInfo);
      });
      dbAdd.end();
    } else
      return res.status(404).json({ message: "Фізична особа не знайдена!" });
  });
  db.end();
};

const updatePerson = (db, req, res) => {
  db.query("UPDATE peoples SET Indnum=?, Name=?, Birth=?, BirthPlace=?, LivePlace=?, Pasport=?, PaspDate=?, PaspPlace=?, PhotoFile=?, Osvita=?, byUserId=? WHERE Id=?",
    [req.body.indnum, req.body.fullName, convertDateToISO(req.body.birthDate), req.body.birthPlace, req.body.livePlace, req.body.pasport,
    convertDateToISO(req.body.paspDate), req.body.paspPlace, req.body.foto, req.body.osvita, req.body.editor, req.body.humanId], (err, results) => {
      if (err) return res.status(500).json({ message: 'Не вдалося оновити дані про особу!', error: err });
      res.status(200).json("Зміни даних про особу збережено успішно!");
    });
}

const updatePersonFounders = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("UPDATE p_founds SET DateEnter=?, StatutPart=?, byUserId=? WHERE Id=?",
    [convertDateToISO(req.body.dateEnter), req.body.statutPart, req.body.editor, req.body.id], (err, results) => {
      if (err) return res.status(500).json({ message: 'Не вдалося оновити дані профілю', error: err });
    });
  updatePerson(db, req, res);
  db.end();
}

const updatePersonHeads = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("UPDATE p_heads SET Posada=?, DateStartWork=?, byUserId=? WHERE Id=?",
    [req.body.posada, convertDateToISO(req.body.dateStartWork), req.body.editor, req.body.id], (err, results) => {
      if (err) return res.status(500).json({ message: 'Не вдалося оновити дані профілю', error: err });
    });
  updatePerson(db, req, res);
  db.end();
}

module.exports = { getSome, getOne, updatePersonFounders, updatePersonHeads };