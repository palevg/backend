import mysql2 from 'mysql2';

const db = mysql2.createConnection({
  host: "192.168.0.70",
  user: "monah",
  password: null,
  database: "license"
});

db.connect((err) => {
  if (err) return console.error("Ошибка: " + err.message);
});

export default db;