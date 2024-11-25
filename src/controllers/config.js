export const connData = {
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  dateStrings: true
}

// db.connect((err) => {
//   console.log('DB connected');
//   if (err) return console.error("Помилка: " + err.message);
// });

// module.exports = connData;