// Tipos compartidos para el módulo de compras de supermercado

export interface ProductoCompra {
  id?: string;
  nombre: string;
  marca?: string; // Agregado: marca del producto
  precio: number;
  cantidad: number;
  unidad?: 'unidad' | 'peso' | 'litro'; // Agregado: unidad de medida
  
  // Propiedades para peso
  porPeso?: boolean; // Backward compatibility
  precioKilo?: number;
  peso?: number; // Backward compatibility
  pesoTotal?: number; // Nueva propiedad
  
  // Propiedades para litros
  porLitro?: boolean; // Backward compatibility
  precioLitro?: number;
  litros?: number; // Backward compatibility
  litrosTotal?: number; // Nueva propiedad
  
  total: number;
}

export interface CompraDetalle {
  supermercado: string;
  ubicacion: string;
  metodoPago: string;
  productos: ProductoCompra[];
  totalProductos: number;
  totalCompra: number;
}

export interface CompraTransaction {
  id: string;
  amount: number;
  description: string;
  date: any; // TODO: Usar FirebaseDate cuando se refactorice el código que usa .toDate()
  detalleCompra: CompraDetalle;
  createdAt: any; // TODO: Usar FirebaseDate cuando se refactorice el código que usa .toDate()
}

export interface ProductoHistorial {
  transactionId: string;
  userId: string;
  nombre: string;
  supermercado: string;
  ubicacion: string;
  fecha: any;
  porPeso?: boolean;
  porLitro?: boolean;
  precio: number;
  cantidad: number;
  precioKilo?: number;
  precioLitro?: number;
  peso?: number;
  litros?: number;
  total: number;
  metodoPago: string;
  createdAt: any;
}
