const Machine = require('../models/Machine');

// Renderizar formulário de nova máquina
exports.renderNewForm = async (req, res) => {
  res.render('machines/nova');
};

// Criar nova máquina
exports.create = async (req, res) => {
  try {
    const { name, type, hourlyRate, plate } = req.body;
    await Machine.create({
      name,
      type,
      hourlyRate,
      plate,
      user_id: req.userId,
    });
    res.redirect('/machines');
  } catch (error) {
    console.error('Erro ao criar máquina:', error);
    res.status(500).send('Erro ao criar máquina');
  }
};

// Listar todas as máquinas
exports.list = async (req, res) => {
  try {
    const machines = await Machine.findAll({
      where: { user_id: req.userId },
      order: [['createdAt', 'DESC']],
    });
    res.render('machines/listar', { machines });
  } catch (error) {
    console.error('Erro ao listar máquinas:', error);
    res.status(500).send('Erro ao listar máquinas');
  }
};

// Renderizar formulário de edição
exports.renderEditForm = async (req, res) => {
  try {
    const machine = await Machine.findOne({
      where: { 
        id: req.params.id,
        user_id: req.userId 
      }
    });
    if (!machine) {
      return res.status(404).send('Máquina não encontrada');
    }
    res.render('machines/editar', { machine });
  } catch (error) {
    console.error('Erro ao buscar máquina:', error);
    res.status(500).send('Erro ao buscar máquina');
  }
};

// Atualizar máquina
exports.update = async (req, res) => {
  try {
    const { name, type, hourlyRate, plate } = req.body;
    await Machine.update(
      { name, type, hourlyRate, plate },
      { where: { 
        id: req.params.id,
        user_id: req.userId 
      } }
    );
    res.redirect('/machines');
  } catch (error) {
    console.error('Erro ao atualizar máquina:', error);
    res.status(500).send('Erro ao atualizar máquina');
  }
};

// Deletar máquina
exports.delete = async (req, res) => {
  try {
    const TaskMachine = require('../models/TaskMachine');
    
    // Primeiro deleta as associações na tabela task_machines
    await TaskMachine.destroy({ where: { machine_id: req.params.id } });
    
    // Depois deleta a máquina (apenas se for do usuário logado)
    await Machine.destroy({ 
      where: { 
        id: req.params.id,
        user_id: req.userId 
      } 
    });
    
    res.redirect('/machines');
  } catch (error) {
    console.error('Erro ao deletar máquina:', error);
    res.status(500).send('Erro ao deletar máquina: ' + error.message);
  }
};
