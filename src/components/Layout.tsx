import { Link, Outlet, useLocation } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";

export default function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (!isAdmin) {
    // User-facing layout (simple header)
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="bg-white shadow">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <Link to="/" className="text-xl font-bold">
              Tribune
            </Link>
            <div className="space-x-4">
              <Link to="/" className="hover:text-blue-600">
                News
              </Link>
              <Link to="/admin" className="hover:text-blue-600">
                Admin
              </Link>
              <button
                onClick={handleSignOut}
                className="text-gray-600 hover:text-red-600"
              >
                Sign Out
              </button>
            </div>
          </div>
        </nav>
        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  // Admin layout with sidebar
  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-blue-600">Tribune Admin</h1>
        </div>
        <nav className="mt-6">
          <Link
            to="/admin"
            className={`block px-6 py-3 ${
              location.pathname === "/admin"
                ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Dashboard
          </Link>
          <Link
            to="/admin/sources"
            className={`block px-6 py-3 ${
              location.pathname === "/admin/sources"
                ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Sources
          </Link>
          <Link
            to="/admin/categories"
            className={`block px-6 py-3 ${
              location.pathname === "/admin/categories"
                ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Categories
          </Link>
          <Link
            to="/admin/articles"
            className={`block px-6 py-3 ${
              location.pathname === "/admin/articles"
                ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Articles
          </Link>
          <Link
            to="/admin/settings"
            className={`block px-6 py-3 ${
              location.pathname === "/admin/settings"
                ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Settings
          </Link>
        </nav>
        <div className="absolute bottom-0 w-64 p-6 border-t">
          <button
            onClick={handleSignOut}
            className="w-full text-left text-gray-600 hover:text-red-600"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
}
