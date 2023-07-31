const mysql2 = require('mysql2');
const mysqlpro = require('mysql2/promise');
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

const getSameNames = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM peoples WHERE Name=?", req.params.name, (err, results) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані про осіб з таким же ПІБ' });
    res.json(results);
  });
  db.end();
}

const getSameIdent = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM peoples WHERE Indnum=?", req.params.ident, (err, results) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані про осіб з таким же ідентифікаційним кодом' });
    res.json(results);
  });
  db.end();
}

const insertNewPerson = (db, req, res) => {
  db.query("INSERT INTO peoples(Indnum, Name, Birth, BirthPlace, LivePlace, Pasport, PaspDate, PaspPlace, PhotoFile, Osvita, byUserId) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [req.body.indnum, req.body.fullName, convertDateToISO(req.body.birthDate), req.body.birthPlace, req.body.livePlace, req.body.pasport,
    convertDateToISO(req.body.paspDate), req.body.paspPlace, req.body.foto, req.body.osvita, req.body.editor], (err, results) => {
      if (err) return res.status(500).json({ message: 'Не вдалося зберегти дані про нову особу!', error: err });
    });
}

const insertNewFounder = (db, req, res) => {
  db.query("INSERT INTO p_founds(HumanId, Enterprise, DateEnter, StatutPart, byUserId) VALUES(?, ?, ?, ?, ?)",
    [req.body.humanId, req.body.enterpr, convertDateToISO(req.body.dateEnter), req.body.statutPart, req.body.editor], (err, results) => {
      if (err) return res.status(500).json({ message: 'Не вдалося зберегти дані про нового співзасновника!', error: err });
      res.status(200).json("Дані про нового співзасновника збережено успішно!");
    });
}

const insertNewHead = (db, req, res) => {
  db.query("INSERT INTO p_heads(HumanId, Enterprise, Posada, InCombination, SequrBoss, DateStartWork, byUserId) VALUES(?, ?, ?, ?, ?, ?, ?)",
    [req.body.humanId, req.body.enterpr, req.body.posada, req.body.inCombination, req.body.sequrBoss, convertDateToISO(req.body.dateStartWork), req.body.editor], (err, results) => {
      if (err) return res.status(500).json({ message: 'Не вдалося зберегти дані про нового керівника!', error: err });
      res.status(200).json("Дані про нового керівника збережено успішно!");
    });
}
const insertPerson = async (req, res) => {
  const dbpro = await mysqlpro.createConnection(connData);
  const [result] = await dbpro.execute("SHOW TABLE STATUS FROM `nop` LIKE 'peoples'");
  req.body.humanId = result[0].Auto_increment;
  dbpro.end();
  const db = mysql2.createConnection(connData);
  insertNewPerson(db, req, res);
  if (req.body.personType === 1) insertNewFounder(db, req, res);
  if (req.body.personType === 2) insertNewHead(db, req, res);
  db.end();
}

const updatePerson = (db, req, res) => {
  db.query("UPDATE peoples SET Indnum=?, Name=?, Birth=?, BirthPlace=?, LivePlace=?, Pasport=?, PaspDate=?, PaspPlace=?, PhotoFile=?, Osvita=?, byUserId=? WHERE Id=?",
    [req.body.indnum, req.body.fullName, convertDateToISO(req.body.birthDate), req.body.birthPlace, req.body.livePlace, req.body.pasport,
    convertDateToISO(req.body.paspDate), req.body.paspPlace, req.body.foto, req.body.osvita, req.body.editor, req.body.humanId], (err, results) => {
      if (err) return res.status(500).json({ message: 'Не вдалося оновити дані про особу!', error: err });
    });
}

const updatePersonOnly = (req, res) => {
  const db = mysql2.createConnection(connData);
  updatePerson(db, req, res);
  res.status(200).json("Зміни даних про особу збережено успішно!");
  db.end();
}

const updatePersonFounder = (db, req, res) => {
  db.query("UPDATE p_founds SET DateEnter=?, StatutPart=?, byUserId=? WHERE Id=?",
    [convertDateToISO(req.body.dateEnter), req.body.statutPart, req.body.editor, req.body.id], (err, results) => {
      if (err) return res.status(500).json({ message: 'Не вдалося оновити дані про співзасновника!', error: err });
      res.status(200).json("Зміни даних про співзасновника збережено успішно!");
    });
}

const updatePersonHead = (db, req, res) => {
  db.query("UPDATE p_heads SET Posada=?, InCombination=?, SequrBoss=?, DateStartWork=?, byUserId=? WHERE Id=?",
    [req.body.posada, req.body.inCombination, req.body.sequrBoss, convertDateToISO(req.body.dateStartWork), req.body.editor, req.body.id], (err, results) => {
      if (err) return res.status(500).json({ message: 'Не вдалося оновити дані про керівника!', error: err });
      res.status(200).json("Зміни даних про керівника збережено успішно!");
    });
}

const updatePersonPlace = (req, res) => {
  const db = mysql2.createConnection(connData);
  if (req.body.updatePerson) updatePerson(db, req, res);
  if (req.body.personType === 1) updatePersonFounder(db, req, res);
  if (req.body.personType === 2) updatePersonHead(db, req, res);
  db.end();
}

const updatePersonNewPlace = (req, res) => {
  const db = mysql2.createConnection(connData);
  if (req.body.updatePerson) updatePerson(db, req, res);
  if (req.body.personType === 1) insertNewFounder(db, req, res);
  if (req.body.personType === 2) insertNewHead(db, req, res);
  db.end();
}

const exitPerson = (req, res) => {
  const db = mysql2.createConnection(connData);
  const query = {};
  if (req.body.role) {
    query.text = "UPDATE p_heads SET DateOfFire=?, State=1, byUserId=? WHERE Id=?";
    query.errText = "Не вдалося звільнити особу!";
    query.succText = "Особу успішно звільнено із займаної посади!";
  } else {
    query.text = "UPDATE p_founds SET DateExit=?, State=1, byUserId=? WHERE Id=?";
    query.errText = "Не вдалося вивести особу зі складу співзасновників!";
    query.succText = "Особу успішно виведено зі складу співзасновників!";
  }
  db.query(query.text, [req.body.date, req.body.editor, req.body.id], (err, results) => {
      if (err) return res.status(500).json({ message: query.errText, error: err });
      res.status(200).json(query.succText);
    });
  db.end();
}

module.exports = {
  getSome, getOne, getSameNames, getSameIdent, insertPerson, updatePersonOnly, updatePersonPlace, updatePersonNewPlace, exitPerson
};