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

  const currentMonthLabel = React.useMemo(() => {
    if (!days.length) return "";
    const [y, m, d] = days[0].dateStr.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12));
    const month = dateObj.toLocaleDateString("es-ES", { month: "long", timeZone: "UTC" });
    const year = dateObj.getUTCFullYear();
    return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
  }, [days]);

  const selectedDayInfo = React.useMemo(() => {
    if (!selectedDate) return { label: "", shortLabel: "", isToday: false, isTomorrow: false };
    const todayStr = dateStringAtTimeZone(new Date(), timeZone);
    const [todayY, todayM, todayD] = todayStr.split("-").map(Number);
    const tomorrowObj = new Date(Date.UTC(todayY, todayM - 1, todayD + 1, 12));
    const tomorrowStr = tomorrowObj.toISOString().slice(0, 10);

    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d, 12));
    const weekday = dateObj.toLocaleDateString("es-ES", { weekday: "long", timeZone: "UTC" });
    const month = dateObj.toLocaleDateString("es-ES", { month: "long", timeZone: "UTC" });
    const capWeekday = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const capMonth = month.charAt(0).toUpperCase() + month.slice(1);

    const isToday = selectedDate === todayStr;
    const isTomorrow = selectedDate === tomorrowStr;

    let prefix = "";
    if (isToday) prefix = "Hoy · ";
    else if (isTomorrow) prefix = "Mañana · ";

    return {
      label: `${prefix}${capWeekday} ${d} de ${capMonth}`,
      shortLabel: `${capWeekday} ${d}`,
      isToday,
      isTomorrow,
    };
  }, [selectedDate, timeZone]);

  const allSlots = React.useMemo(() => {
    return Array.from(new Set([...slots, ...bookedSlots])).sort();
  }, [slots, bookedSlots]);

  const morningSlots = React.useMemo(() => {
    return allSlots.filter((slot) => {
      const hour = Number.parseInt(slot.split(":")[0], 10);
      return hour < 13;
    });
  }, [allSlots]);

  const afternoonSlots = React.useMemo(() => {
    return allSlots.filter((slot) => {
      const hour = Number.parseInt(slot.split(":")[0], 10);
      return hour >= 13;
    });
  }, [allSlots]);

  const renderSlotButton = (slot: string) => {
    const isBooked = bookedSlots.includes(slot);
    const isSelected = selectedTime === slot;
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
            : isSelected
            ? styles.slotBtnActive
            : ""
        }`}
      >
        <span className={styles.slotTime}>{slot}</span>
        <span className={styles.slotStatus}>
          {isBooked ? "Ocupado" : isSelected ? "✓ Elegido" : "Libre"}
        </span>
      </button>
    );
  };

  return (
    <div className={styles.container}>
      {/* 1. Selector de fecha (Paso 1) */}
      <div className={styles.datePickerSection}>
        <div className={styles.monthHeaderRow}>
          <div className={styles.monthTitle}>
            <span className={styles.calendarIcon}>📅</span>
            <span>{currentMonthLabel}</span>
          </div>
          <span className={styles.stepBadge}>1. Elige Fecha</span>
        </div>

        <div className={styles.daysRow}>
          {days.map((item, idx) => {
            const isSelected = selectedDate === item.dateStr;
            const isToday = idx === 0;
            return (
              <button
                key={item.dateStr}
                type="button"
                disabled={item.isDayClosed}
                onClick={() => {
                  if (item.isDayClosed) return;
                  onSelectDate(item.dateStr);
                  onSelectTime("");
                }}
                className={`${styles.dayBtn} ${isSelected ? styles.dayBtnActive : ""} ${item.isDayClosed ? styles.dayBtnClosed : ""}`}
              >
                {isToday && !item.isDayClosed && (
                  <span className={styles.todayPill}>HOY</span>
                )}
                {item.isDayClosed && (
                  <span className={styles.closedPill}>Cerrado</span>
                )}
                <span className={styles.dayName}>{item.dayName}</span>
                <span className={styles.dayNumber}>{item.dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Horarios del día seleccionado en tarjeta dedicada (Paso 2) */}
      <div className={styles.hoursCard}>
        <div className={styles.hoursCardHeader}>
          <div className={styles.hoursCardTitleBlock}>
            <div className={styles.hoursCardStep}>2. Elige Horario</div>
            <h3 className={styles.hoursCardTitle}>
              ⏰ Horarios para {selectedDayInfo.label}
            </h3>
            <p className={styles.hoursCardSubtitle}>
              {selectedTime
                ? `Horario elegido: ${selectedTime} hrs`
                : "Elige la hora que más te acomode para agendar:"}
            </p>
          </div>

          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDotAvailable} /> Libre
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDotBooked} /> Ocupado
            </span>
          </div>
        </div>

        {isClosed ? (
          <div className={styles.emptyNotice}>
            <span>🏖️</span>
            <p>El negocio se encuentra cerrado en este día. Selecciona otro día en el calendario de arriba.</p>
          </div>
        ) : allSlots.length === 0 ? (
          <div className={styles.emptyNotice}>
            <span>⏳</span>
            <p>No hay horarios configurados para este día.</p>
          </div>
        ) : (
          <div className={styles.periodsWrapper}>
            {morningSlots.length > 0 && (
              <div className={styles.periodBlock}>
                <div className={styles.periodHeader}>
                  <span className={styles.periodTitle}>
                    <span>🌅</span> Mañana (09:00 – 12:30)
                  </span>
                  {morningSlots.some((s) => !bookedSlots.includes(s)) ? (
                    <span className={styles.periodBadge}>
                      {morningSlots.filter((s) => !bookedSlots.includes(s)).length} disponibles
                    </span>
                  ) : (
                    <span className={styles.periodBadgeEmpty}>Agotado</span>
                  )}
                </div>
                <div className={styles.slotsGrid}>
                  {morningSlots.map(renderSlotButton)}
                </div>
              </div>
            )}

            {afternoonSlots.length > 0 && (
              <div className={styles.periodBlock}>
                <div className={styles.periodHeader}>
                  <span className={styles.periodTitle}>
                    <span>☀️</span> Tarde (13:00 – 18:30)
                  </span>
                  {afternoonSlots.some((s) => !bookedSlots.includes(s)) ? (
                    <span className={styles.periodBadge}>
                      {afternoonSlots.filter((s) => !bookedSlots.includes(s)).length} disponibles
                    </span>
                  ) : (
                    <span className={styles.periodBadgeEmpty}>Agotado</span>
                  )}
                </div>
                <div className={styles.slotsGrid}>
                  {afternoonSlots.map(renderSlotButton)}
                </div>
              </div>
            )}

            {selectedTime && (
              <div className={styles.selectionBanner}>
                <span className={styles.selectionBannerIcon}>✓</span>
                <div>
                  <div className={styles.selectionBannerTitle}>
                    Hora seleccionada: <strong>{selectedTime} hrs</strong>
                  </div>
                  <div className={styles.selectionBannerSub}>
                    Para {selectedDayInfo.shortLabel} · Presiona &quot;Enviar Solicitud&quot; abajo para continuar
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
