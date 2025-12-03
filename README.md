# 🌾 TCCagro-JWT - Sistema de Gestão de Serviços Agrícolas

Sistema completo para gerenciamento de serviços agrícolas com controle de máquinas, clientes e horímetros.

## 📋 Sumário

- [Tecnologias](#-tecnologias)
- [Funcionalidades](#-funcionalidades)
- [Instalação](#-instalação)
- [Configuração](#️-configuração)
- [Uso](#-uso)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Deploy](#-deploy)

## 🚀 Tecnologias

### Backend
- **Node.js** + **Express 5.1.0** - Framework web
- **Sequelize 6.37.7** - ORM para banco de dados
- **SQLite** - Banco de dados relacional
- **JWT (jsonwebtoken 9.0.2)** - Autenticação
- **Bcrypt 6.0.0** - Hash de senhas
- **Cookie-Parser** - Gerenciamento de sessões
- **PDFKit 0.15.0** - Geração de PDFs

### Frontend
- **EJS 3.1.10** - Template engine (Server-Side Rendering)
- **Tailwind CSS 3.3.3** - Framework CSS utilitário
- **JavaScript Vanilla** - Interatividade no cliente

### DevOps
- **Nodemon** - Auto-reload em desenvolvimento
- **Render** - Hospedagem em produção

## ✨ Funcionalidades

### 🔐 Autenticação
- ✅ Login com email e senha
- ✅ Registro de novos usuários
- ✅ Validação de email (RFC 5322)
- ✅ Senha forte obrigatória (8+ chars, maiúscula, minúscula, número)
- ✅ JWT em cookies seguros (httpOnly, secure, sameSite)
- ✅ Sessão de 1 hora

### 👥 Gestão de Clientes
- ✅ Cadastro de clientes/proprietários
- ✅ Campos: nome, email, telefone, endereço, número, observações
- ✅ Edição e exclusão (com confirmação)
- ✅ Isolamento por usuário (multitenancy)

### 🚜 Gestão de Máquinas
- ✅ Cadastro de máquinas/equipamentos
- ✅ Campos: nome, tipo, valor/hora, placa
- ✅ Edição e exclusão
- ✅ Controle de disponibilidade (impede uso simultâneo)

### 📝 Gestão de Serviços
- ✅ Criar serviço com múltiplas máquinas
- ✅ Tipos: Terraplanagem, Gradear, Plantar, Colheita, etc.
- ✅ **Data do serviço** (campo obrigatório)
- ✅ Horímetro inicial por máquina
- ✅ Validações:
  - Endereço e número obrigatórios
  - Impede máquinas duplicadas no mesmo serviço
  - Bloqueia máquina já em uso em outro serviço
- ✅ Edição e finalização de serviços
- ✅ Cálculo automático:
  - Horas trabalhadas = horímetro final - inicial
  - Valor total = horas × valor/hora
- ✅ Status de pagamento (pago/não pago)
- ✅ **Geração de PDF** da ordem de serviço

### 📊 Histórico e Relatórios
- ✅ Histórico de serviços finalizados
- ✅ Paginação (10 serviços por página)
- ✅ **Filtros avançados:**
  - Por cliente
  - Por data inicial
  - Por data final
- ✅ **Exportação em PDF** (design profissional)
- ✅ Dados desnormalizados (mantém histórico mesmo se cliente/máquina forem deletados)
- ✅ Controle de pagamentos

### 📄 Geração de PDF
- ✅ Ordem de serviço profissional
- ✅ **Layout responsivo** (ajusta altura conforme conteúdo)
- ✅ Informações incluídas:
  - Cabeçalho com número e data de emissão
  - Dados do cliente (nome, email)
  - Detalhes do serviço (data, tipo, local, descrição)
  - Lista de máquinas com valores
  - Cálculos automáticos (subtotal por máquina, total geral)
  - Status de pagamento (PAGO/PENDENTE)
- ✅ Design moderno com cores e bordas arredondadas
- ✅ Geração otimizada (1 página única)

### 🔒 Segurança
- ✅ Autenticação JWT
- ✅ Cookies seguros (httpOnly, secure em produção, sameSite)
- ✅ Hash de senhas com bcrypt
- ✅ Isolamento de dados por usuário
- ✅ Validações no servidor e cliente
- ✅ Cache-Control em páginas protegidas
- ✅ Sanitização de inputs

## 📦 Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/jhonatanYK/TCCagro-jwt.git
cd TCCagro-jwt
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
```bash
# Copie o arquivo de exemplo
cp .env.example .env
```

Edite o arquivo `.env`:
```env
SECRET_KEY=sua_chave_secreta_aqui_gere_uma_chave_forte
NODE_ENV=development
DEBUG=True
PORT=3000
```

**⚠️ IMPORTANTE:** Gere uma SECRET_KEY forte para produção:
```bash
node -e "console.log(require('crypto').randomBytes(128).toString('base64'))"
```

### 4. Inicie o servidor
```bash
npm start
```

### 5. (Opcional) Modo desenvolvimento com auto-reload
```bash
npm run dev
```

### 6. (Opcional) Compilar Tailwind CSS
Em outro terminal:
```bash
npx tailwindcss -i ./public/styles.css -o ./public/tailwind.css --watch
```

## ⚙️ Configuração

### Variáveis de Ambiente

| Variável | Descrição | Padrão | Obrigatório |
|----------|-----------|--------|-------------|
| `SECRET_KEY` | Chave para assinar JWT | - | ✅ Sim |
| `NODE_ENV` | Ambiente (development/production) | development | ❌ Não |
| `PORT` | Porta do servidor | 3000 | ❌ Não |
| `DEBUG` | Modo debug | False | ❌ Não |

### Banco de Dados

O projeto usa **SQLite** com arquivo `database.sqlite` na raiz.

**Tabelas:**
- `users` - Usuários do sistema
- `clients` - Clientes/proprietários
- `machines` - Máquinas/equipamentos
- `tasks` - Serviços ativos (inclui campo `service_date`)
- `task_machines` - Relacionamento N:N (task ↔ machine)
- `task_histories` - Histórico de serviços finalizados (inclui campo `service_date`)
- `task_history_machines` - Histórico de máquinas usadas

## 🎯 Uso

### Acesse o sistema
```
http://localhost:3000
```

### Fluxo de Trabalho

1. **Registre-se** ou faça **Login**
2. **Cadastre Clientes** (proprietários rurais)
3. **Cadastre Máquinas** (tratores, colheitadeiras, etc.)
4. **Crie um Serviço:**
   - Selecione o cliente
   - Escolha o tipo de serviço (Terraplanagem, Plantio, etc.)
   - Adicione uma ou mais máquinas
   - Informe o horímetro inicial de cada máquina
5. **Finalize o Serviço:**
   - Entre em "Editar Serviço"
   - Informe o horímetro final de cada máquina
   - O sistema calcula automaticamente horas e valores
   - Quando todas as máquinas forem finalizadas, o serviço vai para o histórico
6. **Gere o PDF:**
   - Clique no botão "PDF" ao lado do serviço
   - Baixe a ordem de serviço em formato profissional
7. **Gerencie Pagamentos:**
   - Marque serviços como "Pago" ou "Não Pago"
   - Filtre por cliente e/ou data no histórico

## 🗂️ Estrutura do Projeto

```
TCCagro-jwt/
├── controllers/          # Lógica de negócio
│   ├── userController.js       # Autenticação e usuários
│   ├── clientController.js     # CRUD de clientes
│   ├── machineController.js    # CRUD de máquinas
│   └── taskController.js       # Gestão de serviços (753 linhas)
├── models/               # Modelos do banco (Sequelize)
│   ├── User.js
│   ├── Client.js
│   ├── Machine.js
│   ├── Task.js
│   ├── TaskMachine.js
│   ├── TaskHistory.js
│   └── TaskHistoryMachine.js
├── routes/               # Roteamento
│   ├── userRoutes.js
│   ├── clientRoutes.js
│   ├── machineRoutes.js
│   └── taskRoutes.js
├── middlewares/          # Interceptadores
│   └── authMiddleware.js       # Verificação JWT
├── views/                # Templates EJS
│   ├── index.ejs               # Landing page
│   ├── dashboard.ejs           # Dashboard
│   ├── users/                  # Login e registro
│   ├── clients/                # CRUD clientes
│   ├── machines/               # CRUD máquinas
│   ├── tasks/                  # CRUD serviços + histórico
│   └── partials/               # Componentes reutilizáveis
│       ├── auth-check.ejs      # Verificação de sessão
│       └── notifications.ejs   # Sistema de notificações
├── public/               # Arquivos estáticos
│   ├── tailwind.css            # CSS compilado
│   └── styles.css              # CSS customizado
├── index.js              # Arquivo principal (91 linhas)
├── db.js                 # Configuração do banco
├── migrate.js            # Scripts de migração
├── package.json          # Dependências
├── .env                  # Variáveis de ambiente (não versionado)
├── .env.example          # Exemplo de configuração
└── database.sqlite       # Banco SQLite (não versionado)
```

## 🌐 Deploy

### Deploy no Render

1. **Crie um conta no Render:** https://render.com

2. **Crie um novo Web Service:**
   - Conecte seu repositório GitHub
   - Configure:
     - **Build Command:** `npm install`
     - **Start Command:** `npm start`

3. **Adicione Variáveis de Ambiente:**
   - `SECRET_KEY` - Chave JWT (gere uma forte!)
   - `NODE_ENV` - `production`

4. **Deploy Automático:**
   - Cada push no GitHub faz deploy automático

### Configurações de Produção

**No Render, certifique-se de:**
- ✅ `NODE_ENV=production` (para cookies seguros)
- ✅ SECRET_KEY forte e única
- ✅ HTTPS habilitado (padrão no Render)

## 🐛 Troubleshooting

### Problema: Login não funciona no celular
**Solução:** Certifique-se que `NODE_ENV=production` está configurado no Render

### Problema: Tela preta no painel do Render
**Solução:** Esse é um bug do Osano (script do próprio Render). Soluções:
- Instale uBlock Origin e bloqueie `osano.com`
- Use modo anônimo
- Acesse direto a URL do projeto: `https://seu-projeto.onrender.com`

### Problema: Máquina não pode ser adicionada (já em uso)
**Solução:** Finalize o serviço anterior onde a máquina está sendo usada

### Problema: Erro ao criar serviço
**Solução:** Certifique-se que:
- Data do serviço está preenchida
- Endereço e número estão preenchidos
- Não há máquinas duplicadas
- Máquinas selecionadas não estão em uso

### Problema: Data do serviço aparece um dia anterior
**Solução:** Sistema já corrigido! Usa formatação de string para evitar problemas de timezone

### Problema: PDF gera 2 páginas
**Solução:** Sistema já otimizado! PDF gera em página única com altura dinâmica baseada no conteúdo

## 📝 Licença

ISC License

## 👨‍💻 Autor

**Jhonatan YK**  
GitHub: [@jhonatanYK](https://github.com/jhonatanYK)

---

**Sistema desenvolvido para TCC - Gestão de Serviços Agrícolas** 🌾
