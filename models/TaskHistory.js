const db = require('../db');

const TaskHistory = db.define('task_history', {
  task_id: {
    type: db.Sequelize.INTEGER,
    allowNull: true, // Permitir null para históricos antigos
  },
  serviceName: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  location: {
    type: db.Sequelize.STRING,
    allowNull: true,
  },
  locationNumber: {
    type: db.Sequelize.STRING,
    allowNull: true,
  },
  description: {
    type: db.Sequelize.TEXT,
    allowNull: true,
  },
  clientName: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  clientEmail: {
    type: db.Sequelize.STRING,
    allowNull: true,
  },
  paid: {
    type: db.Sequelize.BOOLEAN,
    defaultValue: false,
  },
  totalAmount: {
    type: db.Sequelize.FLOAT,
    defaultValue: 0,
  },
  service_date: {
    type: db.Sequelize.DATEONLY,
    allowNull: false,
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
  completedAt: {
    type: db.Sequelize.DATE,
    allowNull: false,
  },
}, {
  timestamps: true,
  tableName: 'task_histories'
});

module.exports = TaskHistory;
