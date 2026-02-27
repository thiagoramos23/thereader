import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { App } from "./App";
import { HttpContentGateway } from "./gateway/httpContentGateway";
import { GatewayProvider } from "./lib/gatewayContext";
import "./styles/main.css";

const queryClient = new QueryClient();
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const gateway = new HttpContentGateway(apiBaseUrl);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <GatewayProvider gateway={gateway}>
        <App />
      </GatewayProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
