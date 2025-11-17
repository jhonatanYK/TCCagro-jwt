const db = require('../db');
const User = require('./User');
const Client = require('./Client');

const Task = db.define('task', {
  serviceName: {
    type: db.Sequelize.STRING,
    allowNull: false,
  },
  location: {
    type: db.Sequelize.STRING,
    allowNull: true,
  },
  description: {
    type: db.Sequelize.TEXT,
    allowNull: true,
  },
  completed: {
    type: db.Sequelize.BOOLEAN,
    defaultValue: false,
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
      fields: ['user_id', 'client_id']
    }
  ]
});

Task.belongsTo(User, { foreignKey: 'user_id' });
Task.belongsTo(Client, { foreignKey: 'client_id', as: 'client' });

module.exports = Task;
