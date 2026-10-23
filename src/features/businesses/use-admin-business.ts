"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useRef, useState } from "react";
import type { AdminAppointmentsPaginationDTO, BusinessAdminDTO } from "./contracts";

const emptyPagination: AdminAppointmentsPaginationDTO = {
  total: 0,
  limit: 50,
  hasMore: false,
  nextCursor: null,
  piiRedacted: false,
};

export function useAdminBusiness(slug: string) {
  const [business, setBusiness] = useState<BusinessAdminDTO | null>(null);
  const [accessDenied, setAccessDenied] = useState(false);
  const [appointmentPagination, setAppointmentPagination] = useState(emptyPagination);
  const [loadingMoreAppointments, setLoadingMoreAppointments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newBookingAlert, setNewBookingAlert] = useState<string | null>(null);

  const prevAppointmentsTotal = useRef<number | null>(null);
  const isFetchingRef = useRef(false);

  const loadAdminData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const response = await fetch(`/api/admin?slug=${slug}`);
      if (!response.ok) {
        setAccessDenied(response.status === 401 || response.status === 403);
        setBusiness(null);
        return;
      }

      setAccessDenied(false);
      const data = await response.json();
      if (data.success && data.business) {
        const newTotal = data.appointmentsPagination?.total ?? data.business.appointments?.length ?? 0;
        if (prevAppointmentsTotal.current !== null && newTotal > prevAppointmentsTotal.current) {
          const diff = newTotal - prevAppointmentsTotal.current;
          setNewBookingAlert(
            diff === 1
              ? "¡Nueva reserva recibida! Se actualizó tu agenda automáticamente."
              : `¡${diff} nuevas reservas recibidas! Se actualizó tu agenda automáticamente.`
          );
        }
        prevAppointmentsTotal.current = newTotal;

        setBusiness(data.business);
        setAppointmentPagination(data.appointmentsPagination);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [slug]);

  useEffect(() => {
    void loadAdminData();

    // Auto-refresco silencioso cada 10 segundos si la pestaña está activa
    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void loadAdminData();
      }
    }, 10000);

    // Refresco inmediato al volver a la pestaña o enfocar ventana
    const handleSync = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void loadAdminData();
      }
    };

    document.addEventListener("visibilitychange", handleSync);
    window.addEventListener("focus", handleSync);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleSync);
      window.removeEventListener("focus", handleSync);
    };
  }, [loadAdminData]);

  useEffect(() => {
    if (!newBookingAlert) return;
    const timer = setTimeout(() => setNewBookingAlert(null), 8000);
    return () => clearTimeout(timer);
  }, [newBookingAlert]);

  const loadMoreAppointments = useCallback(async () => {
    if (!appointmentPagination.hasMore || !appointmentPagination.nextCursor || loadingMoreAppointments) return;
    setLoadingMoreAppointments(true);
    try {
      const query = new URLSearchParams({
        slug,
        limit: String(appointmentPagination.limit),
        cursor: appointmentPagination.nextCursor,
      });
      const response = await fetch(`/api/admin?${query.toString()}`);
      if (!response.ok) throw new Error("No se pudieron cargar más reservas");
      const data = await response.json();
      setBusiness((current) => current
        ? { ...current, appointments: [...current.appointments, ...data.business.appointments] }
        : current);
      setAppointmentPagination(data.appointmentsPagination);
    } catch (error) {
      console.error("Error loading more appointments:", error);
      alert("No se pudieron cargar más reservas.");
    } finally {
      setLoadingMoreAppointments(false);
    }
  }, [appointmentPagination, loadingMoreAppointments, slug]);

  return {
    business,
    setBusiness,
    accessDenied,
    appointmentPagination,
    loadingMoreAppointments,
    loading,
    newBookingAlert,
    dismissNewBookingAlert: () => setNewBookingAlert(null),
    loadAdminData,
    loadMoreAppointments,
  };
}
