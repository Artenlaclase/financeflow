// Tipos compartidos para el módulo de compras de supermercado

export interface ProductoCompra {
  id?: string;
  nombre: string;
  precio: number;
  cantidad: number;
  porPeso?: boolean;
  porLitro?: boolean;
  precioKilo?: number;
  precioLitro?: number;
  peso?: number;
  litros?: number;
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
  date: any;
  detalleCompra: CompraDetalle;
  createdAt: any;
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
