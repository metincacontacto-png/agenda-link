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

interface DayScheduleState {
  dayOfWeek: number;
  name: string;
  enabled: boolean;
  startTime: string;
  endTime: string;
}

const DEFAULT_WEEKLY_DAYS: DayScheduleState[] = [
  { dayOfWeek: 1, name: "Lunes", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 2, name: "Martes", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 3, name: "Miércoles", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 4, name: "Jueves", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 5, name: "Viernes", enabled: true, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 6, name: "Sábado", enabled: false, startTime: "09:00", endTime: "18:00" },
  { dayOfWeek: 0, name: "Domingo", enabled: false, startTime: "09:00", endTime: "18:00" },
];

function minuteToTimeString(minute: number): string {
  const h = Math.floor(minute / 60);
  const m = minute % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function getTodayLocalDate(tz: string): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().split("T")[0];
  }
}

function parseBlockInterval(startsAt: string, endsAt: string, tz: string) {
  const dStart = new Date(startsAt);
  const dEnd = new Date(endsAt);

  // In our scheduling system, localDayUtcRange ends at 00:00 of date + 1 day.
  // Subtracting 1s (1000ms) places the end boundary at 23:59:59 of the target day.
  const dEndAdjusted = new Date(dEnd.getTime() - 1000);

  let startCalDate = "";
  let endCalDate = "";
  try {
    startCalDate = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(dStart);
    endCalDate = new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(dEndAdjusted);
  } catch {
    startCalDate = startsAt.slice(0, 10);
    endCalDate = endsAt.slice(0, 10);
  }

  const isMultiDay = startCalDate !== endCalDate;

  // Calculate number of civil days blocked
  const [sy, sm, sd] = startCalDate.split("-").map(Number);
  const [ey, em, ed] = endCalDate.split("-").map(Number);
  const utcStart = Date.UTC(sy, sm - 1, sd);
  const utcEnd = Date.UTC(ey, em - 1, ed);
  const daysCount = Math.max(1, Math.round((utcEnd - utcStart) / (1000 * 60 * 60 * 24)) + 1);

  return {
    isMultiDay,
    daysCount,
    startCalDate,
    endCalDate,
    dStart,
    dEnd,
    dEndAdjusted,
  };
}

function formatMultiDayRange(dStart: Date, dEndAdjusted: Date, tz: string, daysCount: number): string {
  try {
    const startParts = new Intl.DateTimeFormat("es-CL", {
      timeZone: tz,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(dStart);

    const endParts = new Intl.DateTimeFormat("es-CL", {
      timeZone: tz,
      day: "numeric",
      month: "long",
      year: "numeric",
    }).formatToParts(dEndAdjusted);

    const startDay = startParts.find((p) => p.type === "day")?.value;
    const startMonth = startParts.find((p) => p.type === "month")?.value;
    const startYear = startParts.find((p) => p.type === "year")?.value;

    const endDay = endParts.find((p) => p.type === "day")?.value;
    const endMonth = endParts.find((p) => p.type === "month")?.value;
    const endYear = endParts.find((p) => p.type === "year")?.value;

    let rangeText = "";
    if (startYear === endYear) {
      if (startMonth === endMonth) {
        rangeText = `Del ${startDay} al ${endDay} de ${endMonth} de ${endYear}`;
      } else {
        rangeText = `Del ${startDay} de ${startMonth} al ${endDay} de ${endMonth} de ${endYear}`;
      }
    } else {
      rangeText = `Del ${startDay} de ${startMonth} de ${startYear} al ${endDay} de ${endMonth} de ${endYear}`;
    }

    const daysLabel = daysCount === 1 ? "1 día bloqueado" : `${daysCount} días bloqueados`;
    return `${rangeText} (${daysLabel})`;
  } catch {
    return `Del ${dStart.toLocaleDateString("es-CL")} al ${dEndAdjusted.toLocaleDateString("es-CL")} (${daysCount} días bloqueados)`;
  }
}

export default function ScheduleTab({ slug, timezone = "America/Santiago" }: ScheduleTabProps) {
  // Block state
  const [blocks, setBlocks] = useState<ScheduleBlockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states for Block Selector
  const todayDate = getTodayLocalDate(timezone);
  const [blockMode, setBlockMode] = useState<"range" | "day" | "custom_hours">("range");
  const [startDate, setStartDate] = useState(todayDate);
  const [endDate, setEndDate] = useState(todayDate);
  const [singleDate, setSingleDate] = useState(todayDate);
  const [startTime, setStartTime] = useState("14:00");
  const [endTime, setEndTime] = useState("18:00");
  const [reason, setReason] = useState("");

  // Weekly Schedule state
  const [weeklySchedule, setWeeklySchedule] = useState<DayScheduleState[]>(DEFAULT_WEEKLY_DAYS);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [savingSchedule, setSavingSchedule] = useState(false);
  const [scheduleErrorMessage, setScheduleErrorMessage] = useState<string | null>(null);
  const [scheduleSuccessMessage, setScheduleSuccessMessage] = useState<string | null>(null);

  // Fetch Blocks
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

  // Fetch Weekly Base Schedule
  const fetchWeeklySchedule = useCallback(async () => {
    try {
      setLoadingSchedule(true);
      const res = await fetch(`/api/business-schedule?slug=${encodeURIComponent(slug)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        const apiSchedules: Array<{ dayOfWeek: number; startMinute: number; endMinute: number }> =
          data.schedules || [];
        if (apiSchedules.length > 0) {
          setWeeklySchedule(
            DEFAULT_WEEKLY_DAYS.map((day) => {
              const match = apiSchedules.find((s) => s.dayOfWeek === day.dayOfWeek);
              if (match) {
                return {
                  ...day,
                  enabled: true,
                  startTime: minuteToTimeString(match.startMinute),
                  endTime: minuteToTimeString(match.endMinute),
                };
              }
              return {
                ...day,
                enabled: false,
                startTime: "09:00",
                endTime: "18:00",
              };
            })
          );
        }
      } else {
        setScheduleErrorMessage(data.error || "No se pudo cargar el horario base.");
      }
    } catch {
      setScheduleErrorMessage("Error de conexión al cargar el horario base.");
    } finally {
      setLoadingSchedule(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchBlocks();
    fetchWeeklySchedule();
  }, [fetchBlocks, fetchWeeklySchedule]);

  // Handle Weekly Schedule Toggle
  const handleToggleDay = (dayOfWeek: number) => {
    setScheduleErrorMessage(null);
    setScheduleSuccessMessage(null);
    setWeeklySchedule((prev) =>
      prev.map((d) => {
        if (d.dayOfWeek === dayOfWeek) {
          const nextEnabled = !d.enabled;
          return {
            ...d,
            enabled: nextEnabled,
            startTime: d.startTime || "09:00",
            endTime: d.endTime || "18:00",
          };
        }
        return d;
      })
    );
  };

  // Handle Weekly Schedule Time Change
  const handleDayTimeChange = (dayOfWeek: number, field: "startTime" | "endTime", value: string) => {
    setScheduleErrorMessage(null);
    setScheduleSuccessMessage(null);
    setWeeklySchedule((prev) =>
      prev.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, [field]: value } : d))
    );
  };

  // Save Weekly Schedule
  const handleSaveWeeklySchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setScheduleErrorMessage(null);
    setScheduleSuccessMessage(null);

    for (const day of weeklySchedule) {
      if (day.enabled) {
        if (!day.startTime || !day.endTime) {
          setScheduleErrorMessage(`El día ${day.name} requiere hora de inicio y fin.`);
          return;
        }
        if (day.startTime >= day.endTime) {
          setScheduleErrorMessage(
            `En ${day.name}, la hora de inicio (${day.startTime}) debe ser anterior a la de fin (${day.endTime}).`
          );
          return;
        }
      }
    }

    setSavingSchedule(true);
    try {
      const res = await fetch("/api/business-schedule", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          days: weeklySchedule.map((d) => ({
            dayOfWeek: d.dayOfWeek,
            enabled: d.enabled,
            startTime: d.startTime,
            endTime: d.endTime,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setScheduleErrorMessage(data.error || "Error al actualizar el horario base.");
      } else {
        setScheduleSuccessMessage("¡Horario semanal base guardado con éxito!");
        await fetchWeeklySchedule();
      }
    } catch {
      setScheduleErrorMessage("Error de red al guardar el horario base.");
    } finally {
      setSavingSchedule(false);
    }
  };

  // Create Block
  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (blockMode === "range") {
      if (!startDate || !endDate) {
        setErrorMessage("Por favor selecciona la fecha de inicio y de término.");
        return;
      }
      if (startDate > endDate) {
        setErrorMessage("La fecha de término debe ser igual o posterior a la fecha de inicio.");
        return;
      }
    } else if (blockMode === "day") {
      if (!singleDate) {
        setErrorMessage("Por favor selecciona una fecha.");
        return;
      }
    } else if (blockMode === "custom_hours") {
      if (!singleDate) {
        setErrorMessage("Por favor selecciona una fecha.");
        return;
      }
      if (!startTime || !endTime || startTime >= endTime) {
        setErrorMessage("La hora de inicio debe ser anterior a la hora de fin.");
        return;
      }
    }

    setSubmitting(true);
    try {
      let payload: Record<string, unknown> = { slug };

      if (blockMode === "range") {
        payload = {
          slug,
          mode: "range",
          startDate,
          endDate,
          reason: reason.trim() || undefined,
        };
      } else if (blockMode === "day") {
        payload = {
          slug,
          mode: "day",
          date: singleDate,
          reason: reason.trim() || undefined,
        };
      } else if (blockMode === "custom_hours") {
        payload = {
          slug,
          mode: "custom_hours",
          date: singleDate,
          startTime,
          endTime,
          reason: reason.trim() || undefined,
        };
      }

      const res = await fetch("/api/schedule-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Error al crear el bloqueo.");
      } else {
        setSuccessMessage(
          blockMode === "range"
            ? "¡Período bloqueado con éxito! Se mostrará en rojo como 'Ocupado' en tu web pública."
            : blockMode === "day"
            ? "¡Día bloqueado con éxito! Se mostrará en rojo como 'Ocupado' en tu web pública."
            : "¡Horario bloqueado con éxito! Se mostrará en rojo como 'Ocupado' en tu web pública."
        );
        setReason("");
        await fetchBlocks();
      }
    } catch {
      setErrorMessage("Error de red al guardar el bloqueo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete / Unlock Block
  const handleDeleteBlock = async (id: string, isMultiDay: boolean) => {
    const confirmMsg = isMultiDay
      ? "¿Deseas desbloquear este período completo para que vuelva a estar disponible para tus clientes?"
      : "¿Deseas desbloquear este horario para que vuelva a estar disponible para tus clientes?";

    if (!confirm(confirmMsg)) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch(
        `/api/schedule-blocks?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );
      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "Error al eliminar el bloqueo.");
      } else {
        setSuccessMessage(
          isMultiDay
            ? "Período desbloqueado y disponible nuevamente para reservas."
            : "Horario desbloqueado y disponible nuevamente para reservas."
        );
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

      if (startHour === "00:00" && (endHour === "23:59" || endHour === "00:00")) {
        return "Día Completo";
      }

      return `${startHour} - ${endHour} hrs`;
    } catch {
      return `${isoStart} - ${isoEnd}`;
    }
  };

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

      {/* 1. Tarjeta: Horario Semanal Base (Días de Atención) */}
      <section className={styles.glassCard} style={{ maxWidth: "720px", textAlign: "left" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 6px 0", color: "#0f172a" }}>
              Horario Semanal Base (Días de Atención)
            </h2>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
              Configura qué días de la semana y en qué horario atiende tu negocio de forma regular.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchWeeklySchedule}
            disabled={loadingSchedule}
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
            {loadingSchedule ? "Cargando..." : "🔄 Recargar"}
          </button>
        </div>

        {loadingSchedule && weeklySchedule.length === 0 ? (
          <div style={{ padding: "20px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
            Cargando horario semanal base...
          </div>
        ) : (
          <form onSubmit={handleSaveWeeklySchedule} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {weeklySchedule.map((d) => (
                <div
                  key={d.dayOfWeek}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 14px",
                    borderRadius: "10px",
                    border: d.enabled ? "1px solid #bfdbfe" : "1px solid #e2e8f0",
                    background: d.enabled ? "rgba(0, 102, 255, 0.02)" : "#fafafa",
                    gap: "12px",
                    flexWrap: "wrap",
                  }}
                >
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      cursor: "pointer",
                      minWidth: "120px",
                      userSelect: "none",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={d.enabled}
                      onChange={() => handleToggleDay(d.dayOfWeek)}
                      style={{
                        width: "18px",
                        height: "18px",
                        accentColor: "#0066FF",
                        cursor: "pointer",
                      }}
                    />
                    <span
                      style={{
                        fontWeight: "700",
                        fontSize: "14px",
                        color: d.enabled ? "#0f172a" : "#94a3b8",
                      }}
                    >
                      {d.name}
                    </span>
                  </label>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {d.enabled ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Desde</span>
                          <input
                            type="time"
                            className={styles.formInput}
                            style={{ width: "115px", padding: "6px 8px", fontSize: "13px" }}
                            value={d.startTime}
                            onChange={(e) => handleDayTimeChange(d.dayOfWeek, "startTime", e.target.value)}
                            required={d.enabled}
                          />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Hasta</span>
                          <input
                            type="time"
                            className={styles.formInput}
                            style={{ width: "115px", padding: "6px 8px", fontSize: "13px" }}
                            value={d.endTime}
                            onChange={(e) => handleDayTimeChange(d.dayOfWeek, "endTime", e.target.value)}
                            required={d.enabled}
                          />
                          <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>hrs</span>
                        </div>
                      </div>
                    ) : (
                      <span
                        style={{
                          background: "#f1f5f9",
                          color: "#64748b",
                          border: "1px solid #e2e8f0",
                          padding: "4px 12px",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: "600",
                        }}
                      >
                        Cerrado
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {scheduleErrorMessage && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                ⚠️ {scheduleErrorMessage}
              </div>
            )}

            {scheduleSuccessMessage && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                ✓ {scheduleSuccessMessage}
              </div>
            )}

            <div>
              <button
                type="submit"
                className={styles.submitButton}
                disabled={savingSchedule}
                style={{ minWidth: "220px", background: "#0066FF" }}
              >
                {savingSchedule ? "Guardando..." : "💾 Guardar Horario Base"}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* 2. Formulario para bloquear período, día o rango de horas */}
      <section className={styles.glassCard} style={{ maxWidth: "720px", textAlign: "left" }}>
        <h2 style={{ fontSize: "18px", fontWeight: "700", margin: "0 0 6px 0", color: "#0f172a" }}>
          Bloquear Período, Día u Horas
        </h2>
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "0 0 20px 0" }}>
          Selecciona si deseas bloquear un período extendido (vacaciones o semanas libres), un día completo o un rango de horas determinado.
        </p>

        <form onSubmit={handleCreateBlock} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
          {/* Selector de 3 opciones */}
          <div>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>
              ¿Qué deseas bloquear?
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
              {/* Opción 1: Rango Extendido (default o destacado) */}
              <button
                type="button"
                onClick={() => setBlockMode("range")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: blockMode === "range" ? "2px solid #0066FF" : "1px solid #e2e8f0",
                  background: blockMode === "range" ? "rgba(0, 102, 255, 0.05)" : "#ffffff",
                  color: blockMode === "range" ? "#0066FF" : "#475569",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  boxShadow: blockMode === "range" ? "0 0 0 1px #0066FF inset" : "none",
                }}
              >
                <span style={{ fontSize: "20px", lineHeight: "1" }}>🏖️</span>
                <div>
                  <div style={{ fontWeight: "700" }}>Rango Extendido</div>
                  <div style={{ fontSize: "11px", fontWeight: "400", opacity: 0.85, marginTop: "2px" }}>
                    Semana, Mes o Vacaciones
                  </div>
                </div>
              </button>

              {/* Opción 2: Día Completo */}
              <button
                type="button"
                onClick={() => setBlockMode("day")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: blockMode === "day" ? "2px solid #0066FF" : "1px solid #e2e8f0",
                  background: blockMode === "day" ? "rgba(0, 102, 255, 0.05)" : "#ffffff",
                  color: blockMode === "day" ? "#0066FF" : "#475569",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  boxShadow: blockMode === "day" ? "0 0 0 1px #0066FF inset" : "none",
                }}
              >
                <span style={{ fontSize: "20px", lineHeight: "1" }}>📅</span>
                <div>
                  <div style={{ fontWeight: "700" }}>Día Completo</div>
                  <div style={{ fontSize: "11px", fontWeight: "400", opacity: 0.85, marginTop: "2px" }}>
                    Todo el día cerrado
                  </div>
                </div>
              </button>

              {/* Opción 3: Horas Específicas */}
              <button
                type="button"
                onClick={() => setBlockMode("custom_hours")}
                style={{
                  padding: "12px 14px",
                  borderRadius: "10px",
                  border: blockMode === "custom_hours" ? "2px solid #0066FF" : "1px solid #e2e8f0",
                  background: blockMode === "custom_hours" ? "rgba(0, 102, 255, 0.05)" : "#ffffff",
                  color: blockMode === "custom_hours" ? "#0066FF" : "#475569",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "10px",
                  boxShadow: blockMode === "custom_hours" ? "0 0 0 1px #0066FF inset" : "none",
                }}
              >
                <span style={{ fontSize: "20px", lineHeight: "1" }}>⏰</span>
                <div>
                  <div style={{ fontWeight: "700" }}>Horas Específicas</div>
                  <div style={{ fontSize: "11px", fontWeight: "400", opacity: 0.85, marginTop: "2px" }}>
                    Rango de horas determinado
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Campos dinámicos según el modo */}
          {blockMode === "range" && (
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={{ flex: "1 1 200px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                  Fecha Desde <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.formInput}
                  style={{ width: "100%" }}
                  value={startDate}
                  min={todayDate}
                  onChange={(e) => {
                    const val = e.target.value;
                    setStartDate(val);
                    if (endDate < val) {
                      setEndDate(val);
                    }
                  }}
                  required
                />
              </div>

              <div style={{ flex: "1 1 200px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                  Fecha Hasta <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.formInput}
                  style={{ width: "100%" }}
                  value={endDate}
                  min={startDate || todayDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                />
              </div>
            </div>
          )}

          {blockMode === "day" && (
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                Fecha <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <input
                type="date"
                className={styles.formInput}
                style={{ width: "100%", maxWidth: "260px" }}
                value={singleDate}
                min={todayDate}
                onChange={(e) => setSingleDate(e.target.value)}
                required
              />
            </div>
          )}

          {blockMode === "custom_hours" && (
            <>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
                  Fecha <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="date"
                  className={styles.formInput}
                  style={{ width: "100%", maxWidth: "260px" }}
                  value={singleDate}
                  min={todayDate}
                  onChange={(e) => setSingleDate(e.target.value)}
                  required
                />
              </div>

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
            </>
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
              placeholder={
                blockMode === "range"
                  ? "Ej: Vacaciones de verano, Semana libre, Remodelación..."
                  : blockMode === "day"
                  ? "Ej: Trámites personales, Día de descanso, Feriado..."
                  : "Ej: Cita médica, Almuerzo de equipo, Capacitación..."
              }
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
              style={{ minWidth: "260px", background: "#ef4444" }}
            >
              {submitting
                ? "Bloqueando..."
                : blockMode === "range"
                ? "⛔ Bloquear Período (Mostrar como Ocupado)"
                : blockMode === "day"
                ? "⛔ Bloquear Día (Mostrar como Ocupado)"
                : "⛔ Bloquear Horas (Mostrar como Ocupado)"}
            </button>
          </div>
        </form>
      </section>

      {/* 3. Listado de bloqueos actuales */}
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
            {blocks.map((b) => {
              const info = parseBlockInterval(b.startsAt, b.endsAt, timezone);
              return (
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
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      {info.isMultiDay ? (
                        <>
                          <span style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b" }}>
                            {formatMultiDayRange(info.dStart, info.dEndAdjusted, timezone, info.daysCount)}
                          </span>
                          <span
                            style={{
                              background: "#e0f2fe",
                              color: "#0369a1",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                            }}
                          >
                            🏖️ Período Extendido
                          </span>
                        </>
                      ) : (
                        <>
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
                        </>
                      )}

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
                        🔴 Visible al público como Ocupado
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
                    onClick={() => handleDeleteBlock(b.id, info.isMultiDay)}
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
                      whiteSpace: "nowrap",
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
                    {info.isMultiDay ? "✓ Desbloquear Período" : "✓ Desbloquear"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
