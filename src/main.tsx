import { createRoot } from "react-dom/client";
import App from './app/App.tsx';
// @ts-ignore: CSS module import without type declarations
import './index.css';

createRoot(document.getElementById("root")!).render(<App />);
