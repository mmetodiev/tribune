import { 
  collection, 
  query, 
  orderBy, 
  limit as firestoreLimit, 
  where,
  getDocs,
  onSnapshot,
  Unsubscribe,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Article } from '@/types';

const articlesCollection = collection(db, 'articles');

/**
 * Converts a Firestore document to an Article object
 */
function docToArticle(doc: any): Article {
  return {
    id: doc.id,
    ...doc.data(),
  } as Article;
}

/**
 * Gets recent articles from Firestore
 * @param limit Maximum number of articles to fetch (default: 50)
 * @returns Promise with array of articles
 */
export async function getArticles(limit: number = 50): Promise<Article[]> {
  try {
    const q = query(
      articlesCollection,
      orderBy('fetchedAt', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToArticle);
  } catch (error) {
    console.error('Error fetching articles:', error);
    throw error;
  }
}

/**
 * Gets articles from a specific source
 * @param sourceId The source ID to filter by
 * @param limit Maximum number of articles to fetch (default: 50)
 * @returns Promise with array of articles
 */
export async function getArticlesBySource(
  sourceId: string, 
  limit: number = 50
): Promise<Article[]> {
  try {
    const q = query(
      articlesCollection,
      where('sourceId', '==', sourceId),
      orderBy('fetchedAt', 'desc'),
      firestoreLimit(limit)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToArticle);
  } catch (error) {
    console.error('Error fetching articles by source:', error);
    throw error;
  }
}

/**
 * Gets articles from the last N days
 * @param days Number of days to look back (default: 3)
 * @returns Promise with array of articles
 */
export async function getArticlesFromLastDays(days: number = 3): Promise<Article[]> {
  try {
    // Calculate cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffTimestamp = Timestamp.fromDate(cutoffDate);

    const q = query(
      articlesCollection,
      where('fetchedAt', '>=', cutoffTimestamp),
      orderBy('fetchedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(docToArticle);
  } catch (error) {
    console.error('Error fetching articles from last days:', error);
    throw error;
  }
}

/**
 * Subscribes to real-time article updates
 * @param callback Function to call when articles change
 * @param limit Maximum number of articles to subscribe to (default: 50)
 * @returns Unsubscribe function
 */
export function subscribeToArticles(
  callback: (articles: Article[]) => void,
  limit: number = 50
): Unsubscribe {
  const q = query(
    articlesCollection,
    orderBy('fetchedAt', 'desc'),
    firestoreLimit(limit)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const articles = snapshot.docs.map(docToArticle);
      callback(articles);
    },
    (error) => {
      console.error('Error in articles subscription:', error);
    }
  );
}

/**
 * Subscribes to real-time article updates for a specific source
 * @param sourceId The source ID to filter by
 * @param callback Function to call when articles change
 * @param limit Maximum number of articles to subscribe to (default: 50)
 * @returns Unsubscribe function
 */
export function subscribeToSourceArticles(
  sourceId: string,
  callback: (articles: Article[]) => void,
  limit: number = 50
): Unsubscribe {
  const q = query(
    articlesCollection,
    where('sourceId', '==', sourceId),
    orderBy('fetchedAt', 'desc'),
    firestoreLimit(limit)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const articles = snapshot.docs.map(docToArticle);
      callback(articles);
    },
    (error) => {
      console.error('Error in source articles subscription:', error);
    }
  );
}

