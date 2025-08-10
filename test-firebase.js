// Prueba simple de conectividad de Firebase
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, Timestamp } from 'firebase/firestore';

const firebaseConfig = {
  // Tu configuración de Firebase aquí
  // Por seguridad, no incluyo las credenciales reales
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFirebaseConnection() {
  try {
    console.log('🧪 Probando conexión a Firebase...');
    
    const testDoc = {
      test: true,
      timestamp: Timestamp.now(),
      message: 'Prueba de conectividad'
    };
    
    const docRef = await addDoc(collection(db, 'test'), testDoc);
    console.log('✅ Prueba exitosa. Document ID:', docRef.id);
    
  } catch (error) {
    console.error('❌ Error en la prueba:', error);
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
  }
}

// Ejecutar la prueba
testFirebaseConnection();
