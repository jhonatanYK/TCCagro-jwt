const db = require('../db');

const Client = db.define('client', {
  name: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  email: {
    type: db.Sequelize.STRING,
    allowNull: true,
  },
  phone: {
    type: db.Sequelize.STRING,
    allowNull: true,
  },
  address: {
    type: db.Sequelize.STRING,
    allowNull: true,
  },
  notes: {
    type: db.Sequelize.TEXT,
    allowNull: true,
  },
  user_id: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
}, {
  indexes: [
    {
      fields: ['user_id']
    },
    {
      unique: true,
      fields: ['user_id', 'name']
    }
  ]
});

module.exports = Client;
