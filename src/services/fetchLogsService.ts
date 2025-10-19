import { 
  collection, 
  query, 
  orderBy, 
  limit as firestoreLimit,
  getDocs,
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { FetchLog } from '@/types';

const fetchLogsCollection = collection(db, 'fetchLogs');

/**
 * Converts a Firestore document to a FetchLog object
 */
function docToFetchLog(doc: any): FetchLog {
  return {
    id: doc.id,
    ...doc.data(),
  } as FetchLog;
}

/**
 * Gets recent fetch logs from Firestore
 * @param limit Maximum number of logs to fetch (default: 10)
 * @returns Promise with array of fetch logs
 */
export async function getFetchLogs(limit: number = 10): Promise<FetchLog[]> {
  try {
    const q = query(
      fetchLogsCollection,
      orderBy('timestamp', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToFetchLog);
  } catch (error) {
    console.error('Error fetching fetch logs:', error);
    throw error;
  }
}

/**
 * Subscribes to real-time fetch log updates
 * @param callback Function to call when logs change
 * @param limit Maximum number of logs to subscribe to (default: 10)
 * @returns Unsubscribe function
 */
export function subscribeToFetchLogs(
  callback: (logs: FetchLog[]) => void,
  limit: number = 10
): Unsubscribe {
  const q = query(
    fetchLogsCollection,
    orderBy('timestamp', 'desc'),
    firestoreLimit(limit)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const logs = snapshot.docs.map(docToFetchLog);
      callback(logs);
    },
    (error) => {
      console.error('Error in fetch logs subscription:', error);
    }
  );
}

