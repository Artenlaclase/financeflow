# 💸 Fintracker

**Fintracker** es una aplicación web para la gestión de finanzas personales, enfocada en brindar a los usuarios una visión clara de sus ingresos, gastos, deudas y ahorros de forma centralizada y visual.

---

## 🚀 Tecnologías principales

- **Frontend:** [Next.js](https://nextjs.org/) con TypeScript
- **UI:** [Material-UI (MUI) v5](https://mui.com/)
- **Autenticación:** [Firebase Auth](https://firebase.google.com/products/auth) (email/contraseña)
- **Base de datos:** [Firebase Firestore](https://firebase.google.com/products/firestore)
- **Hosting:** [Firebase Hosting](https://firebase.google.com/products/hosting)

---

## ✅ Requisitos funcionales

### 1. Autenticación
- Registro/login con email y contraseña
- Pantalla de perfil básico del usuario

### 2. Dashboard Principal
- Resumen financiero del mes actual:
  - Saldo disponible (ingresos - gastos)
  - Deudas pendientes (con fechas de vencimiento)
  - Progreso de ahorros mensuales
- Gráfico circular de distribución de gastos
- Accesos rápidos a las principales acciones

### 3. Módulos principales

#### 🟢 Ingresos
- Registrar ingresos fijos y extraordinarios
- Categorización de ingresos
- Historial de ingresos por mes

#### 🔴 Gastos
- Registrar gastos fijos y variables
- Sistema de categorías (comida, transporte, ocio, etc.)
- Límites de gasto por categoría con alertas

#### 🟠 Deudas
- Registrar deudas con fecha, monto y descripción
- Marcarlas como pagadas
- Recordatorios visuales

#### 🔵 Ahorros
- Metas de ahorro mensuales/anuales
- Seguimiento de progreso
- Opción de ajustar metas

### 4. Historial y Reportes
- Visualización por mes/año
- Filtros por categorías
- Exportar datos a CSV y PDF

### 5. Funcionalidades extra
- Notificaciones para pagos próximos
- Presupuesto mensual configurable
- Modo oscuro/claro

---

## 🧩 UI/UX

- Diseño responsive con MUI
- Navegación intuitiva con drawer menu
- Formularios con validación usando Formik + Yup
- Feedback visual con snackbars
- Iconografía consistente
- Carga optimizada con skeletons

---

## 🔥 Estructura de datos en Firestore

```plaintext
users (collection)
└── {userId}
    ├── profile (document)
    ├── income (subcollection)
    ├── expenses (subcollection)
    ├── debts (subcollection)
    └── savings (subcollection) ```

---

## Subcolecciones por usuario:
income: { fecha, monto, categoría }

expenses: { fecha, monto, categoría }

debts: { descripción, monto, vencimiento, estado }

savings: { meta, actual, fechaObjetivo }
---

## 📦 Entregables esperados

Código bien estructurado con componentes reutilizables

Implementación completa de autenticación con Firebase

CRUD completo para ingresos, gastos, deudas y ahorros

Dashboard funcional conectado a Firestore

Sistema de notificaciones básico

Documentación mínima para despliegue

🔒 Notas adicionales
Priorizar funcionalidad mobile-first

Usar Context API o Zustand para gestión de estado

Implementar reglas de seguridad en Firestore

Incluir loading states en todas las operaciones asincrónicas

Preferir transiciones suaves entre vistas

📄 Licencia
Este proyecto es de código cerrado y se encuentra en desarrollo. Para colaboraciones, contáctame.