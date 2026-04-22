// Alen Ovalles
// Last Update: 04/21/2026

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { Auth0Provider } from "@auth0/auth0-react";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Auth0Provider
      domain="dev-6vskvz76oveg8gy6.us.auth0.com"
      clientId="7kOhyL70TcdGiSqatnJlCNREy5ncKVQv"
      authorizationParams={{
        redirect_uri: window.location.origin,
      }}
    >
      <App />
    </Auth0Provider>
  </StrictMode>
);