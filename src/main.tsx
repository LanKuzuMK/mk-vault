import { createRoot } from "react-dom/client";
import { VaultApp } from "./VaultApp";
import "./index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(<VaultApp />);
}
