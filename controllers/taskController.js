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
    
    // IDs das tasks para buscar machines de uma vez
    const taskIds = tasks.map(t => t.id);
    
    // Busca todas as relações TaskMachine de uma vez
    const allTaskMachines = await TaskMachine.findAll({
      where: { task_id: taskIds }
    });
    
    // Busca IDs únicos de máquinas
    const machineIds = [...new Set(allTaskMachines.map(tm => tm.machine_id))];
    
    // Busca todas as máquinas de uma vez
    const allMachines = await Machine.findAll({
      where: {
        id: machineIds,
        user_id: req.userId
      }
    });
    
    // Cria mapa para acesso rápido
    const machinesMap = {};
    allMachines.forEach(m => {
      machinesMap[m.id] = m.toJSON();
    });
    
    // Monta estrutura final
    const tasksWithMachines = tasks.map(task => {
      const taskData = task.toJSON();
      
      // Filtra TaskMachines desta task
      const taskMachines = allTaskMachines.filter(tm => tm.task_id === task.id);
      
      taskData.machines = taskMachines.map(tm => {
        const machine = machinesMap[tm.machine_id];
        if (machine) {
          return {
            ...machine,
            task_machine: {
              id: tm.id,
              startTime: tm.startTime,
              endTime: tm.endTime,
              hoursWorked: tm.hoursWorked,
              totalAmount: tm.totalAmount,
              hourlyRate: tm.hourlyRate
            }
          };
        }
      }).filter(Boolean);
      
      return taskData;
    });
    
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
    let { client_id, serviceName, service_date, location, locationNumber, description, machine_ids, start_times, hourly_rates } = req.body;
    
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
    
    // Validação de número obrigatório
    if (!locationNumber || locationNumber.trim() === '') {
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
        error: 'O campo Número é obrigatório!'
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
    // Formata a data para evitar problemas de timezone
    let formattedDate = service_date;
    if (service_date) {
      // Se a data vier no formato YYYY-MM-DD, usa diretamente
      formattedDate = service_date.split('T')[0]; // Remove parte de hora se existir
    }
    
    const task = await Task.create({ 
      client_id: client_id || null,
      serviceName: serviceName || '',
      service_date: formattedDate,
      location: location || '',
      locationNumber: locationNumber || '',
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
    console.error('Detalhes:', error.message);
    console.error('Stack:', error.stack);
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
    const { client_id, serviceName, service_date, location, locationNumber, description, machine_ids, end_times, task_machine_ids } = req.body;
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
    
    // Validação de número obrigatório (quando editando informações básicas)
    if (locationNumber !== undefined && (!locationNumber || locationNumber.trim() === '')) {
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
        error: 'O campo Número é obrigatório!'
      });
    }
    
    // Atualiza o serviço principal
    // Formata a data para evitar problemas de timezone
    let formattedDate = service_date;
    if (service_date) {
      formattedDate = service_date.split('T')[0]; // Remove parte de hora se existir
    }
    
    await Task.update(
      { client_id, serviceName, service_date: formattedDate, location, locationNumber, description }, 
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
            
            // Validação: não permite hora final igual a 0
            if (endTime === 0 || end_times[i].trim() === '' || end_times[i].trim() === '0') {
              return res.status(400).send('Erro: A hora final não pode ser 0 ou vazia!');
            }
            
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
      
      // Verifica se TODAS as máquinas do serviço foram finalizadas
      const allTaskMachines = await TaskMachine.findAll({
        where: { task_id: req.params.id },
        raw: true
      });
      
      // Verifica se todas as máquinas têm endTime preenchido
      const allFinished = allTaskMachines.length > 0 && allTaskMachines.every(tm => {
        return tm.endTime !== null && tm.endTime !== '' && parseFloat(tm.endTime) > 0;
      });
      
      // Se todas as máquinas foram finalizadas, salva no histórico
      if (allFinished) {
        
        // Marca como completo
        await Task.update(
          { completed: true },
          { where: { id: req.params.id, user_id: req.userId } }
        );
        
        // Salva no histórico independente
        const TaskHistory = require('../models/TaskHistory');
        const TaskHistoryMachine = require('../models/TaskHistoryMachine');
        
        // Busca dados completos do serviço
        const task = await Task.findByPk(req.params.id, {
          include: [{ model: Client, as: 'client' }]
        });
        
        // Calcula total do serviço
        let totalService = 0;
        allTaskMachines.forEach(tm => {
          totalService += parseFloat(tm.totalAmount || 0);
        });
        
        // Cria registro no histórico
        const history = await TaskHistory.create({
          task_id: task.id,
          serviceName: task.serviceName,
          service_date: task.service_date,
          location: task.location,
          locationNumber: task.locationNumber,
          description: task.description,
          clientName: task.client.name,
          clientEmail: task.client.email || '',
          paid: task.paid || false,
          totalAmount: totalService,
          user_id: req.userId,
          completedAt: new Date()
        });
        
        // Salva máquinas do histórico
        for (const tm of allTaskMachines) {
          const machine = await Machine.findByPk(tm.machine_id);
          if (machine) {
            await TaskHistoryMachine.create({
              history_id: history.id,
              machineName: machine.name,
              machineType: machine.type,
              startTime: tm.startTime,
              endTime: tm.endTime,
              hoursWorked: tm.hoursWorked,
              hourlyRate: tm.hourlyRate,
              totalAmount: tm.totalAmount
            });
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

// Marca serviço como pago
const markAsPaid = async (req, res) => {
  try {
    const TaskHistory = require('../models/TaskHistory');
    
    // Atualiza na tabela principal
    await Task.update({ paid: true }, { where: { id: req.params.id, user_id: req.userId } });
    
    // Atualiza no histórico usando task_id
    await TaskHistory.update(
      { paid: true },
      { 
        where: { 
          task_id: req.params.id,
          user_id: req.userId 
        } 
      }
    );
    
    res.redirect('/tasks');
  } catch (error) {
    res.status(500).send({ error: 'Erro ao marcar como pago' });
  }
};

// Marca serviço como não pago
const markAsUnpaid = async (req, res) => {
  try {
    const TaskHistory = require('../models/TaskHistory');
    
    // Atualiza na tabela principal
    await Task.update({ paid: false }, { where: { id: req.params.id, user_id: req.userId } });
    
    // Atualiza no histórico usando task_id
    await TaskHistory.update(
      { paid: false },
      { 
        where: { 
          task_id: req.params.id,
          user_id: req.userId 
        } 
      }
    );
    
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

// Renderiza histórico de serviços finalizados
const renderHistory = async (req, res) => {
  try {
    const TaskHistory = require('../models/TaskHistory');
    const TaskHistoryMachine = require('../models/TaskHistoryMachine');
    const { Op } = require('sequelize');
    
    // Pega os filtros da query string
    const clientFilter = req.query.client || '';
    const startDate = req.query.startDate || '';
    const endDate = req.query.endDate || '';
    
    // Paginação
    const page = parseInt(req.query.page) || 1;
    const limit = 10; // 10 serviços por página
    const offset = (page - 1) * limit;
    
    // Busca todos os clientes únicos do histórico para o filtro
    const allHistories = await TaskHistory.findAll({
      where: { user_id: req.userId },
      attributes: ['clientName'],
      group: ['clientName'],
      order: [['clientName', 'ASC']]
    });
    
    const clients = allHistories && allHistories.length > 0 
      ? allHistories.map(h => ({ clientName: h.clientName }))
      : [];
    
    // Monta a query com filtros opcionais
    const whereClause = { user_id: req.userId };
    
    if (clientFilter) {
      whereClause.clientName = clientFilter;
    }
    
    // Filtro de data
    if (startDate || endDate) {
      whereClause.service_date = {};
      
      if (startDate) {
        whereClause.service_date[Op.gte] = startDate;
      }
      
      if (endDate) {
        whereClause.service_date[Op.lte] = endDate;
      }
    }
    
    // Conta total de registros para paginação
    const totalCount = await TaskHistory.count({ where: whereClause });
    const totalPages = Math.ceil(totalCount / limit);
    
    // Busca histórico com filtro e paginação
    const histories = await TaskHistory.findAll({ 
      where: whereClause,
      order: [['completedAt', 'DESC']],
      limit: limit,
      offset: offset
    });
    
    // Busca todas as máquinas dos históricos de uma vez
    const historyIds = histories.map(h => h.id);
    const allHistoryMachines = await TaskHistoryMachine.findAll({
      where: { history_id: historyIds }
    });
    
    // Agrupa máquinas por history_id
    const machinesByHistory = {};
    allHistoryMachines.forEach(hm => {
      if (!machinesByHistory[hm.history_id]) {
        machinesByHistory[hm.history_id] = [];
      }
      machinesByHistory[hm.history_id].push(hm);
    });
    
    // Converte para formato esperado pela view
    const tasksWithMachines = histories.map(history => {
      const historyData = history.toJSON();
      
      // Cria objeto cliente fake para manter compatibilidade com a view
      historyData.client = {
        name: historyData.clientName,
        email: historyData.clientEmail
      };
      
      // Busca máquinas do histórico do mapa
      const historyMachines = machinesByHistory[history.id] || [];
      
      historyData.machines = historyMachines.map(hm => {
        return {
          name: hm.machineName,
          type: hm.machineType,
          task_machine: {
            startTime: hm.startTime,
            endTime: hm.endTime,
            hoursWorked: hm.hoursWorked,
            hourlyRate: hm.hourlyRate,
            totalAmount: hm.totalAmount
          }
        };
      });
      
      return historyData;
    });
    
    res.render('tasks/historico', { 
      tasks: tasksWithMachines,
      clients: clients,
      selectedClient: clientFilter,
      startDate: startDate,
      endDate: endDate,
      currentPage: page,
      totalPages: totalPages,
      totalCount: totalCount
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    res.status(500).send({ error: 'Erro ao buscar histórico: ' + error.message });
  }
};

// Gera PDF da ordem de serviço
const generatePDF = async (req, res) => {
  try {
    const PDFDocument = require('pdfkit');
    const TaskMachine = require('../models/TaskMachine');
    const TaskHistory = require('../models/TaskHistory');
    const TaskHistoryMachine = require('../models/TaskHistoryMachine');
    const Machine = require('../models/Machine');
    
    // Tenta buscar o serviço ativo primeiro
    let task = await Task.findOne({
      where: { id: req.params.id, user_id: req.userId },
      include: [{ model: Client, as: 'client' }]
    });

    let machines = [];
    let allFinished = true;
    let isFromHistory = false;

    if (task) {
      // Serviço ativo - busca as máquinas normalmente
      const taskMachines = await TaskMachine.findAll({
        where: { task_id: task.id }
      });
      
      for (const tm of taskMachines) {
        const machine = await Machine.findByPk(tm.machine_id);
        if (machine) {
          machines.push({
            machine: machine,
            taskMachine: tm
          });
          if (!tm.endTime) {
            allFinished = false;
          }
        }
      }
    } else {
      // Não encontrou em Task, busca no histórico
      const taskHistory = await TaskHistory.findOne({
        where: { task_id: req.params.id, user_id: req.userId }
      });

      if (!taskHistory) {
        return res.status(404).send('Serviço não encontrado');
      }

      isFromHistory = true;
      
      // Monta objeto task a partir do histórico
      task = {
        id: taskHistory.task_id,
        service_date: taskHistory.service_date,
        serviceName: taskHistory.serviceName,
        location: taskHistory.location,
        locationNumber: taskHistory.locationNumber,
        description: taskHistory.description,
        paid: taskHistory.paid,
        client: {
          name: taskHistory.clientName,
          email: taskHistory.clientEmail
        }
      };

      // Busca as máquinas do histórico
      const historyMachines = await TaskHistoryMachine.findAll({
        where: { history_id: taskHistory.id }
      });

      for (const hm of historyMachines) {
        machines.push({
          machine: {
            name: hm.machineName,
            type: hm.machineType
          },
          taskMachine: {
            startTime: hm.startTime,
            endTime: hm.endTime,
            hoursWorked: hm.hoursWorked,
            hourlyRate: hm.hourlyRate,
            totalAmount: hm.totalAmount
          }
        });
      }
      
      // Histórico sempre tem tudo finalizado
      allFinished = true;
    }

    // Impede geração de PDF se o serviço ainda não foi finalizado
    if (!allFinished || machines.length === 0) {
      return res.status(400).send('Não é possível gerar PDF de um serviço em andamento. Finalize todas as máquinas primeiro.');
    }

    // Cria o documento PDF
    const doc = new PDFDocument({ 
      margin: 50, 
      size: 'A4',
      autoFirstPage: true,
      bufferPages: true
    });

    // Define headers para download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=ordem-servico-${task.id}.pdf`);

    // Pipe o PDF para a resposta
    doc.pipe(res);

    // Cores
    const corPrimaria = '#0f766e'; // Teal 700
    const corSecundaria = '#134e4a'; // Teal 900
    const corTexto = '#1f2937'; // Gray 800

    // Cabeçalho com fundo colorido
    doc.rect(0, 0, 595.28, 120).fill(corPrimaria);
    
    // Título
    doc.fillColor('white')
       .fontSize(28)
       .font('Helvetica-Bold')
       .text('ORDEM DE SERVIÇO', 50, 40, { align: 'center' });
    
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Nº ${task.id.toString().padStart(6, '0')}`, { align: 'center' });
    
    // Data de emissão
    const hoje = new Date().toLocaleDateString('pt-BR');
    doc.fontSize(10)
       .text(`Emitido em: ${hoje}`, { align: 'center' });
    
    doc.fillColor(corTexto);
    doc.moveDown(3);

    // Box de informações do cliente
    const yCliente = 140;
    doc.roundedRect(50, yCliente, 495, 80, 5)
       .lineWidth(2)
       .strokeColor(corPrimaria)
       .stroke();
    
    doc.fillColor(corPrimaria)
       .fontSize(13)
       .font('Helvetica-Bold')
       .text('CLIENTE', 65, yCliente + 15);
    
    doc.fillColor(corTexto)
       .fontSize(11)
       .font('Helvetica')
       .text(`Nome: ${task.client ? task.client.name : '-'}`, 65, yCliente + 38);
    
    if (task.client && task.client.email) {
      doc.text(`E-mail: ${task.client.email}`, 65, yCliente + 55);
    }

    // Box de informações do serviço (altura dinâmica)
    const yServico = 240;
    let yTexto = yServico + 38;
    
    // Calcula a altura do conteúdo primeiro
    let linhasServico = 0;
    
    if (task.service_date) {
      linhasServico++;
    }
    
    linhasServico++; // Tipo de Serviço (sempre tem)
    
    if (task.location) {
      linhasServico++;
    }
    
    // Calcula altura da descrição (se houver)
    let alturaDescricao = 0;
    if (task.description) {
      const descricaoHeight = doc.heightOfString(task.description, { width: 465, fontSize: 11 });
      alturaDescricao = descricaoHeight;
    }
    
    // Altura total do box: padding top (38) + linhas fixas (17 cada) + descrição + padding bottom (15)
    const alturaBoxServico = 38 + (linhasServico * 17) + alturaDescricao + 15;
    
    // Desenha o box com altura dinâmica
    doc.roundedRect(50, yServico, 495, alturaBoxServico, 5)
       .lineWidth(2)
       .strokeColor(corPrimaria)
       .stroke();
    
    doc.fillColor(corPrimaria)
       .fontSize(13)
       .font('Helvetica-Bold')
       .text('DETALHES DO SERVIÇO', 65, yServico + 15);
    
    doc.fillColor(corTexto)
       .fontSize(11)
       .font('Helvetica');
    
    if (task.service_date) {
      const dateStr = task.service_date.split('T')[0].split('-').reverse().join('/');
      doc.text(`Data do Serviço: ${dateStr}`, 65, yTexto);
      yTexto += 17;
    }
    
    doc.text(`Tipo de Serviço: ${task.serviceName}`, 65, yTexto);
    yTexto += 17;
    
    if (task.location) {
      doc.text(`Local: ${task.location}${task.locationNumber ? ', Nº ' + task.locationNumber : ''}`, 65, yTexto);
      yTexto += 17;
    }
    
    if (task.description) {
      doc.text(`Descrição: ${task.description}`, 65, yTexto, { width: 465 });
      yTexto += alturaDescricao;
    }

    // Tabela de máquinas (posição dinâmica baseada no box anterior)
    let yTabela = yServico + alturaBoxServico + 20;
    doc.fillColor(corPrimaria)
       .fontSize(13)
       .font('Helvetica-Bold')
       .text('MÁQUINAS E VALORES', 50, yTabela);
    
    yTabela += 25;

    let totalGeral = 0;

    machines.forEach((item, index) => {
      const machine = item.machine;
      const tm = item.taskMachine;
      
      // Box para cada máquina com altura adequada
      const alturaBox = tm.endTime ? 145 : 95;
      
      // Verifica se precisa de nova página (margem de 100px do fim)
      if (yTabela + alturaBox > doc.page.height - 100) {
        doc.addPage();
        yTabela = 50; // Reset para o topo da nova página
        
        // Repete o título na nova página
        doc.fillColor(corPrimaria)
           .fontSize(13)
           .font('Helvetica-Bold')
           .text('MÁQUINAS E VALORES (continuação)', 50, yTabela);
        yTabela += 25;
      }
      
      // Desenha o fundo branco primeiro
      doc.roundedRect(50, yTabela, 495, alturaBox, 5)
         .fill('#ffffff');
      
      // Header da máquina (preenchido com azul claro)
      doc.roundedRect(50, yTabela, 495, 35, 5)
         .fill('#e0f2fe');
      
      doc.fillColor(corSecundaria)
         .fontSize(13)
         .font('Helvetica-Bold')
         .text(`${index + 1}. ${machine.name}`, 65, yTabela + 10);
      
      doc.fillColor('#64748b')
         .fontSize(11)
         .font('Helvetica-Oblique')
         .text(`${machine.type}`, 400, yTabela + 10);
      
      // Borda verde ao redor de tudo
      doc.roundedRect(50, yTabela, 495, alturaBox, 5)
         .lineWidth(1.5)
         .strokeColor(corPrimaria)
         .stroke();
      
      // Grid de informações
      let yInfo = yTabela + 48;
      
      // Linha 1: Valor/Hora e Horímetro Inicial
      doc.fillColor('#64748b')
         .fontSize(9)
         .font('Helvetica')
         .text('VALOR/HORA:', 65, yInfo);
      
      doc.fillColor(corTexto)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(`R$ ${parseFloat(tm.hourlyRate || 0).toFixed(2).replace('.', ',')}`, 65, yInfo + 13);
      
      doc.fillColor('#64748b')
         .fontSize(9)
         .font('Helvetica')
         .text('HORÍMETRO INICIAL:', 280, yInfo);
      
      doc.fillColor(corTexto)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(`${tm.startTime || '-'}`, 280, yInfo + 13);
      
      if (tm.endTime) {
        yInfo += 32;
        
        // Linha 2: Horímetro Final e Horas Trabalhadas
        doc.fillColor('#64748b')
           .fontSize(9)
           .font('Helvetica')
           .text('HORÍMETRO FINAL:', 65, yInfo);
        
        doc.fillColor(corTexto)
           .fontSize(11)
           .font('Helvetica-Bold')
           .text(`${tm.endTime}`, 65, yInfo + 13);
        
        doc.fillColor('#64748b')
           .fontSize(9)
           .font('Helvetica')
           .text('HORAS TRABALHADAS:', 280, yInfo);
        
        doc.fillColor(corTexto)
           .fontSize(11)
           .font('Helvetica-Bold')
           .text(`${parseFloat(tm.hoursWorked || 0).toFixed(1).replace('.', ',')} h`, 280, yInfo + 13);
        
        yInfo += 32;
        
        // Linha 3: Subtotal
        const valor = parseFloat(tm.totalAmount || 0);
        totalGeral += valor;
        
        doc.fillColor('#16a34a')
           .fontSize(9)
           .font('Helvetica')
           .text('SUBTOTAL:', 65, yInfo);
        
        doc.fillColor('#16a34a')
           .fontSize(12)
           .font('Helvetica-Bold')
           .text(`R$ ${valor.toFixed(2).replace('.', ',')}`, 65, yInfo + 13);
        
      } else {
        yInfo += 25;
        // Status em andamento - centralizado no espaço disponível
        doc.fillColor('#f59e0b')
           .fontSize(11)
           .font('Helvetica-Bold')
           .text('⏳ Serviço em andamento', 65, yInfo);
      }
      
      yTabela += alturaBox + 15;
    });

    // Box do total
    yTabela += 10;
    
    // Verifica se o box de total cabe na página atual
    if (yTabela + 80 > doc.page.height - 80) {
      doc.addPage();
      yTabela = 50;
    }
    
    doc.roundedRect(50, yTabela, 495, 60, 5)
       .lineWidth(2)
       .fillAndStroke('#f0fdfa', corPrimaria);
    
    doc.fillColor(corTexto)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('VALOR TOTAL DO SERVIÇO', 65, yTabela + 15);
    
    doc.fontSize(20)
       .fillColor(corPrimaria)
       .text(`R$ ${totalGeral.toFixed(2).replace('.', ',')}`, 65, yTabela + 32);
    
    // Status de pagamento
    const statusPagamento = task.paid ? 'PAGO' : 'PENDENTE';
    const corStatus = task.paid ? '#16a34a' : '#dc2626';
    const bgStatus = task.paid ? '#dcfce7' : '#fee2e2';
    
    doc.roundedRect(380, yTabela + 18, 150, 25, 3)
       .fillAndStroke(bgStatus, corStatus);
    
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .fillColor(corStatus)
       .text(statusPagamento, 380, yTabela + 24, { width: 150, align: 'center' });

    // Rodapé (posição fixa)
    yTabela += 80;
    doc.fontSize(8)
       .fillColor('#94a3b8')
       .font('Helvetica')
       .text(`Documento gerado em ${hoje}`, 50, yTabela, { align: 'center', width: 495 });

    // Finaliza o documento
    doc.end();

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    res.status(500).send({ error: 'Erro ao gerar PDF: ' + error.message });
  }
};

module.exports = {
  renderList,
  renderNew,
  create,
  renderEdit,
  edit,
  markAsPaid,
  markAsUnpaid,
  remove,
  renderHistory,
  generatePDF,
};
