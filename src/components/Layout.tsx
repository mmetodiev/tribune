import { Link, Outlet, useLocation } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
// @ts-ignore - JSX module
import { useAuth } from "@/contexts/auth";
import { useArticlesContext } from "@/contexts/ArticlesContext";

export default function Layout() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");
  const { isAuthenticated } = useAuth();
  const { clearCache } = useArticlesContext();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleRefreshArticles = () => {
    clearCache();
    window.location.reload();
  };

  if (!isAdmin) {
    // User-facing layout (simple header)
    const isHomePage = location.pathname === "/";
    
    return (
      <div className="min-h-screen bg-gray-50">
        {isAuthenticated && (
          <nav className="bg-white shadow">
            <div className="container mx-auto px-4 py-4 flex justify-between items-center">
              <Link to="/" className="text-xl font-bold">
                Tribune
              </Link>
              <div className="flex items-center space-x-4">
                <Link to="/" className="hover:text-blue-600">
                  News
                </Link>
                {isHomePage && (
                  <button
                    onClick={handleRefreshArticles}
                    className="text-gray-600 hover:text-blue-600 flex items-center gap-1"
                    title="Refresh articles"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">Refresh</span>
                  </button>
                )}
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
        )}
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
