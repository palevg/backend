import db from "./config.js";

export const getAll = (req, res) => {
  db.query("SELECT * FROM peoples", (err, results) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані' });
    res.json(results);
  });
};

export const getOne = (req, res) => {
  const id = req.params.id;
  let fullInfo;
  db.query("SELECT * FROM peoples WHERE Id=?", id, (err, results, fields) => {
    if (err) return res.status(500).json({ message: 'Не вдалося отримати дані про особу' });
    results.map((item) => { item.res_key = 0; });
    fullInfo = results;
  });
  db.query("SELECT p.Id,f.*,e.FullName FROM peoples p, p_founds f, enterprs e WHERE p.Id=f.HumanId AND e.Id=f.Enterprise AND p.Id=? ORDER BY f.DateEnter", id, (err, results) => {
    results.map((item) => {
      if (!item.res_key) item.res_key = 1;
    });
    fullInfo = [...fullInfo, ...results];
  });
  db.query("SELECT p.Id,h.*,e.FullName FROM peoples p, p_heads h, enterprs e WHERE p.Id=h.HumanId AND e.Id=h.Enterprise AND p.Id=? ORDER BY h.DateStartWork", id, (err, results) => {
    results.map((item) => {
      if (!item.res_key) item.res_key = 2;
    });
    fullInfo = [...fullInfo, ...results];
  });
  db.query("SELECT p.Id,s.*,e.FullName FROM peoples p, p_sequr s, enterprs e WHERE p.Id=s.HumanId AND e.Id=s.Enterprise AND p.Id=?", id, (err, results) => {
    results.map((item) => {
      if (!item.res_key) item.res_key = 3;
    });
    fullInfo = [...fullInfo, ...results];
    res.json(fullInfo);
  });
  // db.end();
};