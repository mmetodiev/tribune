import { 
  collection, 
  query, 
  orderBy, 
  where,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Source, SourceFormData } from '@/types';

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

/**
 * Creates a new RSS source
 * @param sourceData Source form data
 * @returns Promise with the created source ID
 */
export async function createSource(sourceData: SourceFormData): Promise<string> {
  try {
    const docRef = await addDoc(sourcesCollection, {
      ...sourceData,
      type: 'rss', // Always RSS
      enabled: sourceData.enabled ?? true,
      status: 'active',
      consecutiveFailures: 0,
      totalArticlesFetched: 0,
      averageArticlesPerFetch: 0,
      errorMessage: '',
      lastFetchedAt: null,
      lastSuccessAt: null,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error creating source:', error);
    throw error;
  }
}

/**
 * Updates an existing source
 * @param id Source ID
 * @param updates Partial source data to update
 */
export async function updateSource(id: string, updates: Partial<Source>): Promise<void> {
  try {
    const sourceRef = doc(db, 'sources', id);
    await updateDoc(sourceRef, updates);
  } catch (error) {
    console.error('Error updating source:', error);
    throw error;
  }
}

/**
 * Deletes a source
 * @param id Source ID
 */
export async function deleteSource(id: string): Promise<void> {
  try {
    const sourceRef = doc(db, 'sources', id);
    await deleteDoc(sourceRef);
  } catch (error) {
    console.error('Error deleting source:', error);
    throw error;
  }
}

/**
 * Toggles source enabled/disabled status
 * @param id Source ID
 */
export async function toggleSource(id: string): Promise<void> {
  try {
    const sourceRef = doc(db, 'sources', id);
    const sourceSnap = await getDoc(sourceRef);
    
    if (!sourceSnap.exists()) {
      throw new Error('Source not found');
    }
    
    const current = sourceSnap.data();
    await updateDoc(sourceRef, { 
      enabled: !current.enabled,
      status: !current.enabled ? 'active' : 'disabled'
    });
  } catch (error) {
    console.error('Error toggling source:', error);
    throw error;
  }
}

/**
 * Gets a single source by ID
 * @param id Source ID
 * @returns Promise with source or null if not found
 */
export async function getSourceById(id: string): Promise<Source | null> {
  try {
    const sourceRef = doc(db, 'sources', id);
    const sourceSnap = await getDoc(sourceRef);
    
    if (!sourceSnap.exists()) {
      return null;
    }
    
    return docToSource(sourceSnap);
  } catch (error) {
    console.error('Error fetching source by ID:', error);
    throw error;
  }
}

