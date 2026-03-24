import { createRoot } from "react-dom/client";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import App from "./App";
import "./index.css";

// Tell the API client how to retrieve the JWT token on every request.
// This must be registered before any API calls are made so that the
// Authorization: Bearer <token> header is attached automatically.
setAuthTokenGetter(() => localStorage.getItem("ai_cfo_token"));

createRoot(document.getElementById("root")!).render(<App />);
