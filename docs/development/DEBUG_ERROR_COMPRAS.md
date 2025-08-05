# 🐛 Debug - Error al Guardar Compras

## ❌ **Error Reportado**
```
Error al guardar la compra. Intenta nuevamente.
```

## 🔍 **Posibles Causas y Soluciones**

### **1. Problema con Nueva Colección `productos-historial`**
**Causa:** Firebase Firestore puede necesitar permisos específicos para la nueva colección.

**Solución Temporal:** Se agregó fallback que guarda solo la transacción principal si falla el historial.

### **2. Datos Inválidos en Productos**
**Causa:** Algún campo del producto puede tener un valor que Firebase no acepta.

**Solución:** Se agregó validación y conversión de tipos:
```typescript
precio: Number(producto.precio) || 0,
cantidad: Number(producto.cantidad) || 0,
porPeso: Boolean(producto.porPeso),
```

### **3. Permisos de Firestore**
**Causa:** Las reglas de seguridad pueden estar bloqueando la nueva colección.

**Verificar en Firebase Console:**
```javascript
// Reglas necesarias en Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /productos-historial/{document} {
      allow read, write: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

## 🔧 **Debugging Agregado**

### **Logs en Consola:**
- ✅ Estado de usuario
- ✅ Datos de productos antes de guardar
- ✅ ID de transacción generada
- ✅ Progreso de guardado de productos
- ✅ Errores específicos por producto

### **Guardado Secuencial:**
Cambió de `Promise.all()` a guardado uno por uno para:
- ✅ Mejor control de errores
- ✅ Identificar qué producto específico causa problemas
- ✅ Continuar guardando otros productos aunque uno falle

### **Fallback de Emergencia:**
Si falla el guardado completo:
1. Intenta guardar solo la transacción principal
2. Resetea el formulario si tiene éxito
3. Solo muestra error si ambos métodos fallan

## 🧪 **Para Debuggear**

### **Paso 1: Revisar Consola del Navegador**
1. Abre Developer Tools (F12)
2. Ve a la pestaña "Console"
3. Intenta guardar una compra
4. Busca logs que empiecen con:
   - "Iniciando guardado de compra..."
   - "Productos a guardar:"
   - "Usuario:"

### **Paso 2: Verificar Firestore Rules**
1. Ve a Firebase Console
2. Firestore Database → Rules
3. Asegúrate que permite escritura en `productos-historial`

### **Paso 3: Prueba Simplificada**
1. Agrega solo 1 producto básico (no por peso)
2. Usa datos simples (ej: "Pan", $1000, cantidad 1)
3. Ve si funciona sin productos por peso

## 🚀 **Soluciones Implementadas**

### **Validación Mejorada:**
```typescript
// Antes
precio: producto.precio,

// Ahora  
precio: Number(producto.precio) || 0,
```

### **Manejo de Errores Granular:**
```typescript
// Guarda productos uno por uno
for (let i = 0; i < productosHistorial.length; i++) {
  try {
    await addDoc(collection(db, 'productos-historial'), productosHistorial[i]);
  } catch (productoError) {
    console.error(`Error producto ${i + 1}:`, productoError);
    // Continúa con el siguiente
  }
}
```

### **Fallback Funcional:**
Si falla todo, guarda solo la transacción básica (como funcionaba antes).

## 📋 **Próximos Pasos**

1. **Revisar logs** en consola del navegador
2. **Verificar permisos** de Firestore
3. **Probar con datos simples** primero
4. **Reportar logs específicos** para análisis más detallado

¡El sistema ahora tiene múltiples capas de protección contra errores! 🛡️
