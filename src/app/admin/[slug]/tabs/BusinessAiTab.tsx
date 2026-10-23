"use client";

import { useState, useEffect, useCallback } from "react";
import type { DashboardMetrics } from "@/features/businesses/dashboard-metrics";
import styles from "../admin.module.css";

interface BusinessAiTabProps {
  slug: string;
  metrics: DashboardMetrics;
  serviceCount: number;
  professionalCount: number;
  currency: string;
}

function renderBoldText(text: string) {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: "#0f172a", fontWeight: "700" }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
}

function FormattedReport({ text }: { text: string }) {
  const lines = text.split("\n");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", color: "#334155", fontSize: "14px", lineHeight: "1.7" }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} style={{ height: "4px" }} />;
        }

        if (trimmed === "---") {
          return <hr key={idx} style={{ border: "none", borderTop: "1px solid #e2e8f0", margin: "14px 0" }} />;
        }

        // Encabezados H3 o H2 (ej: ### 1. 📊 Diagnóstico...)
        if (trimmed.startsWith("### ") || trimmed.startsWith("## ")) {
          const title = trimmed.replace(/^#{2,3}\s+/, "");
          return (
            <div
              key={idx}
              style={{
                marginTop: "16px",
                marginBottom: "4px",
                padding: "10px 14px",
                background: "#f0f9ff",
                borderLeft: "4px solid #0284c7",
                borderRadius: "0 8px 8px 0",
                fontSize: "15px",
                fontWeight: "700",
                color: "#0369a1",
              }}
            >
              {renderBoldText(title)}
            </div>
          );
        }

        // Listas con viñeta (* o - o •)
        if (trimmed.startsWith("* ") || trimmed.startsWith("- ") || trimmed.startsWith("• ")) {
          const content = trimmed.replace(/^[*•-]\s+/, "");
          return (
            <div key={idx} style={{ display: "flex", gap: "8px", paddingLeft: "12px" }}>
              <span style={{ color: "#0284c7", fontWeight: "700", lineHeight: "1.7" }}>•</span>
              <div style={{ flex: 1 }}>{renderBoldText(content)}</div>
            </div>
          );
        }

        // Listas numeradas (1. , 2. )
        if (/^\d+\.\s+/.test(trimmed)) {
          const numMatch = trimmed.match(/^(\d+\.)\s+(.*)$/);
          if (numMatch) {
            return (
              <div key={idx} style={{ display: "flex", gap: "8px", paddingLeft: "8px", marginTop: "4px" }}>
                <span style={{ fontWeight: "700", color: "#0284c7", minWidth: "22px" }}>{numMatch[1]}</span>
                <div style={{ flex: 1 }}>{renderBoldText(numMatch[2])}</div>
              </div>
            );
          }
        }

        return (
          <p key={idx} style={{ margin: 0 }}>
            {renderBoldText(trimmed)}
          </p>
        );
      })}
    </div>
  );
}

export default function BusinessAiTab({
  slug,
  metrics,
  serviceCount,
  professionalCount,
  currency,
}: BusinessAiTabProps) {
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerateReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "business-report", slug }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudo generar el reporte.");
      }

      setReport(data.report);
      const timestamp = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" });
      setGeneratedAt(timestamp);

      try {
        localStorage.setItem(
          `linki_business_report_${slug}`,
          JSON.stringify({ report: data.report, generatedAt: timestamp })
        );
      } catch {
        // Ignorar quota storage
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al conectar con Linki Business.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  // Cargar reporte previo de localStorage si existe y está completo
  useEffect(() => {
    try {
      const cached = localStorage.getItem(`linki_business_report_${slug}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Validar que el reporte almacenado no sea un fragmento truncado
        if (parsed.report && parsed.report.length > 400 && parsed.report.includes("###")) {
          setReport(parsed.report);
          setGeneratedAt(parsed.generatedAt || null);
          return;
        }
        // Si el reporte previo estaba cortado, limpiar el almacenamiento
        localStorage.removeItem(`linki_business_report_${slug}`);
      }
      // Si no hay reporte válido o estaba cortado, generar automáticamente
      void handleGenerateReport();
    } catch {
      void handleGenerateReport();
    }
  }, [slug, handleGenerateReport]);

  const copyToClipboard = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={styles.glassCard} style={{ padding: "28px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "28px" }}>🧠</span>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--foreground)" }}>
              Linki Business · Consultor Estratégico
            </h2>
            <span style={{ fontSize: "11px", fontWeight: "700", background: "rgba(34, 211, 238, 0.15)", color: "var(--cyan)", padding: "3px 8px", borderRadius: "9999px", border: "1px solid rgba(34, 211, 238, 0.3)" }}>
              Gemini 2.5 Flash
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px", maxWidth: "600px", lineHeight: "1.5" }}>
            Analiza tus reservas reales, servicios más vendidos, facturación y días de menor concurrencia para entregarte diagnósticos y consejos para aumentar tus ventas.
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={loading}
          style={{
            background: "linear-gradient(135deg, #0284c7 0%, #2563eb 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "700",
            cursor: loading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
            transition: "all 0.2s ease",
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <>
              <span className={styles.spinner} style={{ width: 14, height: 14, borderWidth: 2 }} />
              Analizando tu negocio...
            </>
          ) : (
            <>
              <span>⚡️</span>
              {report ? "Actualizar Diagnóstico" : "Generar Diagnóstico con IA"}
            </>
          )}
        </button>
      </div>

      {/* Tarjetas rápidas de datos base */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "14px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600" }}>Total Citas</span>
          <div style={{ fontSize: "22px", fontWeight: "800", marginTop: "4px" }}>{metrics.totalReservations}</div>
        </div>
        <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "14px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600" }}>Ventas Cobradas</span>
          <div style={{ fontSize: "22px", fontWeight: "800", marginTop: "4px", color: "#4ade80" }}>
            ${metrics.totalSales.toLocaleString("es-CL")} {currency}
          </div>
        </div>
        <div style={{ background: "rgba(255, 255, 255, 0.04)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "14px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-secondary)", textTransform: "uppercase", fontWeight: "600" }}>Catálogo Activo</span>
          <div style={{ fontSize: "15px", fontWeight: "700", marginTop: "8px" }}>
            {serviceCount} servicios · {professionalCount} prof.
          </div>
        </div>
      </div>

      {error && (
        <div style={{ padding: "14px 18px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", color: "#ef4444", fontSize: "13px", marginBottom: "20px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "12px", border: "1px dashed var(--card-border)" }}>
          <div style={{ fontSize: "36px", marginBottom: "12px", animation: "pulse 1.5s infinite" }}>🧠</div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>Linki Business está trabajando</h3>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", maxWidth: "420px", margin: "0 auto" }}>
            Examinando tendencias de reservas, días de mayor rentabilidad y redactando tu diagnóstico estratégico...
          </p>
        </div>
      )}

      {!loading && report && (
        <div style={{ background: "#ffffff", border: "1px solid #e2e8f0", borderRadius: "14px", padding: "24px", position: "relative", boxShadow: "0 4px 18px rgba(0,0,0,0.03)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", borderBottom: "1px solid #e2e8f0", paddingBottom: "12px" }}>
            <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", fontWeight: "600" }}>
              📅 Diagnóstico emitido {generatedAt ? `hoy a las ${generatedAt} hrs` : "recientemente"}
            </span>
            <button
              onClick={copyToClipboard}
              style={{
                background: "#f8fafc",
                border: "1px solid #cbd5e1",
                color: copied ? "#16a34a" : "#334155",
                fontSize: "12px",
                fontWeight: "600",
                borderRadius: "8px",
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              {copied ? "✓ Copiado" : "📋 Copiar reporte"}
            </button>
          </div>

          <FormattedReport text={report} />
        </div>
      )}

      {!loading && !report && !error && (
        <div style={{ textAlign: "center", padding: "50px 20px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "12px", border: "1px dashed var(--card-border)" }}>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "16px" }}>
            Aún no has generado tu primer reporte estratégico.
          </p>
          <button
            onClick={handleGenerateReport}
            style={{
              background: "var(--primary)",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "9px 16px",
              fontSize: "13px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Generar Diagnóstico ahora ⚡️
          </button>
        </div>
      )}
    </section>
  );
}
