import { Timestamp, User as FirebaseUser } from 'firebase/firestore';

/**
 * Tipo union para fechas que pueden venir de Firebase
 * Soporta: Timestamp de Firebase, Date nativo, string ISO, timestamp numérico
 */
export type FirebaseDate = Timestamp | Date | string | number | null;

/**
 * Tipo para usuario de Firebase Auth
 */
export type FirebaseAuthUser = FirebaseUser | null;

/**
 * Tipo para metadatos de creación/actualización
 */
export interface FirebaseTimestamps {
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Tipo para documentos de Firestore con ID
 */
export interface FirestoreDocument {
  id: string;
}

/**
 * Helper type para datos con timestamps automáticos
 */
export type WithTimestamps<T> = T & FirebaseTimestamps;

/**
 * Helper type para documentos de Firestore completos
 */
export type FirestoreDoc<T> = T & FirestoreDocument;
