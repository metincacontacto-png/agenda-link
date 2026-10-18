"use client";

import React, { useEffect } from "react";
import styles from "./Calendar.module.css";
import { dateStringAtTimeZone } from "@/features/schedule/time";

interface Props {
  slug: string;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  slots: string[];
  timeZone: string;
  bookedSlots?: string[];
  openDays?: number[];
  isClosed?: boolean;
}

export default function Calendar({
  selectedDate,
  onSelectDate,
  selectedTime,
  onSelectTime,
  slots,
  timeZone,
  bookedSlots = [],
  openDays = [1, 2, 3, 4, 5, 6],
  isClosed = false,
}: Props) {
  const days = React.useMemo(() => {
    const list = [];
    const today = dateStringAtTimeZone(new Date(), timeZone).split("-").map(Number);
    const [year, month, day] = today;
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.UTC(year, month - 1, day + i, 12));
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" });
      const dayNum = d.getUTCDate();
      const dayOfWeek = d.getUTCDay();
      const isDayClosed = !openDays.includes(dayOfWeek);
      list.push({ dateStr, dayName, dayNum, dayOfWeek, isDayClosed });
    }
    return list;
  }, [timeZone, openDays]);

  useEffect(() => {
    if (!selectedDate && days.length > 0) {
      const firstOpenDay = days.find((d) => !d.isDayClosed) || days[0];
      onSelectDate(firstOpenDay.dateStr);
    }
  }, [selectedDate, onSelectDate, days]);

  return (
    <div className={styles.container}>
      <div className={styles.daysRow}>
        {days.map((item) => (
          <button
            key={item.dateStr}
            type="button"
            disabled={item.isDayClosed}
            onClick={() => {
              if (item.isDayClosed) return;
              onSelectDate(item.dateStr);
              onSelectTime("");
            }}
            className={`${styles.dayBtn} ${selectedDate === item.dateStr ? styles.dayBtnActive : ""} ${item.isDayClosed ? styles.dayBtnClosed : ""}`}
          >
            <span className={styles.dayName}>{item.dayName}</span>
            <span className={styles.dayNumber}>{item.dayNum}</span>
            {item.isDayClosed && <span className={styles.closedLabel}>Cerrado</span>}
          </button>
        ))}
      </div>

      <div style={{ marginTop: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <p style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)", margin: 0 }}>
            Horarios de Atención
          </p>
          <div style={{ display: "flex", gap: "12px", fontSize: "11px", fontWeight: "600" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "var(--foreground)" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e" }} /> Disponible
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", color: "#ef4444" }}>
              <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#ef4444" }} /> Reservado
            </span>
          </div>
        </div>

        {isClosed ? (
          <p style={{ fontSize: "13px", color: "#ef4444", marginTop: "12px", textAlign: "center", fontWeight: "600" }}>
            El negocio se encuentra cerrado en este día.
          </p>
        ) : slots.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "12px", textAlign: "center" }}>
            No hay horarios disponibles para este día.
          </p>
        ) : (
          <div className={styles.slotsGrid}>
            {slots.map((slot) => {
              const isBooked = bookedSlots.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={isBooked}
                  onClick={() => {
                    if (isBooked) return;
                    onSelectTime(slot);
                  }}
                  className={`${styles.slotBtn} ${
                    isBooked
                      ? styles.slotBtnBooked
                      : selectedTime === slot
                      ? styles.slotBtnActive
                      : ""
                  }`}
                >
                  <span className={styles.slotTime}>{slot}</span>
                  <span className={styles.slotStatus}>
                    {isBooked ? "Ocupado" : "Libre"}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
