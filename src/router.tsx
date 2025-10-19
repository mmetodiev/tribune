import { createBrowserRouter, Navigate } from "react-router-dom";
import Layout from "@/components/Layout";

// Admin pages
import Dashboard from "@/admin/Dashboard";
import SourcesManager from "@/admin/SourcesManager";
import ArticlesBrowser from "@/admin/ArticlesBrowser";
import Settings from "@/admin/Settings";

// User pages
import NewsView from "@/user/NewsView";

// Auth pages (from existing modules)
// @ts-ignore - JSX module
import Auth from "@/modules/auth";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Auth />,
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        index: true,
        element: <NewsView />,
      },
      {
        path: "admin",
        children: [
          {
            index: true,
            element: <Dashboard />,
          },
          {
            path: "sources",
            element: <SourcesManager />,
          },
          {
            path: "articles",
            element: <ArticlesBrowser />,
          },
          {
            path: "settings",
            element: <Settings />,
          },
        ],
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export default router;
