const Client = require('../models/Client');

const renderList = async (req, res) => {
  try {
    const clients = await Client.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']]
    });
    res.render('clients/listar', { clients });
  } catch (error) {
    res.status(500).send('Erro ao listar clientes');
  }
};

const renderNew = (req, res) => {
  res.render('clients/nova');
};

const createClient = async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    await Client.create({ 
      name, 
      email, 
      phone, 
      address, 
      notes,
      user_id: req.userId 
    });
    res.redirect('/clients');
  } catch (error) {
    res.status(500).send('Erro ao criar cliente');
  }
};

const renderEdit = async (req, res) => {
  try {
    const client = await Client.findOne({
      where: { 
        id: req.params.id,
        user_id: req.userId 
      }
    });
    if (!client) {
      return res.status(404).send('Cliente não encontrado');
    }
    res.render('clients/editar', { client });
  } catch (error) {
    res.status(500).send('Erro ao carregar cliente');
  }
};

const updateClient = async (req, res) => {
  try {
    const { name, email, phone, address, notes } = req.body;
    await Client.update(
      { name, email, phone, address, notes },
      { where: { 
        id: req.params.id,
        user_id: req.userId 
      } }
    );
    res.redirect('/clients');
  } catch (error) {
    res.status(500).send('Erro ao atualizar cliente');
  }
};

const deleteClient = async (req, res) => {
  try {
    const Task = require('../models/Task');
    const TaskMachine = require('../models/TaskMachine');
    
    // Busca todos os serviços deste cliente (apenas do usuário logado)
    const tasks = await Task.findAll({ 
      where: { 
        client_id: req.params.id,
        user_id: req.userId 
      } 
    });
    
    // Para cada serviço, deleta as máquinas associadas
    for (const task of tasks) {
      await TaskMachine.destroy({ where: { task_id: task.id } });
    }
    
    // Deleta os serviços do cliente
    await Task.destroy({ 
      where: { 
        client_id: req.params.id,
        user_id: req.userId 
      } 
    });
    
    // Finalmente deleta o cliente (apenas se for do usuário logado)
    await Client.destroy({ 
      where: { 
        id: req.params.id,
        user_id: req.userId 
      } 
    });
    
    res.redirect('/clients');
  } catch (error) {
    console.error('Erro ao deletar cliente:', error);
    res.status(500).send('Erro ao deletar cliente: ' + error.message);
  }
};

module.exports = {
  renderList,
  renderNew,
  createClient,
  renderEdit,
  updateClient,
  deleteClient,
};
