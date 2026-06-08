"use client";

import React, { useEffect } from "react";
import styles from "./Calendar.module.css";

interface Props {
  slug: string;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  slots: string[];
}

export default function Calendar({ selectedDate, onSelectDate, selectedTime, onSelectTime, slots }: Props) {
  const days = React.useMemo(() => {
    const list = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;

      const dayName = d.toLocaleDateString("es-ES", { weekday: "short" });
      const dayNum = d.getDate();
      list.push({ dateStr, dayName, dayNum });
    }
    return list;
  }, []);

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
