const mysql2 = require("mysql2");
const mysqlpro = require("mysql2/promise");
const connData = require("./config.js");

const convertDateToISO = (notISO) => {
  if (notISO === null) return notISO;
  else return notISO.split(".").reverse().join("-");
};

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
  const db = mysql2.createConnection(connData);
  db.query(query, (err, results) => {
    if (err) return res.status(500).json({ message: "Не вдалося отримати дані" });
    res.json(results);
  });
  db.end();
};

const getEnterprNames = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT Id, Ident, FullName, Shevron FROM enterprs WHERE Id<>317 AND Id<>? ORDER BY KeyName", req.params.id,
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося отримати список підприємств" });
      res.json(results);
    }
  );
  db.end();
};

const getOneShort = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM enterprs WHERE Id=?", req.params.id,
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося отримати дані про підприємство" });
      if (results.length !== 0) res.json(results)
      else return res.status(404).json({ message: "Юридична особа не знайдена!" });
    }
  );
  db.end();
};

const getOneFull = (req, res) => {
  const id = req.params.id;
  let fullInfo;
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM enterprs WHERE Id=?", id, (err, results) => {
    if (err) return res.status(500).json({ message: "Не вдалося отримати дані про підприємство" });
    if (results.length !== 0) {
      results[0].res_key = 0;
      fullInfo = results;
      const dbAdd = mysql2.createConnection(connData);
      fullInfo[0].AfilEnterp &&
        dbAdd.query("SELECT Id, Ident, KeyName, FullName, Shevron FROM enterprs WHERE Id IN (" + fullInfo[0].AfilEnterp + ")",
          (err, listEnt) => {
            listEnt.map(itemAfil => itemAfil.res_key = 1);
            fullInfo = [...fullInfo, ...listEnt];
          }
        );
      dbAdd.query("SELECT * FROM peoples p, p_founds f WHERE f.HumanId=p.Id AND f.Enterprise=? ORDER BY p.Name", id,
        (err, results) => {
          results.map(item => { if (!item.res_key) item.res_key = 2; });
          fullInfo = [...fullInfo, ...results]; // fullInfo = fullInfo.concat(results);
        }
      );
      dbAdd.query("SELECT * FROM enterp_f WHERE EnterpriseId=? ORDER BY DateEnter", id,
        (err, results) => {
          results.map((item) => { if (!item.res_key) item.res_key = 3; });
          fullInfo = [...fullInfo, ...results];
        }
      );
      dbAdd.query("SELECT * FROM peoples p, p_heads h WHERE h.HumanId=p.Id AND h.Enterprise=? ORDER BY p.Name, h.DateStartWork", id,
        (err, results) => {
          results.map((item) => { if (!item.res_key) item.res_key = 4; });
          fullInfo = [...fullInfo, ...results];
        }
      );
      dbAdd.query("SELECT *, (SELECT Name FROM peoples WHERE Id=o.HumanId) AS Name FROM orders o WHERE o.EnterpriseId=? ORDER BY o.DateZajav, o.NumZajav", id,
        (err, results) => {
          results.map((item) => { if (!item.res_key) item.res_key = 5; });
          fullInfo = [...fullInfo, ...results];
        }
      );
      dbAdd.query("SELECT * FROM lic_type t, licenze l WHERE l.TypeLicenze=t.Id AND l.EnterpriseId=? ORDER BY l.DateLicenz, t.Category", id,
        (err, results) => {
          results.map((item) => { if (!item.res_key) item.res_key = 6; });
          fullInfo = [...fullInfo, ...results];
        }
      );
      dbAdd.query("SELECT * FROM peoples p, p_sequr s WHERE s.HumanId=p.Id AND s.Enterprise=? ORDER BY p.Name", id,
        (err, results) => {
          results.map((item) => { if (!item.res_key) item.res_key = 7; });
          fullInfo = [...fullInfo, ...results];
        }
      );
      dbAdd.query("SELECT * FROM objects WHERE SequrState=1 AND Enterprise=?", id,
        (err, results) => {
          results.map((item) => { if (!item.res_key) item.res_key = 8; });
          fullInfo = [...fullInfo, ...results];
        }
      );
      dbAdd.query("SELECT * FROM checks WHERE EnterpriseId=? ORDER BY StartCheckDate", id,
        (err, results) => {
          results.map((item) => { if (!item.res_key) item.res_key = 9; });
          fullInfo = [...fullInfo, ...results];
          res.json(fullInfo);
        }
      );
      dbAdd.end();
    } else return res.status(404).json({ message: "Юридична особа не знайдена!" });
  });
  db.end();
};

const insertNewEnterpr = async (req, res) => {
  const dbpro = await mysqlpro.createConnection(connData);
  const [result] = await dbpro.execute("SELECT MAX(Id) AS Id FROM enterprs");
  req.body.newId = result[0].Id + 1;
  dbpro.end();
  const db = mysql2.createConnection(connData);
  db.query("INSERT INTO enterprs(Ident, DateCreate, KeyName, FullName, Region, OPForm, FormVlasn, VidDijal, StatutSize, AddressDeUre, AddressDeFacto, Phones, Faxes, RosRah, RosUst, RosMFO, AfilEnterp, AddInfo, Shevron, Podatok, StateRisk, byUserId) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [req.body.ident, convertDateToISO(req.body.dateCreate), req.body.keyName, req.body.fullName,
    req.body.region, req.body.opForm, req.body.formVlasn, req.body.vidDijal, req.body.statutSize,
    req.body.addressDeUre, req.body.addressDeFacto, req.body.phones, req.body.faxes,
    req.body.rosRah, req.body.rosUst, req.body.rosMFO, req.body.afilEnterp, req.body.addInfo,
    req.body.shevron, req.body.podatok, req.body.stateRisk, req.body.editor],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося зберегти дані про нову юридичну особу!", error: err });
    }
  );
  db.query("INSERT INTO orders SET EnterpriseId=?, DateZajav=CURDATE(), byUserId=?",
    [req.body.newId, req.body.editor],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося зберегти дані про заяву нової юридичної особи!", error: err });
      res.status(200).json({ message: "Дані про заяву нової юридичної особи збережено успішно!", newId: req.body.newId });
    }
  );
  db.end();
};

const updateEnterpr = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("UPDATE enterprs SET DateCreate=?, KeyName=?, FullName=?, Region=?, OPForm=?, FormVlasn=?, VidDijal=?, StatutSize=?, AddressDeUre=?, AddressDeFacto=?, Phones=?, Faxes=?, RosRah=?, RosUst=?, RosMFO=?, AfilEnterp=?, AddInfo=?, Shevron=?, Podatok=?, StateRisk=?, byUserId=? WHERE Id=?",
    [convertDateToISO(req.body.dateCreate), req.body.keyName, req.body.fullName, req.body.region,
    req.body.opForm, req.body.formVlasn, req.body.vidDijal, req.body.statutSize, req.body.addressDeUre,
    req.body.addressDeFacto, req.body.phones, req.body.faxes, req.body.rosRah, req.body.rosUst,
    req.body.rosMFO, req.body.afilEnterp, req.body.addInfo, req.body.shevron, req.body.podatok,
    req.body.stateRisk, req.body.editor, req.body.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося оновити дані про юридичну особу!", error: err });
      res.status(200).json("Зміни даних про юридичну особу збережено успішно!");
    }
  );
  db.end();
};

const getAfilEnterprs = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT Id, Ident, KeyName, FullName, Shevron FROM enterprs WHERE Id IN (" + req.body.list + ") ORDER BY KeyName",
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося отримати дані про афільовані підприємства" });
      res.json(results);
    }
  );
  db.end();
};

const getFounders = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM peoples p, p_founds f WHERE f.HumanId=p.Id AND f.Enterprise=? ORDER BY p.Name",
    req.params.id, (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося отримати дані про засновників підприємства" });
      res.json(results);
    }
  );
  db.end();
};

const getFoundersE = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM enterp_f WHERE EnterpriseId=? ORDER BY DateEnter",
    req.params.id, (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося отримати дані про засновників підприємства" });
      res.json(results);
    }
  );
  db.end();
};

const getHeads = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM peoples p, p_heads h WHERE h.HumanId=p.Id AND h.Enterprise=? ORDER BY DateStartWork,Name",
    req.params.id, (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося отримати дані про керівників підприємства" });
      res.json(results);
    }
  );
  db.end();
};

const getOrders = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT *, (SELECT Name FROM peoples WHERE Id=o.HumanId) AS Name FROM orders o WHERE o.EnterpriseId=? ORDER BY o.DateZajav, o.NumZajav",
    req.params.id, (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося отримати дані про заяви підприємства" });
      res.json(results);
    }
  );
  db.end();
};

const getLicenses = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM lic_type t, licenze l WHERE l.TypeLicenze=t.Id AND l.EnterpriseId=? ORDER BY l.DateLicenz, t.Category",
    req.params.id, (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося отримати дані про ліцензії підприємства" });
      res.json(results);
    }
  );
  db.end();
};

const getChecks = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM checks WHERE EnterpriseId=? ORDER BY StartCheckDate", req.params.id,
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося отримати дані про перевірки підприємства" });
      res.json(results);
    }
  );
  db.end();
};

const getSameIdent = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM enterprs WHERE Ident=?", req.params.ident,
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося отримати дані про фізичних осіб з таким же кодом ЄДРПОУ" });
      res.json(results);
    }
  );
  db.end();
};

const insertNewOrder = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("INSERT INTO orders(EnterpriseId, OrderType, DateZajav, HumanId, NumZajav, Category, Options, byUserId) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
    [req.body.enterprId, req.body.orderType, convertDateToISO(req.body.dateZajav),
    req.body.humanId, req.body.numZajav, req.body.category, req.body.options, req.body.editor],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося зберегти дані про нову заяву!", error: err });
      res.status(200).json("Дані про нову заяву юридичної особи збережено успішно!");
    }
  );
  db.end();
};

const updateOrder = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("UPDATE orders SET OrderType=?, DateZajav=?, HumanId=?, NumZajav=?, Category=?, Options=?, byUserId=? WHERE Id=?",
    [req.body.orderType, convertDateToISO(req.body.dateZajav), req.body.humanId,
    req.body.numZajav, req.body.category, req.body.options, req.body.editor, req.body.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося оновити дані про заяву!", error: err });
      res.status(200).json("Зміни даних про заяву збережено успішно!");
    }
  );
  db.end();
};

const closeOrder = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("UPDATE orders SET State=?, Options=?, byUserId=? WHERE Id=?",
    [req.body.state, req.body.options, req.body.editor, req.body.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося оновити дані про заяву!", error: err });
      res.status(200).json("Зміна статусу заяви збережена успішно!");
    }
  );
  db.end();
};

const insertNewLicense = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("INSERT INTO licenze(EnterpriseId, TypeLicenze, SerLicenze, NumLicenze, DateLicenz, DateClose, ReasonStart, byUserId) VALUES(?, ?, ?, ?, ?, ?, ?, ?)",
    [req.body.enterpriseId, req.body.typeLicenze, req.body.serLicenze, req.body.numLicenze,
    convertDateToISO(req.body.dateLicenze), convertDateToISO(req.body.dateClose),
    req.body.reasonStart, req.body.editor],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося зберегти дані про нову ліцензію!", error: err });
      res.status(200).json("Дані про нову ліцензію для юридичної особи збережено успішно!");
    }
  );
  db.end();
};

const updateLicense = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("UPDATE licenze SET TypeLicenze=?, SerLicenze=?, NumLicenze=?, DateLicenz=?, DateClose=?, State=?, ReasonStart=?, ReasonClose=?, byUserId=? WHERE Id=?",
    [req.body.typeLicenze, req.body.serLicenze, req.body.numLicenze,
    convertDateToISO(req.body.dateLicenz), convertDateToISO(req.body.dateClose),
    req.body.state, req.body.reasonStart, req.body.reasonClose, req.body.editor, req.body.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося змінити дані про ліцензію!", error: err });
      res.status(200).json("Дані про ліцензію для юридичної особи змінено успішно!");
    }
  );
  db.end();
};

const updateLicenseState = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("UPDATE licenze SET State=?, ReasonClose=?, byUserId=? WHERE Id=?",
    [req.body.state, req.body.reasonClose, req.body.editor, req.body.id],
    (err, results) => {
      if (err)
        return res.status(500).json({ message: "Не вдалося змінити статус ліцензії!", error: err });
      res.status(200).json("Статус ліцензії для юридичної особи змінено успішно!");
    }
  );
  db.end();
};

const insertNewCheck = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("INSERT INTO checks(EnterpriseID, CheckSertificateDate, CheckSertificateNo, CheckType, StartCheckDate, EndCheckDate, CheckActNo, Checker, CheckObjCount, NoViolations, LicUmov, P211, P212, P213, P214, P215, P221, P222, P223, P224, P225, P226, P31, P32, P33, P34, P35, P44, P451, P452, P453, P456, P461, P462, P463, P464, P471, P472, P473, P474, P475, P476, P477, P478, N429, N4210, N4211, N4212, N4213, N4214, N4215, N4216, N4217, Content, CheckRozporDate, CheckRozporNo, CheckRozporDateAnswer, byUserId) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [req.body.enterprId, convertDateToISO(req.body.checkSertifDate), req.body.checkSertifNo, req.body.checkType,
      convertDateToISO(req.body.checkDateStart), convertDateToISO(req.body.checkDateEnd),
      req.body.checkActNo, req.body.checker, req.body.checkObjCount, req.body.noViolations,
      req.body.licUmov, req.body.p211, req.body.p212, req.body.p213, req.body.p214, req.body.p215,
      req.body.p221, req.body.p222, req.body.p223, req.body.p224, req.body.p225, req.body.p226,
      req.body.p31, req.body.p32, req.body.p33, req.body.p34, req.body.p35, req.body.p44,
      req.body.p451, req.body.p452, req.body.p453, req.body.p456, req.body.p461, req.body.p462,
      req.body.p463, req.body.p464, req.body.p471, req.body.p472, req.body.p473, req.body.p474,
      req.body.p475, req.body.p476, req.body.p477, req.body.p478, req.body.n429, req.body.n4210,
      req.body.n4211, req.body.n4212, req.body.n4213, req.body.n4214, req.body.n4215, req.body.n4216,
      req.body.n4217, req.body.content, convertDateToISO(req.body.checkRozporDate), req.body.checkRozporNo,
      convertDateToISO(req.body.checkRozporDateAnswer), req.body.editor],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося зберегти дані про нову перевірку!", error: err });
      res.status(200).json("Дані про нову перевірку юридичної особи збережено успішно!");
    }
  );
  db.end();
};

const updateCheck = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("UPDATE checks SET CheckSertificateDate=?, CheckSertificateNo=?, CheckType=?, StartCheckDate=?, EndCheckDate=?, CheckActNo=?, Checker=?, CheckObjCount=?, NoViolations=?, LicUmov=?, P211=?, P212=?, P213=?, P214=?, P215=?, P221=?, P222=?, P223=?, P224=?, P225=?, P226=?, P31=?, P32=?, P33=?, P34=?, P35=?, P44=?, P451=?, P452=?, P453=?, P456=?, P461=?, P462=?, P463=?, P464=?, P471=?, P472=?, P473=?, P474=?, P475=?, P476=?, P477=?, P478=?, N429=?, N4210=?, N4211=?, N4212=?, N4213=?, N4214=?, N4215=?, N4216=?, N4217=?, Content=?, CheckRozporDate=?, CheckRozporNo=?, CheckRozporDateAnswer=?, byUserId=? WHERE Id=?",
    [convertDateToISO(req.body.checkSertifDate), req.body.checkSertifNo, req.body.checkType,
    convertDateToISO(req.body.checkDateStart), convertDateToISO(req.body.checkDateEnd),
    req.body.checkActNo, req.body.checker, req.body.checkObjCount, req.body.noViolations,
    req.body.licUmov, req.body.p211, req.body.p212, req.body.p213, req.body.p214, req.body.p215,
    req.body.p221, req.body.p222, req.body.p223, req.body.p224, req.body.p225, req.body.p226,
    req.body.p31, req.body.p32, req.body.p33, req.body.p34, req.body.p35, req.body.p44,
    req.body.p451, req.body.p452, req.body.p453, req.body.p456, req.body.p461, req.body.p462,
    req.body.p463, req.body.p464, req.body.p471, req.body.p472, req.body.p473, req.body.p474,
    req.body.p475, req.body.p476, req.body.p477, req.body.p478, req.body.n429, req.body.n4210,
    req.body.n4211, req.body.n4212, req.body.n4213, req.body.n4214, req.body.n4215, req.body.n4216,
    req.body.n4217, req.body.content, convertDateToISO(req.body.checkRozporDate), req.body.checkRozporNo,
    convertDateToISO(req.body.checkRozporDateAnswer), req.body.editor, req.body.id],
    (err, results) => {
      if (err) return res.status(500).json({ message: "Не вдалося змінити дані про перевірку!", error: err });
      res.status(200).json("Дані про перевірку юридичної особи змінено успішно!");
    }
  );
  db.end();
};

const getRegions = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM region", (err, results) => {
    if (err) return res.status(500).json({ message: "Не вдалося отримати дані про регіони України" });
    res.json(results);
  });
  db.end();
};

const getOPForms = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM opforms ORDER BY Name", (err, results) => {
    if (err) return res.status(500).json({
      message: "Не вдалося отримати дані про організаційно-правові форми юридичних осіб",
    });
    res.json(results);
  });
  db.end();
};

const getFormVlasn = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM formvlsn", (err, results) => {
    if (err) return res.status(500).json({
      message: "Не вдалося отримати дані про форми власності юридичних осіб",
    });
    res.json(results);
  });
  db.end();
};

const getActivities = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM viddijal ORDER BY Name", (err, results) => {
    if (err) return res.status(500).json({
      message: "Не вдалося отримати дані про види діяльності юридичних осіб",
    });
    res.json(results);
  });
  db.end();
};

const getLicTypes = (req, res) => {
  const db = mysql2.createConnection(connData);
  db.query("SELECT * FROM lic_type", (err, results) => {
    if (err) return res.status(500).json({ message: "Не вдалося отримати дані про типи ліцензій" });
    res.json(results);
  });
  db.end();
};

module.exports = {
  getSome, getEnterprNames, getOneShort, getOneFull, insertNewEnterpr, updateEnterpr,
  getAfilEnterprs, getFounders, getFoundersE, getHeads, getOrders, getLicenses, getChecks,
  getSameIdent, insertNewOrder, updateOrder, closeOrder, insertNewLicense, updateLicense,
  updateLicenseState, insertNewCheck, updateCheck, getRegions, getOPForms, getFormVlasn, getActivities, getLicTypes
};
