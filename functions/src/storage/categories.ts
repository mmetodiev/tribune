import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { logger } from "firebase-functions/v2";
import type { Category, CategoryRules } from "../types/index.js";

const db = getFirestore();
const categoriesCollection = db.collection("categories");

/**
 * Interface for creating a new category (without auto-generated fields)
 */
export interface CreateCategoryData {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  icon?: string;
  rules?: CategoryRules;
  order?: number;
}

/**
 * Creates a new category
 */
export async function addCategory(
  categoryData: CreateCategoryData
): Promise<string> {
  try {
    const newCategory: Omit<Category, "id"> = {
      name: categoryData.name,
      slug: categoryData.slug,
      description: categoryData.description || "",
      color: categoryData.color || "#6366f1", // Default indigo color
      icon: categoryData.icon || "📰",
      rules: categoryData.rules || { keywords: [], sources: [], domains: [] },
      order: categoryData.order || 0,
      createdAt: Timestamp.now(),
    };

    const docRef = await categoriesCollection.add(newCategory);
    logger.info(`Created new category: ${categoryData.name}`, { id: docRef.id });

    return docRef.id;
  } catch (error) {
    logger.error("Failed to create category", { error });
    throw error;
  }
}

/**
 * Updates an existing category
 */
export async function updateCategory(
  id: string,
  updates: Partial<Category>
): Promise<void> {
  try {
    await categoriesCollection.doc(id).update(updates);
    logger.info(`Updated category: ${id}`);
  } catch (error) {
    logger.error("Failed to update category", { id, error });
    throw error;
  }
}

/**
 * Deletes a category
 */
export async function deleteCategory(id: string): Promise<void> {
  try {
    await categoriesCollection.doc(id).delete();
    logger.info(`Deleted category: ${id}`);
  } catch (error) {
    logger.error("Failed to delete category", { id, error });
    throw error;
  }
}

/**
 * Retrieves a single category by ID
 */
export async function getCategory(id: string): Promise<Category | null> {
  try {
    const doc = await categoriesCollection.doc(id).get();
    if (!doc.exists) {
      return null;
    }

    return { id: doc.id, ...doc.data() } as Category;
  } catch (error) {
    logger.error("Failed to get category", { id, error });
    throw error;
  }
}

/**
 * Retrieves all categories ordered by order field
 */
export async function getAllCategories(): Promise<Category[]> {
  try {
    const snapshot = await categoriesCollection.orderBy("order").get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Category[];
  } catch (error) {
    logger.error("Failed to get all categories", { error });
    throw error;
  }
}

/**
 * Retrieves or creates the default "Uncategorized" category
 */
export async function getOrCreateUncategorized(): Promise<string> {
  try {
    // Check if uncategorized category exists
    const snapshot = await categoriesCollection
      .where("slug", "==", "uncategorized")
      .limit(1)
      .get();

    if (!snapshot.empty) {
      return snapshot.docs[0].id;
    }

    // Create it if it doesn't exist
    const categoryId = await addCategory({
      name: "Uncategorized",
      slug: "uncategorized",
      description: "Articles that don't match any category rules",
      color: "#9ca3af", // Gray color
      icon: "📋",
      rules: { keywords: [], sources: [], domains: [] },
      order: 999, // Put it at the end
    });

    return categoryId;
  } catch (error) {
    logger.error("Failed to get or create uncategorized category", { error });
    throw error;
  }
}
