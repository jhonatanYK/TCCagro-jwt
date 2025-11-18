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
    let { client_id, serviceName, location, description, machine_ids, start_times, hourly_rates } = req.body;
    
    // Validação de endereço/localidade
    if (!location || location.trim() === '') {
      const Client = require('../models/Client');
      const Machine = require('../models/Machine');
      const clients = await Client.findAll({ 
        where: { user_id: req.userId },
        order: [['name', 'ASC']]
      });
      const machines = await Machine.findAll({ 
        where: { user_id: req.userId },
        order: [['name', 'ASC']]
      });
      
      return res.render('tasks/nova', { 
        clients, 
        machines,
        error: 'O campo Endereço/Localidade é obrigatório!'
      });
    }
    
    // Garante que machine_ids seja sempre um array
    if (!machine_ids) {
      machine_ids = [];
    } else if (!Array.isArray(machine_ids)) {
      machine_ids = [machine_ids];
    }

    // Garante que start_times seja sempre um array
    if (!start_times) {
      start_times = [];
    } else if (!Array.isArray(start_times)) {
      start_times = [start_times];
    }

    // Garante que hourly_rates seja sempre um array
    if (!hourly_rates) {
      hourly_rates = [];
    } else if (!Array.isArray(hourly_rates)) {
      hourly_rates = [hourly_rates];
    }
    
    // Validação 1: Verifica se há máquinas duplicadas no mesmo serviço
    const uniqueMachineIds = machine_ids.filter(id => id); // Remove valores vazios
    const hasDuplicates = uniqueMachineIds.length !== new Set(uniqueMachineIds).size;
    
    if (hasDuplicates) {
      const Client = require('../models/Client');
      const Machine = require('../models/Machine');
      const clients = await Client.findAll({ 
        where: { user_id: req.userId },
        order: [['name', 'ASC']]
      });
      const machines = await Machine.findAll({ 
        where: { user_id: req.userId },
        order: [['name', 'ASC']]
      });
      
      return res.render('tasks/nova', { 
        clients, 
        machines,
        error: 'Não é possível adicionar a mesma máquina mais de uma vez no mesmo serviço!'
      });
    }
    
    // Validação 2: Verifica se alguma máquina já está em uso em serviço não finalizado
    const TaskMachine = require('../models/TaskMachine');
    const Machine = require('../models/Machine');
    const db = require('../db');
    
    for (let i = 0; i < machine_ids.length; i++) {
      if (machine_ids[i]) {
        // Busca máquinas em uso (sem endTime) em qualquer serviço do usuário
        const machinesInUse = await db.query(
          `SELECT tm.*, t.serviceName 
           FROM task_machines tm 
           INNER JOIN tasks t ON tm.task_id = t.id 
           WHERE tm.machine_id = ? 
           AND tm.endTime IS NULL 
           AND t.user_id = ?`,
          {
            replacements: [machine_ids[i], req.userId],
            type: db.Sequelize.QueryTypes.SELECT
          }
        );

        if (machinesInUse.length > 0) {
          // Busca o nome da máquina
          const machine = await Machine.findOne({
            where: { id: machine_ids[i], user_id: req.userId }
          });
          
          const machineName = machine ? machine.name : 'Máquina';
          const serviceName = machinesInUse[0].serviceName;
          
          // Renderiza novamente o formulário com mensagem de erro
          const Client = require('../models/Client');
          const clients = await Client.findAll({ 
            where: { user_id: req.userId },
            order: [['name', 'ASC']]
          });
          const machines = await Machine.findAll({ 
            where: { user_id: req.userId },
            order: [['name', 'ASC']]
          });
          
          return res.render('tasks/nova', { 
            clients, 
            machines,
            error: `A máquina "${machineName}" já está em uso no serviço "${serviceName}" que ainda não foi finalizado! Finalize o serviço atual antes de usar esta máquina.`
          });
        }
      }
    }
    
    // Cria o serviço principal
    const task = await Task.create({ 
      client_id: client_id || null,
      serviceName: serviceName || '',
      location: location || '',
      description: description || '',
      user_id: req.userId
    });

    // Adiciona as máquinas ao serviço
    for (let i = 0; i < machine_ids.length; i++) {
      if (machine_ids[i] && start_times[i]) {
        await TaskMachine.create({
          task_id: task.id,
          machine_id: machine_ids[i],
          startTime: parseFloat(start_times[i]) || 0,
          hourlyRate: parseFloat(hourly_rates[i]) || 0,
          endTime: null,
          hoursWorked: 0,
          totalAmount: 0
        });
      }
    }

    res.redirect('/tasks');
  } catch (error) {
    console.error('Erro ao criar serviço:', error);
    res.status(500).json({ error: 'Erro ao criar serviço: ' + error.message });
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
    
    // Validação de endereço/localidade (quando editando informações básicas)
    if (location !== undefined && (!location || location.trim() === '')) {
      const task = await Task.findOne({ 
        where: { id: req.params.id, user_id: req.userId },
        include: [{ model: Client, as: 'client' }]
      });
      
      if (!task) return res.status(404).send('Serviço não encontrado');
      
      const taskData = task.toJSON();
      const taskMachines = await TaskMachine.findAll({
        where: { task_id: task.id }
      });
      
      taskData.machines = [];
      for (const tm of taskMachines) {
        const machine = await Machine.findOne({
          where: { id: tm.machine_id, user_id: req.userId }
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
      
      return res.render('tasks/editar', { 
        task: taskData, 
        clients, 
        machines,
        error: 'O campo Endereço/Localidade é obrigatório!'
      });
    }
    
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

// Marca serviço como pago
const markAsPaid = async (req, res) => {
  try {
    await Task.update({ paid: true }, { where: { id: req.params.id, user_id: req.userId } });
    res.redirect('/tasks');
  } catch (error) {
    res.status(500).send({ error: 'Erro ao marcar como pago' });
  }
};

// Marca serviço como não pago
const markAsUnpaid = async (req, res) => {
  try {
    await Task.update({ paid: false }, { where: { id: req.params.id, user_id: req.userId } });
    res.redirect('/tasks');
  } catch (error) {
    res.status(500).send({ error: 'Erro ao marcar como não pago' });
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
  markAsPaid,
  markAsUnpaid,
  remove,
};
