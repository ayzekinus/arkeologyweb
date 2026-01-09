import React from "react";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import Layout from "./layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";

import AnakodCreate from "./pages/AnakodCreate.jsx";
import AnakodList from "./pages/AnakodList.jsx";
import BuluntuCreate from "./pages/BuluntuCreate.jsx";
import BuluntuList from "./pages/BuluntuList.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },

      {
        path: "anakod",
        children: [
          { index: true, element: <Navigate to="olustur" replace /> },
          { path: "olustur", element: <AnakodCreate /> },
          { path: "listele", element: <AnakodList /> },
        ],
      },

      {
        path: "buluntu",
        children: [
          { index: true, element: <Navigate to="olustur" replace /> },
          { path: "olustur", element: <BuluntuCreate /> },
          { path: "listele", element: <BuluntuList /> },
        ],
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
