"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductoUnico {
  nombre: string;
  marcas: string[]; // Array para guardar todas las marcas
}

export const useProductosHistorial = () => {
  const { user } = useAuth();
  const [productos, setProductos] = useState<ProductoUnico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductos = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const q = query(
          collection(db, 'productos-historial'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        
        // Crear un Map para acumular todas las marcas por nombre de producto
        const productosMap = new Map<string, ProductoUnico>();
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.nombre && data.nombre.trim()) {
            const key = data.nombre.toLowerCase().trim();
            const marca = data.marca?.trim() || '';
            
            if (!productosMap.has(key)) {
              // Primera vez que vemos este producto
              productosMap.set(key, {
                nombre: data.nombre,
                marcas: marca ? [marca] : []
              });
            } else {
              // Ya existe el producto, agregamos la marca si es nueva
              const producto = productosMap.get(key)!;
              if (marca && !producto.marcas.includes(marca)) {
                producto.marcas.push(marca);
              }
            }
          }
        });
        
        setProductos(Array.from(productosMap.values()).sort((a, b) => 
          a.nombre.localeCompare(b.nombre)
        ));
      } catch (error) {
        console.error('Error fetching productos:', error);
        setProductos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, [user?.uid]);

  return { productos, loading };
};
