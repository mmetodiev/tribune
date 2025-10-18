import { RouterProvider } from "react-router-dom";
import router from "@/router";

export default function App() {
  return (
    <div className="w-full min-h-screen">
      <RouterProvider router={router} />
    </div>
  );
}
