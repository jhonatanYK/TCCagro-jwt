const User = require("../models/User");
const bcrypt = require("bcrypt");
const {generateToken} = require('../middlewares/authMiddleware')

// Função para validar formato de email (RFC 5322 + validações extras)
const isValidEmail = (email) => {
  // Verifica se o email não está vazio
  if (!email || typeof email !== 'string') {
    return false;
  }
  
  // Remove espaços em branco
  email = email.trim();
  
  // Verifica tamanho (máximo 254 caracteres conforme RFC)
  if (email.length > 254 || email.length < 5) {
    return false;
  }
  
  // Regex rigoroso para validar estrutura básica
  const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  
  if (!emailRegex.test(email)) {
    return false;
  }
  
  // Verifica se tem apenas um @
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) {
    return false;
  }
  
  // Separa a parte local do domínio
  const [localPart, domain] = email.split('@');
  
  // Valida parte local (antes do @)
  if (localPart.length < 1 || localPart.length > 64) {
    return false;
  }
  
  // Não permite pontos consecutivos
  if (localPart.includes('..') || domain.includes('..')) {
    return false;
  }
  
  // Não permite ponto no início ou fim da parte local
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    return false;
  }
  
  // Valida domínio
  if (domain.length < 4 || domain.length > 253) { // Mínimo: a.co (4 chars)
    return false;
  }
  
  // Verifica se o domínio tem pelo menos um ponto
  if (!domain.includes('.')) {
    return false;
  }
  
  // Divide o domínio em partes
  const domainParts = domain.split('.');
  
  // Valida cada parte do domínio
  for (const part of domainParts) {
    // Cada parte deve ter pelo menos 2 caracteres
    if (part.length < 2) {
      return false;
    }
    // Não pode começar ou terminar com hífen
    if (part.startsWith('-') || part.endsWith('-')) {
      return false;
    }
  }
  
  // Valida TLD (última parte do domínio)
  const tld = domainParts[domainParts.length - 1].toLowerCase();
  
  // TLD deve ter pelo menos 2 caracteres e no máximo 6
  if (tld.length < 2 || tld.length > 6) {
    return false;
  }
  
  // Lista de TLDs válidos e comuns (principais)
  const validTLDs = [
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int',
    'br', 'co', 'uk', 'us', 'ca', 'au', 'de', 'fr', 'it', 'es', 'jp', 'cn', 'in',
    'io', 'dev', 'app', 'tech', 'info', 'biz', 'name', 'pro', 'xyz',
    'online', 'site', 'website', 'space', 'store', 'shop', 'blog',
    'cloud', 'email', 'global', 'world', 'live', 'today'
  ];
  
  // Verifica se o TLD está na lista de válidos
  if (!validTLDs.includes(tld)) {
    return false;
  }
  
  // Valida que o domínio principal (antes do TLD) tem pelo menos 2 caracteres
  const mainDomain = domainParts[domainParts.length - 2];
  if (!mainDomain || mainDomain.length < 2) {
    return false;
  }
  
  // Lista de domínios descartáveis/temporários
  const disposableEmails = [
    'tempmail', 'throwaway', '10minutemail', 'guerrillamail', 
    'mailinator', 'maildrop', 'trashmail', 'yopmail',
    'sharklasers', 'spam4', 'temp-mail', 'fakeinbox'
  ];
  
  const domainLower = domain.toLowerCase();
  if (disposableEmails.some(disposable => domainLower.includes(disposable))) {
    return false;
  }
  
  return true;
};

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
    let { username, password } = req.body;
    
    // Sanitiza o email (remove espaços e converte para minúsculas)
    username = username ? username.trim().toLowerCase() : '';
    
    // Valida se o username é um email válido
    if (!isValidEmail(username)) {
      return res.render('users/login', { error: 'Por favor, insira um email válido!' });
    }
    
    // Valida se a senha não está vazia
    if (!password || password.length < 1) {
      return res.render('users/login', { error: 'Por favor, insira sua senha!' });
    }
    
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.render('users/login', { error: 'Email ou senha incorretos!' });
    }
    const passwordIsValid = bcrypt.compareSync(password, user.password);
    if (!passwordIsValid) {
      return res.render('users/login', { error: 'Email ou senha incorretos!' });
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
    let { name, username, password } = req.body;
    
    // Sanitiza os dados de entrada
    name = name ? name.trim() : '';
    username = username ? username.trim().toLowerCase() : '';
    
    // Valida nome
    if (!name || name.length < 2) {
      return res.render('users/register', { error: 'Nome deve ter pelo menos 2 caracteres!' });
    }
    
    if (name.length > 100) {
      return res.render('users/register', { error: 'Nome muito longo!' });
    }
    
    // Valida se o username é um email válido
    if (!isValidEmail(username)) {
      return res.render('users/register', { error: 'Por favor, insira um email válido!' });
    }
    
    // Valida senha
    if (!password || password.length < 8) {
      return res.render('users/register', { error: 'A senha deve ter no mínimo 8 caracteres!' });
    }
    
    if (password.length > 128) {
      return res.render('users/register', { error: 'Senha muito longa!' });
    }
    
    // Verifica se a senha tem pelo menos uma letra maiúscula, minúscula e número
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase || !hasNumber) {
      return res.render('users/register', { error: 'A senha deve conter letras maiúsculas, minúsculas e números!' });
    }
    
    const newPassword = bcrypt.hashSync(password, 10);

    // Verifica se já existe usuário com o mesmo username
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.render('users/register', { error: 'Este email já está cadastrado!' });
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
      errorMsg = 'Este email já está cadastrado!';
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
