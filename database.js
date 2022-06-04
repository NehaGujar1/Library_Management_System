const mysql=require('mysql');
require('dotenv').config();
module.exports=mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.pwd,
    database: process.env.db,
    port:process.env.port,
  });