const User = require("../models/User");
const bcrypt = require("bcrypt");
const {generateToken} = require('../middlewares/authMiddleware')
const renderLogin = (req, res) => {
  // Limpa o cache ao exibir a página de login
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.render('users/login');
};

const renderRegister = (req, res) => {
  res.render('users/register');
};

const logout = (req, res) => {
  res.clearCookie('token');
  // Limpa o cache e previne navegação com botão voltar
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Renderiza uma página intermediária que limpa o histórico
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Saindo...</title>
      <script>
        // Limpa o histórico e redireciona
        window.history.pushState(null, null, window.location.href);
        window.onpopstate = function() {
          window.history.forward();
        };
        window.location.replace('/login');
      </script>
    </head>
    <body>
      <p>Saindo do sistema...</p>
    </body>
    </html>
  `);
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.render('users/login', { error: 'Usuário não encontrado!' });
    }
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.render('users/login', { error: 'Senha incorreta!' });
    }
    const token = generateToken(user);
    res.cookie('token', token, { httpOnly: true });
    res.redirect('/dashboard');
  } catch (error) {
    res.render('users/login', { error: 'Erro ao fazer login!' });
  }
};

const register = async(req, res) => {
  try {
    const { name, username, password } = req.body;
    const newPassword = bcrypt.hashSync(password, 10);

    // Verifica se já existe usuário com o mesmo username
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.render('users/register', { error: 'Nome de usuário já existe!' });
    }

    await User.create({
      name,
      username,
      password: newPassword
    });

    res.redirect('/login');
  } catch (error) {
    let errorMsg = 'Erro ao registrar usuário';
    if (error.name === 'SequelizeUniqueConstraintError') {
      errorMsg = 'Nome de usuário já existe!';
    }
    res.render('users/register', { error: errorMsg });
  }
};

module.exports = {
  renderLogin,
  renderRegister,
  login,
  register,
  logout,
};
