import mysqlpro from "mysql2/promise";
import { connData } from "./config.js";

export async function GetFromTable(res, sql, params, localRes, errMsg) {
  const db = await mysqlpro.createConnection(connData);
  try {
    const [result] = await db.query(sql, params);
    if (localRes) return result
    else res.json(result);
  } catch (err) {
    res.status(500).json({ message: errMsg, error: err });
  }
  db.end();
}

export async function InsertIntoTable(db, tableName, values, valueMap) {
  const FieldsToSave = Object.entries(values).filter(([key]) => { return key in valueMap });
  const sqlColumns = `(${FieldsToSave.map(([key]) => `${valueMap[key]}`).join(', ')})`;
  const sqlValuePlaceHolders = `VALUES (${FieldsToSave.map(() => `?`).join(', ')})`;
  const sql = `INSERT INTO ${tableName} ${sqlColumns} ${sqlValuePlaceHolders}`;
  const sqlParams = [];
  FieldsToSave.forEach(([key, value]) => sqlParams.push(value));
  try {
    const [resQuery] = await db.query(sql, sqlParams);
    return resQuery;
  } catch (err) {
    res.status(500).json({ message: "Помилка додавання запису до бази даних!", error: err });
  }
}

export async function UpdateTableRow(db, tableName, values, valueMap) {
  const FieldsToSave = Object.fromEntries(Object.entries(values).filter(([key]) => { return key in valueMap }));
  const sqlValuePlaceHolders = Object.keys(FieldsToSave).map((m) => { return `${valueMap[m]}=?` }).join(', ');
  const sql = `UPDATE ${tableName} SET ${sqlValuePlaceHolders} WHERE Id=${values[valueMap.PrKey]}`
  const sqlParams = [];
  Object.entries(FieldsToSave).forEach(([key, value]) => sqlParams.push(value));
  try {
    const [resQuery] = await db.query(sql, sqlParams);
    return resQuery;
  } catch (err) {
    res.status(500).json({ message: "Помилка оновлення даних!", error: err });
  }
}

export function DataCombine(result, flag, acc) {
  result.map(item => { if (!item.res_key) item.res_key = flag; });
  return [...acc, ...result];
}

export const Msg = {
  update: "Зміни даних про ",
  saved: " збережено успішно!",
  updated: " оновлено успішно!",
  new_data: "Дані про нов",
  err: "Не вдалося ",
  ins_err: "зберегти дані про нов",
  upd_err: "оновити дані про ",
  get_err: "отримати дані про ",
  not_found: "не знайден",
  yur_os: "юридичної особи",
  yur_os1: "Юридична особа",
  yur_os2: "юридичну особу",
  yur_os3: "юридичних осіб",
  founder: "співзасновник",
  head: "керівник",
  employee: "працівника персоналу охорони",
  human: "особу",
  state: "Статус ",
  user: "Користувач",
  profile: "Профіль",
  session: "сеанс роботи",
  lic: "ліцензі",
  check: "перевірк"
}