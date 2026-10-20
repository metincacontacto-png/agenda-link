"use client";

import React, { useEffect, useRef, useState } from "react";
import SecurityCaptcha from "./SecurityCaptcha";

interface TurnstileCaptchaProps {
  onVerify: (verified: boolean, token?: string) => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: (errorCode?: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
          size?: "normal" | "compact" | "flexible";
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
    onTurnstileLoaded?: () => void;
  }
}

const DEFAULT_TEST_SITE_KEY = "1x00000000000000000000AA";

export default function TurnstileCaptcha({ onVerify }: TurnstileCaptchaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const siteKey =
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || DEFAULT_TEST_SITE_KEY;

  useEffect(() => {
    let timer: NodeJS.Timeout;

    function renderWidget() {
      if (!window.turnstile || !containerRef.current) return;
      if (widgetIdRef.current) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: "light",
          callback: (token: string) => {
            onVerify(true, token);
          },
          "expired-callback": () => {
            onVerify(false, "");
          },
          "error-callback": () => {
            // Si Turnstile falla (ej. clave no registrada para el dominio), pasar a fallback seguro
            setUseFallback(true);
          },
        });
        setLoaded(true);
      } catch (err) {
        console.warn("Turnstile render error, falling back:", err);
        setUseFallback(true);
      }
    }

    if (window.turnstile) {
      renderWidget();
    } else {
      // Cargar script de Turnstile si no existe
      const existingScript = document.getElementById("cf-turnstile-script");
      if (!existingScript) {
        const script = document.createElement("script");
        script.id = "cf-turnstile-script";
        script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
        script.async = true;
        script.defer = true;
        script.onload = () => {
          renderWidget();
        };
        script.onerror = () => {
          setUseFallback(true);
        };
        document.head.appendChild(script);
      } else {
        const checkInterval = setInterval(() => {
          if (window.turnstile) {
            clearInterval(checkInterval);
            renderWidget();
          }
        }, 100);
        timer = setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.turnstile) setUseFallback(true);
        }, 4000);
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, onVerify]);

  if (useFallback) {
    return (
      <SecurityCaptcha
        onVerify={(verified) => {
          onVerify(verified, "fallback-math-verified");
        }}
      />
    );
  }

  return (
    <div
      style={{
        marginTop: "12px",
        marginBottom: "14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "65px",
        background: "#f8fafc",
        borderRadius: "10px",
        border: "1px solid #e2e8f0",
        padding: "8px",
      }}
    >
      <div ref={containerRef} />
      {!loaded && (
        <span style={{ fontSize: "12px", color: "#64748b" }}>
          Iniciando verificación segura...
        </span>
      )}
    </div>
  );
}
