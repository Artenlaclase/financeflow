// Prueba directa de guardado sin depender del contexto
const { addDoc, collection, Timestamp } = require('firebase/firestore');
const { db } = require('./lib/firebase/config');

const testSaveTransaction = async () => {
  try {
    console.log('🧪 Iniciando prueba de guardado directo...');
    
    const testData = {
      type: 'expense',
      category: 'Test',
      amount: 1000,
      description: 'Prueba de guardado directo',
      userId: '7BvLDsrWdbRzNYDlq2J3AiECitC3', // Tu UID del log
      createdAt: Timestamp.now(),
      date: Timestamp.now()
    };
    
    console.log('📊 Datos de prueba:', testData);
    
    const docRef = await addDoc(collection(db, 'transactions'), testData);
    console.log('✅ ÉXITO: Documento guardado con ID:', docRef.id);
    
    return { success: true, id: docRef.id };
    
  } catch (error) {
    console.error('❌ ERROR en prueba de guardado:', error);
    return { success: false, error };
  }
};

// Ejecutar la prueba
testSaveTransaction();

export { testSaveTransaction };
