"use client";
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState } from "react";
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

  const loadAdminData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin?slug=${slug}`);
      if (!response.ok) {
        setAccessDenied(response.status === 401 || response.status === 403);
        setBusiness(null);
        return;
      }

      setAccessDenied(false);
      const data = await response.json();
      if (data.success) {
        setBusiness(data.business);
        setAppointmentPagination(data.appointmentsPagination);
      }
    } catch (error) {
      console.error("Error loading admin data:", error);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void loadAdminData();
  }, [loadAdminData]);

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
    loadAdminData,
    loadMoreAppointments,
  };
}
