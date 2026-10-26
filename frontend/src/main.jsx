import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppLayout from "./App.jsx";
import "./styles/index.css";

const mountPoint = document.getElementById("root");

createRoot(mountPoint).render(
  <BrowserRouter>
    <AppLayout />
  </BrowserRouter>
);
