"use client";

import { useState, useEffect } from "react";
import { buildDirectWhatsAppUrl } from "@/lib/whatsapp";
import styles from "../admin.module.css";

interface InactiveClient {
  name: string;
  phone: string;
  lastDate: string;
  lastService: string;
  daysAgo: number;
}

interface Campaign {
  id: string;
  title: string;
  target: string;
  message: string;
}

interface MarketingAiTabProps {
  slug: string;
  businessName: string;
}

export default function MarketingAiTab({ slug, businessName }: MarketingAiTabProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [clients, setClients] = useState<InactiveClient[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("1");
  const [customMessage, setCustomMessage] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentClients, setSentClients] = useState<Record<string, boolean>>({});

  const loadCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "marketing-campaign", slug }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "No se pudieron generar las campañas.");
      }

      setCampaigns(data.campaigns || []);
      setClients(data.clients || []);
      if (data.campaigns?.length > 0) {
        setSelectedCampaignId(data.campaigns[0].id);
        setCustomMessage(data.campaigns[0].message);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al conectar con Linki Marketing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const handleSelectCampaign = (camp: Campaign) => {
    setSelectedCampaignId(camp.id);
    setCustomMessage(camp.message);
  };

  const handleSendWhatsApp = (client: InactiveClient) => {
    // Reemplazar [Nombre] con el primer nombre del cliente
    const firstName = client.name.split(" ")[0] || client.name;
    const personalizedText = customMessage.replace(/\[Nombre\]/gi, firstName);
    const url = buildDirectWhatsAppUrl(client.phone, personalizedText);

    // Marcar como enviado localmente
    setSentClients((prev) => ({ ...prev, [client.phone]: true }));

    // Abrir WhatsApp en nueva pestaña
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <section className={styles.glassCard} style={{ padding: "28px" }}>
      {/* Cabecera */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "28px" }}>📈</span>
            <h2 style={{ fontSize: "20px", fontWeight: "800", color: "var(--foreground)" }}>
              Linki Marketing · Reactivación de Clientes
            </h2>
            <span style={{ fontSize: "11px", fontWeight: "700", background: "rgba(124, 58, 237, 0.15)", color: "#c4b5fd", padding: "3px 8px", borderRadius: "9999px", border: "1px solid rgba(124, 58, 237, 0.3)" }}>
              WhatsApp 1 Clic
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px", maxWidth: "600px", lineHeight: "1.5" }}>
            Detecta a los clientes que llevan semanas sin agendar y genera propuestas atractivas para traerlos de vuelta mediante WhatsApp con un solo clic (100% gratis).
          </p>
        </div>

        <button
          onClick={loadCampaigns}
          disabled={loading}
          style={{
            background: "rgba(255, 255, 255, 0.08)",
            color: "var(--foreground)",
            border: "1px solid var(--card-border)",
            borderRadius: "10px",
            padding: "8px 16px",
            fontSize: "12px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          {loading ? "Generando..." : "↻ Regenerar Campañas"}
        </button>
      </div>

      {error && (
        <div style={{ padding: "14px 18px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "10px", color: "#ef4444", fontSize: "13px", marginBottom: "20px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "50px 20px" }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>⚡️</div>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>
            Buscando clientes inactivos y redactando campañas de reactivación con IA...
          </p>
        </div>
      )}

      {!loading && (
        <>
          {/* Selector de Plantillas Generadas */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.5px", display: "block", marginBottom: "10px" }}>
              1. Selecciona la Campaña Generada por Linki Marketing:
            </label>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
              {campaigns.map((camp) => (
                <button
                  key={camp.id}
                  onClick={() => handleSelectCampaign(camp)}
                  style={{
                    textAlign: "left",
                    padding: "14px",
                    borderRadius: "10px",
                    border: selectedCampaignId === camp.id ? "2px solid #a855f7" : "1px solid var(--card-border)",
                    background: selectedCampaignId === camp.id ? "rgba(168, 85, 247, 0.08)" : "rgba(255, 255, 255, 0.03)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--foreground)", marginBottom: "4px" }}>
                    {camp.title}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                    {camp.target}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Editor del Mensaje de WhatsApp */}
          <div style={{ marginBottom: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <label style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
                2. Mensaje para WhatsApp (Puedes editarlo antes de enviar):
              </label>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                Tip: La etiqueta [Nombre] se reemplazará por el nombre de cada cliente.
              </span>
            </div>

            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "10px",
                border: "1px solid var(--card-border)",
                background: "rgba(0, 0, 0, 0.2)",
                color: "var(--foreground)",
                fontSize: "13px",
                lineHeight: "1.5",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />
          </div>

          {/* Listado de Clientes Inactivos */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
              <label style={{ fontSize: "12px", textTransform: "uppercase", fontWeight: "700", color: "var(--text-secondary)", letterSpacing: "0.5px" }}>
                3. Clientes Detectados ({clients.length}):
              </label>
              <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                Ordenados por tiempo sin agendar
              </span>
            </div>

            {clients.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", background: "rgba(255, 255, 255, 0.02)", borderRadius: "10px", border: "1px dashed var(--card-border)" }}>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                  Aún no tienes clientes registrados con citas anteriores para reactivar. En cuanto recibas reservas, aparecerán aquí.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {clients.map((client) => {
                  const wasSent = sentClients[client.phone];
                  return (
                    <div
                      key={client.phone}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "12px 16px",
                        borderRadius: "10px",
                        border: "1px solid var(--card-border)",
                        background: wasSent ? "rgba(74, 222, 128, 0.05)" : "rgba(255, 255, 255, 0.02)",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{ fontWeight: "700", fontSize: "14px" }}>{client.name}</span>
                          <span
                            style={{
                              fontSize: "11px",
                              padding: "2px 8px",
                              borderRadius: "9999px",
                              background: client.daysAgo > 30 ? "rgba(239, 68, 68, 0.15)" : "rgba(234, 179, 8, 0.15)",
                              color: client.daysAgo > 30 ? "#f87171" : "#facc15",
                              fontWeight: "600",
                            }}
                          >
                            {client.daysAgo === 0 ? "Hoy" : `Hace ${client.daysAgo} días`}
                          </span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>
                          Último servicio: {client.lastService} · Tel: {client.phone}
                        </div>
                      </div>

                      <button
                        onClick={() => handleSendWhatsApp(client)}
                        style={{
                          background: wasSent ? "rgba(255, 255, 255, 0.1)" : "#25D366",
                          color: wasSent ? "var(--text-secondary)" : "#000",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 14px",
                          fontSize: "12px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          boxShadow: wasSent ? "none" : "0 2px 8px rgba(37, 211, 102, 0.3)",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {wasSent ? "✓ Enviado (Reenviar)" : "📲 Enviar WhatsApp (1 Clic)"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}
