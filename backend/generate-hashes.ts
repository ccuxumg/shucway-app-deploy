import bcrypt from 'bcrypt';

async function generatePasswords() {
  console.log('🔐 Generando hashes de contraseñas...\n');

  // Configuración
  const saltRounds = 10;
  const passwords = [
    { user: 'Luis (lrflores)', password: 'rene123' },
    { user: 'Ximena (xiflores)', password: 'ximena123' }
  ];

  // Generar hashes
  for (const item of passwords) {
    const hash = await bcrypt.hash(item.password, saltRounds);
    console.log(`📝 ${item.user} (${item.password}):`);
    console.log(`   ${hash}\n`);
  }

  console.log('✅ Hashes generados correctamente');
  console.log('\n💡 Copia estos hashes al script init-database.sql');
}

generatePasswords().catch(console.error);
