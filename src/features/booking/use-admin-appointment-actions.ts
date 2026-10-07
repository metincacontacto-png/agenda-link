"use client";

import { useCallback, useState } from "react";
import type { BusinessAppointmentDTO } from "@/features/businesses/contracts";
import { dateStringAtTimeZone } from "@/features/schedule/time";
import type { AppointmentChangeInput } from "./validation";

export function useAdminAppointmentActions(timezone: string, reload: () => Promise<void>) {
  const [reschedulingAppointmentId, setReschedulingAppointmentId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [loadingAppointmentId, setLoadingAppointmentId] = useState<string | null>(null);

  const startRescheduling = useCallback((appointment: BusinessAppointmentDTO) => {
    const date = new Date(appointment.dateTime);
    setRescheduleDate(dateStringAtTimeZone(date, timezone));
    setRescheduleTime(date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: timezone,
    }));
    setReschedulingAppointmentId(appointment.id);
  }, [timezone]);

  const cancelRescheduling = useCallback(() => {
    setReschedulingAppointmentId(null);
    setRescheduleDate("");
    setRescheduleTime("");
  }, []);

  const changeAppointment = useCallback(async (appointmentId: string, change: AppointmentChangeInput) => {
    if (change.action === "cancel" && !confirm("¿Cancelar esta cita? La acción quedará registrada.")) return;
    setLoadingAppointmentId(appointmentId);
    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(change),
      });
      const data = await response.json();
      if (!response.ok) {
        alert(data.error || "No se pudo actualizar la cita.");
        return;
      }
      cancelRescheduling();
      await reload();
    } catch (error) {
      console.error("Error al cambiar la cita:", error);
      alert("Error de conexión al cambiar la cita.");
    } finally {
      setLoadingAppointmentId(null);
    }
  }, [cancelRescheduling, reload]);

  return {
    reschedulingAppointmentId,
    rescheduleDate,
    setRescheduleDate,
    rescheduleTime,
    setRescheduleTime,
    loadingAppointmentId,
    startRescheduling,
    cancelRescheduling,
    changeAppointment,
  };
}
