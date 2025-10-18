import { useState, useEffect } from "react";
import { Category } from "@/types";
import { getCategories, deleteCategory as deleteCategoryAPI } from "@/lib/api";
import AddCategoryModal from "./components/AddCategoryModal";
import EditCategoryModal from "./components/EditCategoryModal";

export default function CategoriesManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getCategories();
      if (result.success) {
        setCategories(result.categories);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleDelete = async (id: string, name: string, slug: string) => {
    // Prevent deletion of the uncategorized category
    if (slug === "uncategorized") {
      alert("Cannot delete the Uncategorized category - it's required by the system.");
      return;
    }

    if (!confirm(`Are you sure you want to delete "${name}"? Articles in this category will be moved to Uncategorized.`)) {
      return;
    }

    try {
      await deleteCategoryAPI(id);
      await loadCategories();
    } catch (err: any) {
      alert("Failed to delete category: " + err.message);
    }
  };

  const handleEdit = (category: Category) => {
    // Prevent editing the uncategorized category's slug
    setEditingCategory(category);
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-center text-gray-600">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-center text-red-600">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories Manager</h1>
          <p className="text-gray-600 mt-1">
            Organize your articles by creating categories with automatic matching rules
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Category
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <p className="text-gray-600 mb-4">No categories configured yet</p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Create Your First Category
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rules
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{category.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {category.name}
                        </div>
                        <div className="text-sm text-gray-500">{category.slug}</div>
                      </div>
                      <div
                        className="ml-3 w-6 h-6 rounded-full border-2 border-gray-300"
                        style={{ backgroundColor: category.color }}
                        title={category.color}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {category.description || <span className="text-gray-400 italic">No description</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-gray-600">
                      <div>
                        <span className="font-semibold">Keywords:</span>{" "}
                        {category.rules.keywords.length > 0 ? (
                          <span className="text-gray-900">{category.rules.keywords.length}</span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold">Sources:</span>{" "}
                        {category.rules.sources.length > 0 ? (
                          <span className="text-gray-900">{category.rules.sources.length}</span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                      <div>
                        <span className="font-semibold">Domains:</span>{" "}
                        {category.rules.domains.length > 0 ? (
                          <span className="text-gray-900">{category.rules.domains.length}</span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.order}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(category)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category.id, category.name, category.slug)}
                      className={`${
                        category.slug === "uncategorized"
                          ? "text-gray-400 cursor-not-allowed"
                          : "text-red-600 hover:text-red-900"
                      }`}
                      disabled={category.slug === "uncategorized"}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">How Categorization Works</h3>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li><strong>Keywords:</strong> Articles with these words in their title or summary will match this category</li>
          <li><strong>Sources:</strong> All articles from selected sources will automatically be added to this category</li>
          <li><strong>Domains:</strong> Articles from websites matching these domains will be categorized here</li>
          <li><strong>Order:</strong> Lower numbers appear first in the UI (0-999)</li>
        </ul>
      </div>

      {showAddModal && (
        <AddCategoryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            loadCategories();
          }}
        />
      )}

      {editingCategory && (
        <EditCategoryModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSuccess={() => {
            setEditingCategory(null);
            loadCategories();
          }}
        />
      )}
    </div>
  );
}
