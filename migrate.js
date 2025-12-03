// Script de migração para adicionar colunas no banco
const db = require('./db');

async function migrate() {
  try {
    // Verifica se a coluna 'paid' já existe na tasks
    const [results] = await db.query("PRAGMA table_info(tasks)");
    const hasPaidColumn = results.some(column => column.name === 'paid');
    const hasServiceDateColumn = results.some(column => column.name === 'service_date');
    
    if (!hasPaidColumn) {
      console.log('🔄 Adicionando coluna "paid" na tabela tasks...');
      await db.query('ALTER TABLE tasks ADD COLUMN paid BOOLEAN DEFAULT 0');
      console.log('✅ Coluna "paid" adicionada com sucesso!');
    } else {
      console.log('✅ Coluna "paid" já existe!');
    }
    
    if (!hasServiceDateColumn) {
      console.log('🔄 Adicionando coluna "service_date" na tabela tasks...');
      await db.query('ALTER TABLE tasks ADD COLUMN service_date DATE');
      console.log('✅ Coluna "service_date" adicionada com sucesso!');
    } else {
      console.log('✅ Coluna "service_date" já existe!');
    }
    
    // Verifica se a coluna 'service_date' já existe na task_histories
    const [historyResults] = await db.query("PRAGMA table_info(task_histories)");
    const hasHistoryServiceDateColumn = historyResults.some(column => column.name === 'service_date');
    
    if (!hasHistoryServiceDateColumn) {
      console.log('🔄 Adicionando coluna "service_date" na tabela task_histories...');
      await db.query('ALTER TABLE task_histories ADD COLUMN service_date DATE');
      console.log('✅ Coluna "service_date" adicionada com sucesso!');
    } else {
      console.log('✅ Coluna "service_date" já existe no histórico!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrate();
