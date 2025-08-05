# Módulo de Compras de Supermercado

## Descripción
Nueva funcionalidad para registrar y gestionar compras de supermercado con detalle completo de productos, precios y ubicaciones en Chile.

## Características Principales

### 🛒 Registro de Compras
- **Información general:** Supermercado, comuna (Chile), fecha
- **Productos detallados:** Nombre, precio, cantidad, total
- **Productos por peso:** Precio por kilo, peso, cálculo automático
- **Total automático:** Suma todos los productos de la compra

### 📊 Historial y Estadísticas
- **Lista completa** de todas las compras realizadas
- **Estadísticas resumidas:** Total gastado, productos comprados, compras del último mes
- **Detalles expandibles** para ver productos de cada compra
- **Organización cronológica** (más recientes primero)

### 🏪 Supermercados Incluidos
- Jumbo, Lider, Santa Isabel, Tottus, Unimarc, Ekono
- Express de Lider, Acuenta, OK Market, Montserrat
- Opción "Otro" para supermercados no listados

### 📍 Comunas de Chile
Incluye las principales comunas de la Región Metropolitana y otras regiones.

## Archivos Creados

### Páginas
- `src/app/compras/page.tsx` - Página principal del módulo de compras

### Componentes
- `src/components/features/Forms/ComprasMercadoForm.tsx` - Formulario para nueva compra
- `src/components/features/Compras/HistorialCompras.tsx` - Historial y estadísticas

### Modificaciones
- `src/app/dashboard/page.tsx` - Agregado botón "Compras Mercado"
- `src/components/features/Dashboard/QuickActions.tsx` - Agregado acceso rápido

## Estructura de Datos

### Transacción de Compra
```typescript
{
  type: 'expense',
  category: 'Supermercado',
  amount: number,
  description: string,
  date: Date,
  userId: string,
  detalleCompra: {
    supermercado: string,
    ubicacion: string,
    productos: Array<{
      id: string,
      nombre: string,
      precio: number,
      cantidad: number,
      porPeso: boolean,
      precioKilo?: number,
      peso?: number,
      total: number
    }>,
    totalProductos: number,
    totalCompra: number
  }
}
```

## Cómo Usar

### Acceder al Módulo
1. Desde el **Dashboard**: Clic en "Compras Mercado" (botón verde)
2. Desde **Acciones Rápidas**: Clic en "Compras"
3. URL directa: `/compras`

### Registrar Nueva Compra
1. Clic en "Nueva Compra"
2. Seleccionar supermercado y comuna
3. Ingresar fecha de compra
4. Agregar productos:
   - **Producto normal:** Nombre, precio, cantidad
   - **Producto por peso:** Activar switch "Por peso", ingresar precio/kg y peso
5. Guardar compra

### Ver Historial
- **Estadísticas resumidas** en la parte superior
- **Lista de compras** con detalles expandibles
- **Productos por compra** con precios y cantidades

## Integración con Sistema Financiero

### Gastos
- Cada compra se registra como **gasto** en la categoría "Supermercado"
- Se suma automáticamente a los **gastos del mes**
- Aparece en **transacciones recientes** del dashboard

### Análisis
- Compatible con el módulo de **Analytics**
- Se incluye en **gráficos de gastos por categoría**
- Contribuye a las **estadísticas mensuales**

## Notas Técnicas

### Tecnologías
- **React** con TypeScript
- **Material-UI** para interfaz
- **Firebase Firestore** para persistencia
- **Context API** para gestión de estado

### Validaciones
- Campos requeridos marcados
- Validación de números positivos
- Verificación de datos antes de guardar
- Manejo de errores con mensajes informativos

### Responsive Design
- Adaptable a **móviles** y **tablets**
- Grid responsive para estadísticas
- Formularios optimizados para pantallas pequeñas

## Próximas Mejoras Sugeridas

1. **Exportar compras** a Excel/PDF
2. **Comparar precios** entre supermercados
3. **Lista de compras** para planificar
4. **Códigos de barras** para productos
5. **Geolocalización** automática
6. **Alertas de presupuesto** para supermercado
7. **Análisis nutricional** básico
8. **Productos favoritos** y compras frecuentes
