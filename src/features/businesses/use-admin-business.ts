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
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [appointmentPagination, setAppointmentPagination] = useState(emptyPagination);
  const [loadingMoreAppointments, setLoadingMoreAppointments] = useState(false);
  const [loading, setLoading] = useState(true);
  const [newBookingAlert, setNewBookingAlert] = useState<string | null>(null);

  const prevAppointmentsTotal = useRef<number | null>(null);
  const isFetchingRef = useRef(false);
  const businessRef = useRef<BusinessAdminDTO | null>(null);

  useEffect(() => {
    businessRef.current = business;
  }, [business]);

  const loadAdminData = useCallback(async () => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const response = await fetch(`/api/admin?slug=${encodeURIComponent(slug.trim())}`);
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setAccessDenied(true);
          return;
        }

        if (response.status === 404) {
          if (!businessRef.current) {
            setNotFound(true);
            setBusiness(null);
          } else {
            console.warn("Received 404 during background sync; keeping active business.");
          }
          return;
        }

        console.warn(`Admin request returned status ${response.status}. Retaining current state.`);
        if (!businessRef.current) {
          setLoadError("No pudimos conectar con el servidor. Por favor revisa tu conexión o intenta nuevamente.");
        }
        return;
      }

      setAccessDenied(false);
      setNotFound(false);
      setLoadError(null);
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
      if (!businessRef.current) {
        setLoadError("Error de conexión al cargar el panel administrativo.");
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [slug]);

  useEffect(() => {
    void loadAdminData();

    // Auto-refresco silencioso cada 30 segundos si la pestaña está activa
    const intervalId = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        void loadAdminData();
      }
    }, 30000);

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
        slug: slug.trim(),
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
    notFound,
    loadError,
    appointmentPagination,
    loadingMoreAppointments,
    loading,
    newBookingAlert,
    dismissNewBookingAlert: () => setNewBookingAlert(null),
    loadAdminData,
    loadMoreAppointments,
  };
}
