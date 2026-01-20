"use client";

import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';

export interface SupermercadoItem {
  value: string;
  label: string;
  personalizado?: boolean;
}

export interface UbicacionItem {
  value: string;
  label: string;
  personalizado?: boolean;
}

export const useSuperMercadosUbicaciones = () => {
  const { user } = useAuth();
  const [supermercados, setSupermercados] = useState<SupermercadoItem[]>([
    { value: 'Jumbo', label: 'Jumbo 🛒' },
    { value: 'Lider', label: 'Líder 🛒' },
    { value: 'Unimarc', label: 'Unimarc 🛒' },
    { value: 'Santa Isabel', label: 'Santa Isabel 🛒' },
    { value: 'Tottus', label: 'Tottus 🛒' },
    { value: 'Foresta', label: 'Foresta 🛒' },
    { value: 'San Roberto', label: 'San Roberto 🛒' },
    { value: 'Central', label: 'Central 🛒' },
  ]);
  
  const [ubicaciones, setUbicaciones] = useState<UbicacionItem[]>([
    { value: 'La Florida', label: 'La Florida 📍' },
    { value: 'Puente Alto', label: 'Puente Alto 📍' },
    { value: 'Maipú', label: 'Maipú 📍' },
    { value: 'Las Condes', label: 'Las Condes 📍' },
    { value: 'Providencia', label: 'Providencia 📍' },
    { value: 'Estación Central', label: 'Estación Central 📍' },
    { value: 'Rancagua', label: 'Rancagua 📍' },
    { value: 'Machalí', label: 'Machalí 📍' },
    { value: 'Graneros', label: 'Graneros 📍' },
    { value: 'Codegua', label: 'Codegua 📍' },
    { value: 'Doñihue', label: 'Doñihue 📍' },
    { value: 'Coltauco', label: 'Coltauco 📍' },
    { value: 'Coinco', label: 'Coinco 📍' },
    { value: 'Rengo', label: 'Rengo 📍' },
    { value: 'Requínoa', label: 'Requínoa 📍' },
    { value: 'Olivar', label: 'Olivar 📍' },
    { value: 'Mostazal', label: 'Mostazal 📍' },
    { value: 'San Vicente', label: 'San Vicente 📍' },
    { value: 'Pichidegua', label: 'Pichidegua 📍' },
    { value: 'Peumo', label: 'Peumo 📍' },
    { value: 'Las Cabras', label: 'Las Cabras 📍' },
    { value: 'San Fernando', label: 'San Fernando 📍' },
    { value: 'Chimbarongo', label: 'Chimbarongo 📍' },
    { value: 'Placilla', label: 'Placilla 📍' },
    { value: 'Nancagua', label: 'Nancagua 📍' },
    { value: 'Chépica', label: 'Chépica 📍' },
    { value: 'Santa Cruz', label: 'Santa Cruz 📍' },
    { value: 'Lolol', label: 'Lolol 📍' },
    { value: 'Pumanque', label: 'Pumanque 📍' },
    { value: 'Palmilla', label: 'Palmilla 📍' },
    { value: 'Peralillo', label: 'Peralillo 📍' },
    { value: 'Litueche', label: 'Litueche 📍' },
    { value: 'Rapel', label: 'Rapel 📍' },
    { value: 'Navidad', label: 'Navidad 📍' },
    { value: 'Pichilemu', label: 'Pichilemu 📍' },
    { value: 'Melipilla', label: 'Melipilla 📍' }
  ]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomItems = async () => {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Cargar supermercados personalizados
        const qSupermercados = query(
          collection(db, 'supermercados-personalizados'),
          where('userId', '==', user.uid)
        );
        const supermercadosSnapshot = await getDocs(qSupermercados);
        
        const customSupermercados: SupermercadoItem[] = [];
        supermercadosSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.nombre && data.nombre.trim()) {
            customSupermercados.push({
              value: data.nombre,
              label: `${data.nombre} 🛒`,
              personalizado: true
            });
          }
        });

        // Cargar ubicaciones personalizadas
        const qUbicaciones = query(
          collection(db, 'ubicaciones-personalizadas'),
          where('userId', '==', user.uid)
        );
        const ubicacionesSnapshot = await getDocs(qUbicaciones);
        
        const customUbicaciones: UbicacionItem[] = [];
        ubicacionesSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.nombre && data.nombre.trim()) {
            customUbicaciones.push({
              value: data.nombre,
              label: `${data.nombre} 📍`,
              personalizado: true
            });
          }
        });

        // Combinar: primero los por defecto, luego los personalizados
        setSupermercados([
          ...supermercados,
          ...customSupermercados,
          { value: 'otro', label: 'Otro (personalizar)' }
        ]);

        setUbicaciones([
          ...ubicaciones,
          ...customUbicaciones
        ]);
      } catch (error) {
        console.error('Error fetching custom items:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomItems();
  }, [user?.uid]);

  const agregarSupermercadoPersonalizado = async (nombre: string): Promise<boolean> => {
    if (!user?.uid || !nombre.trim()) return false;

    try {
      // Verificar que no exista ya
      const existe = supermercados.some(s => s.value.toLowerCase() === nombre.toLowerCase());
      if (existe) {
        console.log('Supermercado ya existe en el listado');
        return true;
      }

      await addDoc(collection(db, 'supermercados-personalizados'), {
        userId: user.uid,
        nombre: nombre.trim(),
        createdAt: Timestamp.now()
      });

      // Actualizar estado local
      const newItem = {
        value: nombre.trim(),
        label: `${nombre.trim()} 🛒`,
        personalizado: true
      };
      setSupermercados(prev => [...prev.filter(s => s.value !== 'otro'), newItem, { value: 'otro', label: 'Otro (personalizar)' }]);

      return true;
    } catch (error) {
      console.error('Error adding custom supermercado:', error);
      return false;
    }
  };

  const agregarUbicacionPersonalizada = async (nombre: string): Promise<boolean> => {
    if (!user?.uid || !nombre.trim()) return false;

    try {
      // Verificar que no exista ya
      const existe = ubicaciones.some(u => u.value.toLowerCase() === nombre.toLowerCase());
      if (existe) {
        console.log('Ubicación ya existe en el listado');
        return true;
      }

      await addDoc(collection(db, 'ubicaciones-personalizadas'), {
        userId: user.uid,
        nombre: nombre.trim(),
        createdAt: Timestamp.now()
      });

      // Actualizar estado local
      const newItem = {
        value: nombre.trim(),
        label: `${nombre.trim()} 📍`,
        personalizado: true
      };
      setUbicaciones(prev => [...prev, newItem]);

      return true;
    } catch (error) {
      console.error('Error adding custom ubicacion:', error);
      return false;
    }
  };

  return {
    supermercados,
    ubicaciones,
    loading,
    agregarSupermercadoPersonalizado,
    agregarUbicacionPersonalizada
  };
};
