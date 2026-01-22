# Implementación: Supermercados y Ubicaciones Personalizadas

## Descripción
Se implementó la funcionalidad para que cuando el usuario agregue un nuevo supermercado o ciudad (ubicación) personalizados en el formulario de compras, estos se guarden automáticamente en Firestore y aparezcan en el listado para futuras compras.

## Cambios Realizados

### 1. Nuevo Hook: `useSuperMercadosUbicaciones.ts`
**Ubicación:** `src/hooks/useSuperMercadosUbicaciones.ts`

**Funcionalidad:**
- Carga los supermercados y ubicaciones por defecto
- Recupera desde Firestore los supermercados personalizados del usuario (colección `supermercados-personalizados`)
- Recupera desde Firestore las ubicaciones personalizadas del usuario (colección `ubicaciones-personalizadas`)
- Combina automáticamente los listados (por defecto + personalizados)
- Proporciona funciones para agregar nuevos supermercados y ubicaciones

**Métodos principales:**
- `agregarSupermercadoPersonalizado(nombre)`: Guarda un nuevo supermercado en Firestore
- `agregarUbicacionPersonalizada(nombre)`: Guarda una nueva ubicación en Firestore

**Estados que retorna:**
- `supermercados`: Array de supermercados disponibles
- `ubicaciones`: Array de ubicaciones disponibles
- `loading`: Indica si se está cargando el historial
- `agregarSupermercadoPersonalizado`: Función para guardar supermercados
- `agregarUbicacionPersonalizada`: Función para guardar ubicaciones

### 2. Modificaciones a `ComprasMercadoForm.tsx`
**Ubicación:** `src/components/features/Forms/ComprasMercadoForm.tsx`

**Cambios:**
1. Importación del nuevo hook `useSuperMercadosUbicaciones`
2. Uso del hook para obtener supermercados y ubicaciones dinámicos:
   ```tsx
   const { 
     supermercados: supermercadosDisponibles, 
     ubicaciones: ubicacionesDisponibles, 
     agregarSupermercadoPersonalizado, 
     agregarUbicacionPersonalizada 
   } = useSuperMercadosUbicaciones();
   ```
3. Reemplazo de constantes hardcodeadas por variables del hook
4. Lógica automática para guardar supermercados/ubicaciones personalizadas:
   - Cuando se envía el formulario y el supermercado es "otro", se guarda automáticamente
   - Se verifica si la ubicación ya existe; si no, se guarda automáticamente

## Flujo de Funcionamiento

### Primer uso (Supermercado personalizado):
1. Usuario selecciona "Otro (personalizar)" en el dropdown de supermercados
2. Ingresa nombre del supermercado personalizado (ej: "Mi Supermercado")
3. Completa la compra normalmente
4. Al guardar, el supermercado se persiste en Firestore (colección `supermercados-personalizados`)
5. **En el siguiente acceso**, ese supermercado aparece en el listado principal

### Ubicaciones personalizadas:
1. Usuario selecciona cualquier ubicación del listado
2. Si la ubicación no existe en el listado predefinido, se guarda automáticamente en Firestore
3. **En el siguiente acceso**, esa ubicación aparece en el listado

## Colecciones Firestore

### `supermercados-personalizados`
```
{
  userId: string,
  nombre: string,
  createdAt: Timestamp
}
```

### `ubicaciones-personalizadas`
```
{
  userId: string,
  nombre: string,
  createdAt: Timestamp
}
```

## Características

✅ **Persistencia**: Los datos se guardan en Firestore asociados al usuario (`userId`)
✅ **Evita duplicados**: Verifica que no existan elementos duplicados antes de guardar
✅ **Automático**: No requiere pasos adicionales; se guarda al procesar la compra
✅ **Dinámico**: Los elementos personalizados se cargan automáticamente al abrir el formulario
✅ **Seguro**: Solo el usuario propietario puede ver/usar sus datos personalizados
✅ **Emojis**: Mantiene consistencia visual con emojis en los listados

## Ejemplo de Uso

1. **Primera compra** en un supermercado no listado:
   - Usuario selecciona "Otro"
   - Escribe "Mini Market Don Pepe"
   - Completa la compra
   
2. **Segunda compra** (después de recargar):
   - Al abrir el formulario de compras
   - "Mini Market Don Pepe 🛒" aparece automáticamente en el listado
   - Puede seleccionarlo directamente sin volver a escribirlo

## Notas Técnicas

- El hook maneja la carga asíncrona de datos desde Firestore
- Los cambios de estado se reflejan inmediatamente en la UI
- No hay re-fetches innecesarios gracias al hook dependency de `user?.uid`
- Compatible con el flujo actual de guardado de compras

## Testing

Para verificar que funciona:
1. Abrir formulario de nueva compra
2. Seleccionar "Otro" en supermercados
3. Ingresar nombre personalizado (ej: "Supermercado Test")
4. Completar y guardar compra
5. Cerrar formulario y abrir nuevamente
6. El supermercado personalizado debe aparecer en el listado

---

**Última actualización:** Enero 19, 2026
