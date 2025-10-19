import { 
  collection, 
  query, 
  orderBy, 
  where,
  getDocs,
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Source } from '@/types';

const sourcesCollection = collection(db, 'sources');

/**
 * Converts a Firestore document to a Source object
 */
function docToSource(doc: any): Source {
  return {
    id: doc.id,
    ...doc.data(),
  } as Source;
}

/**
 * Gets all sources from Firestore
 * @returns Promise with array of sources
 */
export async function getSources(): Promise<Source[]> {
  try {
    const q = query(
      sourcesCollection,
      orderBy('priority', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToSource);
  } catch (error) {
    console.error('Error fetching sources:', error);
    throw error;
  }
}

/**
 * Gets only enabled sources from Firestore
 * @returns Promise with array of enabled sources
 */
export async function getEnabledSources(): Promise<Source[]> {
  try {
    const q = query(
      sourcesCollection,
      where('enabled', '==', true),
      orderBy('priority', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToSource);
  } catch (error) {
    console.error('Error fetching enabled sources:', error);
    throw error;
  }
}

/**
 * Subscribes to real-time source updates
 * @param callback Function to call when sources change
 * @returns Unsubscribe function
 */
export function subscribeToSources(
  callback: (sources: Source[]) => void
): Unsubscribe {
  const q = query(
    sourcesCollection,
    orderBy('priority', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const sources = snapshot.docs.map(docToSource);
      callback(sources);
    },
    (error) => {
      console.error('Error in sources subscription:', error);
    }
  );
}

/**
 * Subscribes to real-time enabled sources updates
 * @param callback Function to call when enabled sources change
 * @returns Unsubscribe function
 */
export function subscribeToEnabledSources(
  callback: (sources: Source[]) => void
): Unsubscribe {
  const q = query(
    sourcesCollection,
    where('enabled', '==', true),
    orderBy('priority', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const sources = snapshot.docs.map(docToSource);
      callback(sources);
    },
    (error) => {
      console.error('Error in enabled sources subscription:', error);
    }
  );
}

