"use client";

import React, { useState, useEffect, useCallback } from "react";
import styles from "../admin.module.css";

interface ScheduleBlockItem {
  id: string;
  startsAt: string;
  endsAt: string;
  reason: string | null;
  professionalId: string | null;
}

interface ScheduleTabProps {
  slug: string;
  timezone?: string;
}

export default function ScheduleTab({ slug, timezone = "America/Santiago" }: ScheduleTabProps) {
  const [blocks, setBlocks] = useState<ScheduleBlockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  const [isFullDay, setIsFullDay] = useState(true);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");

  const fetchBlocks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/schedule-blocks?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBlocks(data.blocks || []);
      } else {
        setErrorMessage(data.error || "No se pudieron cargar los bloqueos.");
      }
    } catch {
      setErrorMessage("Error de conexión al cargar bloqueos.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!date) {
      setErrorMessage("Por favor selecciona una fecha.");
      return;
    }

    if (!isFullDay && (!startTime || !endTime || startTime >= endTime)) {
      setErrorMessage("La hora de inicio debe ser anterior a la hora de fin.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/schedule-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          date,
          isFullDay,
          startTime: isFullDay ? undefined : startTime,
          endTime: isFullDay ? undefined : endTime,
          reason: reason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Error al crear el bloqueo.");
      } else {
        setSuccessMessage("¡Horario bloqueado con éxito! Se mostrará en rojo como 'Ocupado' en tu web pública.");
        setReason("");
        await fetchBlocks();
      }
    } catch {
      setErrorMessage("Error de red al guardar el bloqueo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlock = async (id: string) => {
    if (!confirm("¿Deseas desbloquear este horario para que vuelva a estar disponible para tus clientes?")) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(`/api/schedule-blocks?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Error al eliminar el bloqueo.");
      } else {
        setSuccessMessage("Horario desbloqueado y disponible nuevamente para reservas.");
        await fetchBlocks();
      }
    } catch {
      setErrorMessage("Error de conexión al eliminar el bloqueo.");
    }
  };

  const formatDateDisplay = (isoStart: string) => {
    try {
      const d = new Date(isoStart);
      return d.toLocaleDateString("es-CL", {
        timeZone: timezone,
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return isoStart;
    }
  };

  const formatHoursDisplay = (isoStart: string, isoEnd: string) => {
    try {
      const dStart = new Date(isoStart);
      const dEnd = new Date(isoEnd);

      const startHour = dStart.toLocaleTimeString("es-CL", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      const endHour = dEnd.toLocaleTimeString("es-CL", {
        timeZone: timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });

      // If it spans from 00:00 to 23:59 or 24h, it's full day
      if (startHour === "00:00" && (endHour === "23:59" || endHour === "00:00")) {
        return "Día Completo";
      }

      return `${startHour} - ${endHour} hrs`;
    } catch {
      return `${isoStart} - ${isoEnd}`;
    }
  };

  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Explicación de estrategia de urgencia / social proof */}
      <section
        style={{
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "14px",
          padding: "18px 20px",
          fontSize: "13.5px",
          color: "#166534",
          lineHeight: "1.6",
          textAlign: "left",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "700", marginBottom: "6px", fontSize: "14.5px" }}>
          <span>💡</span> Estrategia de Urgencia y Demanda Automática
        </div>
        <p style={{ margin: 0 }}>
          Cuando bloquees un día o rango de horas porque no puedas atender (trámites personales, descanso, feriados),
          <strong> esos horarios NO desaparecerán ni dirán &quot;Cerrado&quot;</strong>. En tu página web pública aparecerán en{" "}
          <strong style={{ color: "#b91c1c" }}>ROJO tachado como &quot;Ocupado&quot;</strong>, tal como si clientes reales ya hubieran reservado esas horas.
          Así proteges tu tiempo libre y además proyectas una agenda con altísima demanda, motivando a tus clientes a tomar los cupos disponibles de inmediato.
        </p>
      </section>

      {/* Formulario para bloquear día o rango */}
      <section className={styles.glassCard} style={{ maxWidth: "700px", textAlign: "left" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 6px 0", color: "#0f172a" }}>
          Bloquear Día u Horario
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
          Selecciona una fecha y define si no atenderás durante todo el día o solo en un rango de horas determinado.
        </p>

        <form onSubmit={handleCreateBlock} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Tipo de bloqueo */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
              ¿Qué deseas bloquear?
            </label>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button
                type="button"
                onClick={() => setIsFullDay(true)}
                style={{
                  flex: "1 1 200px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: isFullDay ? "2px solid #0066FF" : "1px solid #e2e8f0",
                  background: isFullDay ? "rgba(0, 102, 255, 0.05)" : "#ffffff",
                  color: isFullDay ? "#0066FF" : "#475569",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>📅</span>
                <div>
                  <div>Día Completo</div>
                  <div style={{ fontSize: "11px", fontWeight: "400", opacity: 0.85 }}>
                    Todo el día aparecerá ocupado en rojo
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setIsFullDay(false)}
                style={{
                  flex: "1 1 200px",
                  padding: "12px 16px",
                  borderRadius: "10px",
                  border: !isFullDay ? "2px solid #0066FF" : "1px solid #e2e8f0",
                  background: !isFullDay ? "rgba(0, 102, 255, 0.05)" : "#ffffff",
                  color: !isFullDay ? "#0066FF" : "#475569",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "16px" }}>⏰</span>
                <div>
                  <div>Rango de Horas</div>
                  <div style={{ fontSize: "11px", fontWeight: "400", opacity: 0.85 }}>
                    Solo ciertas horas de la jornada
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Fecha */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
              Fecha <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              type="date"
              className={styles.formInput}
              style={{ width: "100%", maxWidth: "260px" }}
              value={date}
              min={minDate}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          {/* Horas si no es full day */}
          {!isFullDay && (
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                  Hora Inicio <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="time"
                  className={styles.formInput}
                  style={{ width: "100%" }}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
              <div style={{ flex: "1 1 140px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                  Hora Fin <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="time"
                  className={styles.formInput}
                  style={{ width: "100%" }}
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {/* Motivo interno */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
              Motivo o Nota interna (opcional)
            </label>
            <input
              type="text"
              className={styles.formInput}
              style={{ width: "100%" }}
              placeholder="Ej: Trámites personales, Día de descanso, Feriado..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <small style={{ color: "var(--text-secondary)", fontSize: "11.5px", marginTop: "4px", display: "block" }}>
              Solo visible para ti en este panel de administración. Tus clientes solo verán &quot;Ocupado&quot;.
            </small>
          </div>

          {errorMessage && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {successMessage && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
              ✓ {successMessage}
            </div>
          )}

          <div>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={submitting}
              style={{ minWidth: "240px", background: "#ef4444" }}
            >
              {submitting ? "Bloqueando..." : "⛔ Bloquear (Mostrar como Ocupado)"}
            </button>
          </div>
        </form>
      </section>

      {/* Listado de bloqueos actuales */}
      <section className={styles.glassCard} style={{ maxWidth: "800px", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: "700", margin: "0 0 4px 0" }}>
              Bloqueos Activos y Próximos
            </h3>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0 }}>
              Días y horas que actualmente se muestran en rojo como &quot;Ocupado&quot; al público.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchBlocks}
            disabled={loading}
            style={{
              background: "transparent",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "6px 12px",
              fontSize: "12px",
              cursor: "pointer",
              color: "var(--text-secondary)",
            }}
          >
            {loading ? "Actualizando..." : "🔄 Refrescar"}
          </button>
        </div>

        {loading && blocks.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
            Cargando bloqueos...
          </div>
        ) : blocks.length === 0 ? (
          <div
            style={{
              background: "rgba(0,0,0,0.02)",
              border: "1px dashed #cbd5e1",
              borderRadius: "12px",
              padding: "32px 20px",
              textAlign: "center",
              color: "var(--text-secondary)",
            }}
          >
            <div style={{ fontSize: "28px", marginBottom: "8px" }}>📅</div>
            <div style={{ fontWeight: "600", fontSize: "14px", color: "#1e293b", marginBottom: "4px" }}>
              No tienes ningún día ni horario bloqueado
            </div>
            <div style={{ fontSize: "12.5px" }}>
              Todos tus horarios regulares están abiertos para recibir reservas de clientes.
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {blocks.map((b) => (
              <div
                key={b.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: "10px",
                  border: "1px solid #fee2e2",
                  background: "#fff5f5",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", textTransform: "capitalize" }}>
                      {formatDateDisplay(b.startsAt)}
                    </span>
                    <span
                      style={{
                        background: "#fee2e2",
                        color: "#dc2626",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "700",
                      }}
                    >
                      {formatHoursDisplay(b.startsAt, b.endsAt)}
                    </span>
                    <span
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        padding: "2px 8px",
                        borderRadius: "6px",
                        fontSize: "11px",
                        fontWeight: "600",
                      }}
                    >
                      🔴 En web: Ocupado
                    </span>
                  </div>
                  {b.reason && (
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      Motivo: <em>{b.reason}</em>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteBlock(b.id)}
                  style={{
                    background: "#ffffff",
                    border: "1px solid #cbd5e1",
                    color: "#0f172a",
                    borderRadius: "8px",
                    padding: "6px 14px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#16a34a";
                    e.currentTarget.style.color = "#16a34a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.color = "#0f172a";
                  }}
                >
                  ✓ Desbloquear / Habilitar
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
