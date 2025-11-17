const Task = require('../models/Task');
const User = require('../models/User');
const Client = require('../models/Client');
const Machine = require('../models/Machine');


// Renderiza lista de serviços
const renderList = async (req, res) => {
  try {
    const TaskMachine = require('../models/TaskMachine');
    
    const tasks = await Task.findAll({ 
      where: { user_id: req.userId },
      include: [
        { model: Client, as: 'client' }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Converte para array de objetos plain
    const tasksWithMachines = [];
    
    for (const task of tasks) {
      const taskData = task.toJSON();
      
      // Busca as máquinas associadas via TaskMachine
      const taskMachines = await TaskMachine.findAll({
        where: { task_id: task.id }
      });
      
      taskData.machines = [];
      for (const tm of taskMachines) {
        const machine = await Machine.findOne({
          where: {
            id: tm.machine_id,
            user_id: req.userId
          }
        });
        if (machine) {
          const machineData = machine.toJSON();
          machineData.task_machine = {
            id: tm.id,
            startTime: tm.startTime,
            endTime: tm.endTime,
            hoursWorked: tm.hoursWorked,
            totalAmount: tm.totalAmount,
            hourlyRate: tm.hourlyRate
          };
          taskData.machines.push(machineData);
        }
      }
      
      tasksWithMachines.push(taskData);
    }
    
    res.render('tasks/listar', { tasks: tasksWithMachines });
  } catch (error) {
    console.error('Erro ao buscar serviços:', error);
    res.status(500).send({ error: 'Erro ao buscar serviços: ' + error.message });
  }
};

// Renderiza formulário de novo serviço
const renderNew = async (req, res) => {
  try {
    const clients = await Client.findAll({ 
      where: { user_id: req.userId },
      order: [['name', 'ASC']] 
    });
    const machines = await Machine.findAll({ 
      where: { user_id: req.userId },
      order: [['name', 'ASC']] 
    });
    
    // Verifica se há clientes e máquinas cadastrados
    if (clients.length === 0 || machines.length === 0) {
      let message = '';
      if (clients.length === 0 && machines.length === 0) {
        message = 'Você precisa cadastrar pelo menos um cliente e uma máquina antes de criar um serviço.';
      } else if (clients.length === 0) {
        message = 'Você precisa cadastrar pelo menos um cliente antes de criar um serviço.';
      } else {
        message = 'Você precisa cadastrar pelo menos uma máquina antes de criar um serviço.';
      }
      return res.render('tasks/nova', { 
        clients, 
        machines, 
        error: message 
      });
    }
    
    res.render('tasks/nova', { clients, machines });
  } catch (error) {
    console.error('Erro ao carregar formulário:', error);
    res.status(500).send({ error: 'Erro ao carregar formulário' });
  }
};

// Cria novo serviço
const create = async (req, res) => {
  try {
    const { client_id, serviceName, location, description, machine_ids, start_times, hourly_rates } = req.body;
    
    // Cria o serviço principal
    const task = await Task.create({ 
      client_id, 
      serviceName, 
      location, 
      description, 
      user_id: req.userId
    });

    // Adiciona as máquinas ao serviço
    if (machine_ids && Array.isArray(machine_ids)) {
      const TaskMachine = require('../models/TaskMachine');
      
      for (let i = 0; i < machine_ids.length; i++) {
        if (machine_ids[i] && start_times[i]) {
          await TaskMachine.create({
            task_id: task.id,
            machine_id: machine_ids[i],
            startTime: start_times[i],
            hourlyRate: hourly_rates[i] || 0,
            endTime: null,
            hoursWorked: 0,
            totalAmount: 0
          });
        }
      }
    }

    res.redirect('/tasks');
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).send({ error: 'Erro ao criar serviço: ' + error.message });
  }
};

// Renderiza formulário de edição
const renderEdit = async (req, res) => {
  try {
    const Machine = require('../models/Machine');
    const TaskMachine = require('../models/TaskMachine');
    
    // Busca o serviço
    const task = await Task.findOne({ 
      where: { id: req.params.id, user_id: req.userId },
      include: [
        { model: Client, as: 'client' }
      ]
    });
    
    if (!task) return res.status(404).send('Serviço não encontrado');
    
    // Converte para objeto plain
    const taskData = task.toJSON();
    
    // Busca as máquinas associadas via TaskMachine
    const taskMachines = await TaskMachine.findAll({
      where: { task_id: task.id }
    });
    
    // Adiciona as máquinas ao objeto task
    taskData.machines = [];
    for (const tm of taskMachines) {
      const machine = await Machine.findOne({
        where: {
          id: tm.machine_id,
          user_id: req.userId
        }
      });
      if (machine) {
        const machineData = machine.toJSON();
        machineData.task_machine = {
          id: tm.id,
          startTime: tm.startTime,
          endTime: tm.endTime,
          hoursWorked: tm.hoursWorked,
          totalAmount: tm.totalAmount,
          hourlyRate: tm.hourlyRate
        };
        taskData.machines.push(machineData);
      }
    }
    
    const clients = await Client.findAll({ 
      where: { user_id: req.userId },
      order: [['name', 'ASC']] 
    });
    const machines = await Machine.findAll({ 
      where: { user_id: req.userId },
      order: [['name', 'ASC']] 
    });
    
    res.render('tasks/editar', { task: taskData, clients, machines });
  } catch (error) {
    console.error('Erro ao buscar serviço:', error);
    res.status(500).send({ error: 'Erro ao buscar serviço: ' + error.message });
  }
};

// Edita serviço
const edit = async (req, res) => {
  try {
    const { client_id, serviceName, location, description, machine_ids, end_times, task_machine_ids } = req.body;
    const TaskMachine = require('../models/TaskMachine');
    
    // Atualiza o serviço principal
    await Task.update(
      { client_id, serviceName, location, description }, 
      { where: { id: req.params.id, user_id: req.userId } }
    );

    // Atualiza os horímetros finais das máquinas
    if (task_machine_ids && Array.isArray(task_machine_ids)) {
      for (let i = 0; i < task_machine_ids.length; i++) {
        if (task_machine_ids[i] && end_times && end_times[i]) {
          const taskMachine = await TaskMachine.findByPk(task_machine_ids[i]);
          
          if (taskMachine) {
            const startTime = parseFloat(taskMachine.startTime) || 0;
            const endTime = parseFloat(end_times[i]) || 0;
            const hourlyRate = parseFloat(taskMachine.hourlyRate) || 0;
            
            const hoursWorked = endTime - startTime;
            const totalAmount = hoursWorked * hourlyRate;
            
            await TaskMachine.update(
              { 
                endTime: end_times[i],
                hoursWorked: hoursWorked > 0 ? hoursWorked : 0,
                totalAmount: totalAmount > 0 ? totalAmount : 0
              },
              { where: { id: task_machine_ids[i] } }
            );
          }
        }
      }
    }

    res.redirect('/tasks');
  } catch (error) {
    console.error('Erro ao editar serviço:', error);
    res.status(500).send({ error: 'Erro ao editar serviço: ' + error.message });
  }
};

// Completa serviço
const complete = async (req, res) => {
  try {
    await Task.update({ completed: true }, { where: { id: req.params.id, user_id: req.userId } });
    res.redirect('/tasks');
  } catch (error) {
    res.status(500).send({ error: 'Erro ao completar serviço' });
  }
};

// Exclui serviço
const remove = async (req, res) => {
  try {
    const TaskMachine = require('../models/TaskMachine');
    
    // Primeiro deleta as máquinas associadas
    await TaskMachine.destroy({ where: { task_id: req.params.id } });
    
    // Depois deleta o serviço
    await Task.destroy({ where: { id: req.params.id, user_id: req.userId } });
    
    res.redirect('/tasks');
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    res.status(500).send({ error: 'Erro ao excluir serviço: ' + error.message });
  }
};

module.exports = {
  renderList,
  renderNew,
  create,
  renderEdit,
  edit,
  complete,
  remove,
};
