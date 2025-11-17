const { DataTypes } = require('sequelize');
const db = require('../db');

const Machine = db.define('Machine', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING, // Trator, Pá Carregadeira, Retroescavadeira, etc.
    allowNull: false,
  },
  hourlyRate: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  plate: {
    type: DataTypes.STRING, // Placa do veículo
  },
  user_id: {
    type: DataTypes.INTEGER,
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

module.exports = Machine;
