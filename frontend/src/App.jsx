import React from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Anakod from "./pages/Anakod.jsx";
import Buluntu from "./pages/Buluntu.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Dashboard /> },
      { path: "anakod", element: <Anakod /> },
      { path: "buluntu", element: <Buluntu /> },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}
