const express = require('express');
const db = require('./db');
const cookieParser = require('cookie-parser');
const { authMiddleware } = require('./middlewares/authMiddleware');
const userController = require('./controllers/userController');

const app = express();
const port = process.env.PORT || 3000;

// Carrega os modelos e relacionamentos
require('./models/Task');
require('./models/Machine');
require('./models/TaskMachine');

// Sincroniza o banco de dados
db.sync().then(() => {
  console.log('✅ Banco de dados sincronizado!');
  console.log('📊 Sistema otimizado com isolamento completo por usuário');
}).catch(err => {
  console.error('❌ Erro ao sincronizar banco de dados:', err);
});


app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Middleware para desabilitar cache em páginas protegidas
const noCache = (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

// Rotas web
app.get('/', (req, res) => res.render('index'));
app.get('/login', userController.renderLogin);
app.post('/login', userController.login);
app.get('/register', userController.renderRegister);
app.post('/register', userController.register);
app.get('/logout', userController.logout);

// Middleware de autenticação
const authCheck = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');
  require('jsonwebtoken').verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) return res.redirect('/login');
    req.user = decoded;
    req.userId = decoded.id; // Adiciona req.userId para facilitar o uso
    next();
  });
};

// Dashboard (com noCache)
app.get('/dashboard', noCache, authCheck, (req, res) => res.render('dashboard'));

// Rotas de clientes (com noCache)
app.use('/clients', noCache, authCheck, require('./routes/clientRoutes'));

// Rotas de máquinas (com noCache)
app.use('/machines', noCache, authCheck, require('./routes/machineRoutes'));

// Rotas de tarefas (com noCache)
app.use('/tasks', noCache, authCheck, require('./routes/taskRoutes'));

// API para verificar autenticação (usado pelo JavaScript do frontend)
app.get('/api/check-auth', (req, res) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ authenticated: false });
  
  require('jsonwebtoken').verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).json({ authenticated: false });
    res.json({ authenticated: true });
  });
});

// Rotas API (opcional)
app.use('/api/user', require('./routes/userRoutes'));
app.use('/api/task', require('./routes/taskRoutes'));

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
