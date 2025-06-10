import mysql from "mysql";
import dotenv from "dotenv";

var dbconn=mysql.createConnection({
host: process.env.DB_HOST,
user: process.env.DB_USER,
password: process.env.DB_PASSWORD,
database: process.env.DB_NAME,

})

dbconn.connect((err) => {
  if (err) {
    console.error("Error connecting to the database:", err);
  } else {
    console.log("Connected to the database successfully.");
  }
})

module.exports = dbconn;