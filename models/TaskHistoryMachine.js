const db = require('../db');

const TaskHistoryMachine = db.define('task_history_machine', {
  history_id: {
    type: db.Sequelize.INTEGER,
    allowNull: false,
    references: {
      model: 'task_histories',
      key: 'id'
    },
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE'
  },
  machineName: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  machineType: {
    type: db.Sequelize.STRING,
    allowNull: true,
  },
  startTime: {
    type: db.Sequelize.FLOAT,
    allowNull: false,
  },
  endTime: {
    type: db.Sequelize.FLOAT,
    allowNull: false,
  },
  hoursWorked: {
    type: db.Sequelize.FLOAT,
    defaultValue: 0,
  },
  hourlyRate: {
    type: db.Sequelize.FLOAT,
    defaultValue: 0,
  },
  totalAmount: {
    type: db.Sequelize.FLOAT,
    defaultValue: 0,
  },
}, {
  timestamps: false,
  tableName: 'task_history_machines'
});

module.exports = TaskHistoryMachine;
