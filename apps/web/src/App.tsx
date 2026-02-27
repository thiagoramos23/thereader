import { Navigate, createBrowserRouter, RouterProvider } from "react-router-dom";

import { LibraryRoute } from "./routes/LibraryRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LibraryRoute />
  },
  {
    path: "/article/:articleId",
    element: <LibraryRoute />
  },
  {
    path: "*",
    element: <Navigate to="/" replace />
  }
]);

export function App() {
  return <RouterProvider router={router} />;
}
