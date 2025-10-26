import { ventasService } from './src/services/ventas.service.ts';

async function testProductosPopulares() {
  try {
    console.log('🧪 Probando getProductosPopulares...');
    const productos = await ventasService.getProductosPopulares(4);
    console.log('✅ Éxito:', productos);
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
}

testProductosPopulares();