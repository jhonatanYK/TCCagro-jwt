# 🚜 Sistema de Múltiplas Máquinas por Serviço

## ✅ Funcionalidade Implementada e Operacional

Este documento detalha o sistema completo de gerenciamento de múltiplas máquinas em serviços agrícolas.

---

## 📋 Arquitetura Implementada

### 🗃️ Modelo de Dados

**Relacionamento N:N (Many-to-Many):**
```
Task (Serviço) ←→ TaskMachine (Pivô) ←→ Machine (Máquina)
```

**Tabelas:**

#### `tasks` - Serviço Principal
```sql
id, client_id, serviceName, location, locationNumber, 
description, completed, paid, user_id, createdAt, updatedAt
```

#### `task_machines` - Tabela Pivô (Relacionamento)
```sql
id, task_id, machine_id, startTime, endTime, 
hoursWorked, hourlyRate, totalAmount, createdAt, updatedAt
```
- `startTime` - Horímetro inicial
- `endTime` - Horímetro final (NULL enquanto em andamento)
- `hoursWorked` - Calculado: `endTime - startTime`
- `totalAmount` - Calculado: `hoursWorked × hourlyRate`
- `hourlyRate` - Valor/hora salvo no momento (histórico)

#### `machines` - Máquinas/Equipamentos
```sql
id, name, type, hourlyRate, plate, user_id, createdAt, updatedAt
```

---

## 🎯 Funcionalidades Implementadas

### 1️⃣ **Criar Serviço (nova.ejs)**

**Recursos:**
- ✅ Adicionar **ilimitadas** máquinas ao serviço
- ✅ Botão "➕ Adicionar Máquina" - adiciona nova máquina dinamicamente
- ✅ Botão "🗑️ Remover" em cada máquina (mínimo 1 obrigatória)
- ✅ Dropdown de seleção de máquinas (lista apenas disponíveis)
- ✅ Campo de horímetro inicial para cada máquina
- ✅ Exibe valor/hora de cada máquina selecionada
- ✅ **Validações JavaScript:**
  - Não permite máquinas duplicadas no mesmo serviço
  - Valida horímetro inicial
  - Valida campos obrigatórios (endereço, número)

**Validações Backend (taskController.create):**
1. **Validação de duplicação** - Impede mesma máquina 2x
2. **Validação de disponibilidade** - Verifica se máquina já está em uso (query no banco):
   ```sql
   SELECT * FROM task_machines 
   WHERE machine_id = ? AND endTime IS NULL
   ```
3. **Validação de propriedade** - Apenas máquinas do `user_id`

**Fluxo de Criação:**
```
Usuario clica "Adicionar Máquina"
  ↓
Seleciona máquina do dropdown
  ↓
Informa horímetro inicial
  ↓
Sistema valida duplicação (frontend)
  ↓
POST /tasks → taskController.create
  ↓
Valida máquina em uso (backend)
  ↓
Cria Task + N TaskMachines (startTime preenchido)
  ↓
Redireciona para /tasks (lista)
```

---

### 2️⃣ **Listar Serviços (listar.ejs)**

**Exibição Otimizada:**
- ✅ Cards por serviço
- ✅ Lista **todas as máquinas** do serviço
- ✅ Horímetro inicial de cada máquina
- ✅ Status individual por máquina:
  - 🟡 "Em Andamento" (endTime NULL)
  - 🟢 "Finalizado" (endTime preenchido)
- ✅ **Cálculos automáticos:**
  - Soma horas trabalhadas de todas as máquinas
  - Soma valor total de todas as máquinas
- ✅ Ações: Editar, Marcar Pago/Não Pago, Excluir
- ✅ Modal de confirmação antes de excluir

**Performance:**
- ✅ **Query otimizada** - Batch loading (3 queries ao invés de N+M):
  ```javascript
  1. Busca todas as Tasks
  2. Busca todas as TaskMachines (WHERE task_id IN [...])
  3. Busca todas as Machines (WHERE id IN [...])
  → Monta estrutura com maps O(1)
  ```

---

### 3️⃣ **Editar/Finalizar Serviço (editar.ejs)**

**Recursos:**
- ✅ Exibe dados do serviço (cliente, localização, descrição)
- ✅ Lista todas as máquinas associadas
- ✅ Mostra horímetro inicial de cada máquina
- ✅ Campo para **horímetro final** de cada máquina
- ✅ **Validações JavaScript:**
  - Hora final ≥ hora inicial
  - Não permite hora final = 0
  - Validação em tempo real (onchange)
- ✅ **Cálculo automático** ao preencher hora final:
  - Horas = final - inicial
  - Valor = horas × valor/hora
  - Exibição em tempo real

**Validações Backend (taskController.edit):**
```javascript
// Para cada máquina:
1. Valida endTime > 0
2. Calcula: hoursWorked = endTime - startTime
3. Calcula: totalAmount = hoursWorked × hourlyRate
4. Atualiza TaskMachine

// Verifica se TODAS máquinas finalizadas:
if (allTaskMachines.every(tm => tm.endTime !== null)) {
  → Marca Task.completed = true
  → Cria registro em TaskHistory (desnormalizado)
  → Cria registros em TaskHistoryMachine
  → Move serviço para histórico
}
```

**Fluxo de Finalização:**
```
Usuario clica "Editar Serviço"
  ↓
Sistema carrega máquinas associadas
  ↓
Usuario preenche horímetro final de cada máquina
  ↓
JavaScript valida hora final ≥ inicial
  ↓
POST /tasks/:id → taskController.edit
  ↓
Backend calcula horas e valores
  ↓
Se TODAS máquinas finalizadas:
  ├─ Move para histórico (desnormalizado)
  └─ Marca como completed
  ↓
Redireciona para /tasks
```

---

### 4️⃣ **Histórico de Serviços (historico.ejs)**

**Recursos:**
- ✅ **Paginação** - 10 serviços por página
- ✅ **Filtro por cliente** - Dropdown "Todos os Clientes"
- ✅ **Navegação:** Anterior | 1 2 3 ... N | Próximo
- ✅ **Dados desnormalizados** - Mantém histórico mesmo se cliente/máquina forem deletados
- ✅ Exibe todas as máquinas usadas no serviço
- ✅ Horímetros inicial/final de cada máquina
- ✅ Horas e valores totais
- ✅ Status de pagamento (Pago ✅ / Não Pago ⏳)
- ✅ Botões: Marcar como Pago/Não Pago

**Performance:**
- ✅ **Query otimizada** com batch loading (2 queries):
  ```javascript
  1. TaskHistory.findAll({ limit, offset, where: filter })
  2. TaskHistoryMachine.findAll({ where: { history_id IN [...] }})
  → Agrupa por history_id com map
  ```

**Estrutura Desnormalizada:**
```javascript
TaskHistory = {
  serviceName, location, description,
  clientName, clientEmail,  // ← Copiado do cliente
  paid, totalAmount, completedAt
}

TaskHistoryMachine = {
  machineName, machineType,  // ← Copiado da máquina
  startTime, endTime, hoursWorked, 
  hourlyRate, totalAmount
}
```

---

## 🔐 Validações e Regras de Negócio

### ✅ Ao Criar Serviço:
1. **Endereço e número obrigatórios**
2. **Máquinas não podem se repetir** no mesmo serviço
3. **Máquina não pode estar em uso** em outro serviço ativo
   - Query verifica: `endTime IS NULL`
4. **Pelo menos 1 máquina** obrigatória

### ✅ Ao Finalizar Serviço:
1. **Hora final ≥ hora inicial**
2. **Hora final ≠ 0**
3. **Serviço só vai para histórico** quando TODAS máquinas finalizadas
4. **Cálculos automáticos** de horas e valores

### ✅ Isolamento de Dados:
- **Multitenancy** - Todos os dados filtrados por `user_id`
- Usuário A não vê/edita dados do Usuário B

---

## 🚀 Arquivos Principais

### **Backend:**

**`controllers/taskController.js`** (753 linhas)
- `renderList()` - Lista serviços ativos com máquinas (otimizado)
- `renderNew()` - Formulário novo serviço
- `create()` - Cria serviço + valida máquinas
- `renderEdit()` - Formulário editar/finalizar
- `edit()` - Finaliza máquinas + move para histórico
- `renderHistory()` - Histórico paginado com filtros
- `markAsPaid()` / `markAsUnpaid()` - Controle de pagamentos
- `remove()` - Deleta serviço e máquinas (cascade)

**`models/TaskMachine.js`** (35 linhas)
- Tabela pivô N:N
- Campos: startTime, endTime, hoursWorked, totalAmount, hourlyRate

**`models/TaskHistory.js`** + **`TaskHistoryMachine.js`**
- Histórico desnormalizado (cópia dos dados)

### **Frontend:**

**`views/tasks/nova.ejs`** (374 linhas)
- Sistema dinâmico de adicionar/remover máquinas
- Validações JavaScript
- Dropdown populado via EJS

**`views/tasks/listar.ejs`**
- Cards com todas as máquinas
- Cálculos totais
- Modal de confirmação (via notifications.ejs)

**`views/tasks/editar.ejs`**
- Formulário de finalização
- Validação de horímetros
- Cálculo em tempo real

**`views/tasks/historico.ejs`**
- Paginação completa
- Filtro por cliente
- Exibição desnormalizada

---

## 📊 Fluxo Completo do Sistema

```
┌─────────────────┐
│ Usuario Logado  │
└────────┬────────┘
         │
    ┌────▼────┐
    │Dashboard│
    └────┬────┘
         │
    ┌────▼────────────────────────┐
    │                             │
┌───▼────┐              ┌────▼─────┐
│Clientes│              │ Máquinas │
└───┬────┘              └────┬─────┘
    │                        │
    └────────┬───────────────┘
             │
       ┌─────▼──────┐
       │  Serviços  │
       └─────┬──────┘
             │
    ┌────────┴────────┐
    │                 │
┌───▼─────┐    ┌─────▼────────┐
│ Ativos  │    │  Histórico   │
│         │    │(Finalizados) │
└───┬─────┘    └──────────────┘
    │
    ├─ Criar (múltiplas máquinas)
    ├─ Editar (finalizar máquinas)
    ├─ Marcar Pago/Não Pago
    └─ Excluir
```

---

## 🎯 Diferencial do Sistema

### 🟢 **Antes (Sistema Antigo):**
- ❌ 1 serviço = 1 máquina
- ❌ Para usar 3 máquinas = criar 3 serviços
- ❌ Difícil gerenciar serviços complexos

### 🟢 **Agora (Sistema Atual):**
- ✅ 1 serviço = N máquinas
- ✅ Controle individual de cada máquina
- ✅ Cálculos automáticos totais
- ✅ Histórico completo desnormalizado
- ✅ Performance otimizada (batch loading)
- ✅ Validações robustas

---

## 🔧 Melhorias Futuras (Opcional)

1. **Dashboard Avançado:**
   - Estatísticas por máquina
   - Máquinas mais lucrativas
   - Tempo médio de uso

2. **Relatórios:**
   - PDF de serviços
   - Relatório mensal por cliente
   - Rentabilidade por máquina

3. **Notificações:**
   - Alertas de manutenção (baseado em horas)
   - Serviços não pagos há X dias

4. **Mobile App:**
   - PWA para registro rápido de horímetros
   - Notificações push

---

## ✅ Status Atual

**✨ Sistema 100% Funcional e em Produção**

- ✅ Múltiplas máquinas por serviço
- ✅ Validações completas
- ✅ Performance otimizada
- ✅ Histórico desnormalizado
- ✅ Controle de pagamentos
- ✅ Paginação e filtros
- ✅ Isolamento por usuário
- ✅ Deploy no Render

---

**Desenvolvido para TCC - Gestão de Serviços Agrícolas** 🌾🚜