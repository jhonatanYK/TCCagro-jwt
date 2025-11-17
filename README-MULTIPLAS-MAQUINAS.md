# Funcionalidade de Múltiplas Máquinas em Serviços

## ✅ Implementação Concluída

### 📋 Arquivos Criados:
1. **models/TaskMachine.js** - Tabela intermediária para relacionamento many-to-many entre Tasks e Machines

### 📝 Arquivos Modificados:

1. **views/tasks/nova.ejs**
   - Removido campo único de máquina
   - Adicionado sistema dinâmico para adicionar múltiplas máquinas
   - Cada máquina tem seu próprio horímetro inicial
   - Botão para adicionar/remover máquinas
   - Validação para evitar máquinas duplicadas

2. **controllers/taskController.js**
   - Atualizado método `create()` para processar múltiplas máquinas
   - Atualizado método `renderList()` para carregar máquinas associadas
   - Relacionamento many-to-many implementado

3. **models/Task.js**
   - Mantido relacionamento antigo para compatibilidade
   - Comentário indicando relacionamento many-to-many via TaskMachine

4. **index.js**
   - Adicionado require dos modelos para inicializar relacionamentos

5. **views/tasks/listar.ejs**
   - Exibe todas as máquinas de cada serviço
   - Mostra horímetro de cada máquina separadamente
   - Calcula horas e valores totais somando todas as máquinas
   - Status considera todas as máquinas (finalizado só quando todas finalizarem)

## 🎯 Funcionalidades Implementadas:

### ✨ Ao Criar Serviço:
- ➕ Adicionar quantas máquinas quiser
- 🗑️ Remover máquinas (mínimo 1 obrigatória)
- 📊 Cada máquina tem seu horímetro inicial
- ✅ Validação anti-duplicação
- 💰 Valor/hora de cada máquina é salvo automaticamente

### 📋 Na Lista de Serviços:
- 🚜 Mostra todas as máquinas do serviço
- ⏱️ Horímetro inicial/final de cada máquina
- 📊 Soma total de horas trabalhadas
- 💵 Soma total de valores de todas as máquinas
- ✅ Status considera todas as máquinas

## 🔧 Próximos Passos (Para Implementar):

1. **Atualizar view de edição (editar.ejs)**
   - Permitir finalizar cada máquina individualmente
   - Mostrar progresso de cada máquina
   - Calcular valores separados

2. **Dashboard**
   - Atualizar para mostrar estatísticas com múltiplas máquinas

3. **Relatórios**
   - Criar relatórios detalhados por máquina
   - Mostrar rentabilidade de cada máquina

## 📊 Estrutura do Banco:

```
tasks (serviço principal)
├── id
├── client_id
├── serviceName
├── location
└── user_id

task_machine (relacionamento)
├── id
├── task_id (FK)
├── machine_id (FK)
├── startTime (horímetro inicial)
├── endTime (horímetro final)
├── hoursWorked (calculado)
├── totalAmount (calculado)
└── hourlyRate (valor/hora no momento)
```

## 🚀 Como Usar:

1. Acesse "Adicionar Serviço"
2. Selecione o cliente
3. Descreva o serviço
4. Clique em "Adicionar Máquina"
5. Selecione a máquina e informe o horímetro inicial
6. Adicione quantas máquinas precisar
7. Salve o serviço

Todas as máquinas ficam "Em Andamento" até serem finalizadas individualmente!