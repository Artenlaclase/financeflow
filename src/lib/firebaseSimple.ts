// Versión simplificada para pruebas - sin consultas complejas
import { addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from './firebase/config';

export const guardarTransaccionSimple = async (data: any) => {
  try {
    console.log('📝 Guardando transacción simple:', data);
    
    // Validar datos mínimos
    if (!data.type || !data.amount || !data.userId) {
      throw new Error('Datos incompletos para la transacción');
    }
    
    // Estructura simplificada garantizada
    const transaccionSimple = {
      type: String(data.type),
      category: String(data.category || 'General'),
      amount: Number(data.amount),
      description: String(data.description || ''),
      userId: String(data.userId),
      createdAt: Timestamp.now(),
      // Solo agregar fecha si está presente y es válida
      ...(data.date && { date: data.date })
    };
    
    console.log('💾 Datos procesados para guardar:', transaccionSimple);
    
    const docRef = await addDoc(collection(db, 'transactions'), transaccionSimple);
    console.log('✅ Transacción guardada con ID:', docRef.id);
    
    return docRef;
    
  } catch (error) {
    console.error('❌ Error en guardarTransaccionSimple:', error);
    throw error;
  }
};
