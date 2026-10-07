"use client";

import { useCallback, useMemo, useState } from "react";
import type { BusinessAppointmentDTO } from "@/features/businesses/contracts";

function getWeekDates(referenceDate: Date) {
  const firstDate = new Date(referenceDate);
  const weekday = firstDate.getDay();
  firstDate.setDate(firstDate.getDate() + (weekday === 0 ? -6 : 1 - weekday));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(firstDate);
    date.setDate(firstDate.getDate() + index);
    return date;
  });
}

export function useAdminCalendar(appointments: BusinessAppointmentDTO[]) {
  const [currentWeekReference, setCurrentWeekReference] = useState(() => new Date());
  const weekDates = useMemo(() => getWeekDates(currentWeekReference), [currentWeekReference]);
  const hourSlots = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

  const getAppointmentsForSlot = useCallback((date: Date, hour: string) => {
    const slotHour = Number.parseInt(hour.split(":")[0], 10);
    return appointments.filter((appointment) => {
      const appointmentDate = new Date(appointment.dateTime);
      return appointmentDate.getFullYear() === date.getFullYear()
        && appointmentDate.getMonth() === date.getMonth()
        && appointmentDate.getDate() === date.getDate()
        && appointmentDate.getHours() === slotHour;
    });
  }, [appointments]);

  const moveWeek = useCallback((offset: number) => {
    setCurrentWeekReference((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + offset * 7);
      return next;
    });
  }, []);

  const weekRangeLabel = useMemo(() => {
    const first = weekDates[0];
    const last = weekDates[6];
    const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
    return `${first.toLocaleDateString("es-ES", options)} - ${last.toLocaleDateString("es-ES", options)}, ${first.getFullYear()}`;
  }, [weekDates]);

  return {
    weekDates,
    hourSlots,
    weekRangeLabel,
    getAppointmentsForSlot,
    onPreviousWeek: () => moveWeek(-1),
    onNextWeek: () => moveWeek(1),
  };
}
