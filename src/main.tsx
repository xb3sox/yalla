import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.tsx";
import { SentryErrorBoundary } from "./components/SentryErrorBoundary.tsx";

const SENSITIVE_KEYS = ["password", "cardnumber", "cvv", "jwt", "token"];

function sanitizeData(data: any): any {
  if (!data || typeof data !== "object") return data;
  if (Array.isArray(data)) return data.map(sanitizeData);

  const sanitized: Record<string, any> = {};
  for (const key of Object.keys(data)) {
    if (SENSITIVE_KEYS.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof data[key] === "object" && data[key] !== null) {
      sanitized[key] = sanitizeData(data[key]);
    } else {
      sanitized[key] = data[key];
    }
  }
  return sanitized;
}

// Initialize Sentry with performance monitoring and session replay
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "https://exampleDSN@o0.ingest.sentry.io/0",
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  beforeSend(event) {
    if (event.request) {
      if (event.request.headers) {
        event.request.headers = sanitizeData(event.request.headers);
      }
      if (event.request.data) {
        event.request.data = sanitizeData(event.request.data);
      }
    }
    if (event.extra) {
      event.extra = sanitizeData(event.extra);
    }
    return event;
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <SentryErrorBoundary>
      <App />
    </SentryErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for PWA support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
