// 🧪 SCRIPT DE PRUEBA - Ejecutar en la consola del navegador
// Este script verifica que el token JWT esté configurado correctamente

console.log('=== 🔍 VERIFICACIÓN DE TOKEN ===\n');

// 1. Verificar token en localStorage
const token = localStorage.getItem('access_token');
console.log('1. Token en localStorage:', token ? '✅ Presente' : '❌ Ausente');
if (token) {
  console.log('   Primeros 20 caracteres:', token.substring(0, 20) + '...');
}

// 2. Verificar usuario en localStorage
const userStr = localStorage.getItem('user');
console.log('\n2. Usuario en localStorage:', userStr ? '✅ Presente' : '❌ Ausente');
if (userStr) {
  try {
    const user = JSON.parse(userStr);
    console.log('   Datos del usuario:', user);
    console.log('   - Email:', user.email);
    console.log('   - Nombre:', user.nombre || `${user.primer_nombre} ${user.primer_apellido}`);
    console.log('   - Role:', user.role);
  } catch (e) {
    console.error('   ❌ Error al parsear usuario:', e);
  }
}

// 3. Hacer petición de prueba al endpoint test
console.log('\n3. Probando endpoint /api/usuarios/test...');
fetch('http://localhost:3002/api/usuarios/test', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
  .then(res => res.json())
  .then(data => {
    console.log('   ✅ Respuesta del servidor:', data);
  })
  .catch(err => {
    console.error('   ❌ Error:', err);
  });

console.log('\n=== FIN DE VERIFICACIÓN ===');
