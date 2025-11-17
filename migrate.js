// Script de migração para adicionar coluna 'paid' na tabela tasks
const db = require('./db');

async function migrate() {
  try {
    // Verifica se a coluna 'paid' já existe
    const [results] = await db.query("PRAGMA table_info(tasks)");
    const hasPaidColumn = results.some(column => column.name === 'paid');
    
    if (!hasPaidColumn) {
      console.log('🔄 Adicionando coluna "paid" na tabela tasks...');
      await db.query('ALTER TABLE tasks ADD COLUMN paid BOOLEAN DEFAULT 0');
      console.log('✅ Coluna "paid" adicionada com sucesso!');
    } else {
      console.log('✅ Coluna "paid" já existe!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

migrate();
