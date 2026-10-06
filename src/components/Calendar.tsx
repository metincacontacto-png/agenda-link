"use client";

import React, { useEffect } from "react";
import styles from "./Calendar.module.css";
import { dateStringAtTimeZone } from "@/lib/schedule";

interface Props {
  slug: string;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  slots: string[];
  timeZone: string;
}

export default function Calendar({ selectedDate, onSelectDate, selectedTime, onSelectTime, slots, timeZone }: Props) {
  const days = React.useMemo(() => {
    const list = [];
    const today = dateStringAtTimeZone(new Date(), timeZone).split("-").map(Number);
    const [year, month, day] = today;
    for (let i = 0; i < 7; i++) {
      const d = new Date(Date.UTC(year, month - 1, day + i, 12));
      const dateStr = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString("es-ES", { weekday: "short", timeZone: "UTC" });
      const dayNum = d.getUTCDate();
      list.push({ dateStr, dayName, dayNum });
    }
    return list;
  }, [timeZone]);

  useEffect(() => {
    if (!selectedDate && days.length > 0) {
      onSelectDate(days[0].dateStr);
    }
  }, [selectedDate, onSelectDate, days]);

  return (
    <div className={styles.container}>
      <div className={styles.daysRow}>
        {days.map((item) => (
          <button
            key={item.dateStr}
            type="button"
            onClick={() => {
              onSelectDate(item.dateStr);
              onSelectTime("");
            }}
            className={`${styles.dayBtn} ${selectedDate === item.dateStr ? styles.dayBtnActive : ""}`}
          >
            <span className={styles.dayName}>{item.dayName}</span>
            <span className={styles.dayNumber}>{item.dayNum}</span>
          </button>
        ))}
      </div>

      <div style={{ marginTop: "8px" }}>
        <p style={{ fontSize: "12px", fontWeight: "600", color: "var(--text-secondary)" }}>
          Horarios Disponibles
        </p>
        {slots.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "12px", textAlign: "center" }}>
            No hay horarios disponibles para este día.
          </p>
        ) : (
          <div className={styles.slotsGrid}>
            {slots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => onSelectTime(slot)}
                className={`${styles.slotBtn} ${selectedTime === slot ? styles.slotBtnActive : ""}`}
              >
                {slot}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
