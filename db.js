const sequelize = require('sequelize');
const db = new sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite',
});
module.exports = db;