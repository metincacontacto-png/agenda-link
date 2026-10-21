import type { BusinessAppointmentDTO } from "@/features/businesses/contracts";

export interface DashboardMetrics {
  totalReservations: number;
  totalSales: number;
  uniqueClients: number;
  professionalsCount: number;
  currentWeekAppointments: number;
  visibleAppointments: BusinessAppointmentDTO[];
  mercadoPagoSales: number;
  localSales: number;
  mercadoPagoPercent: number;
  localPercent: number;
  applePaySales: number;
  visaSales: number;
  applePayPercent: number;
  visaPercent: number;
}

export function calculateDashboardMetrics(input: {
  appointments: BusinessAppointmentDTO[];
  totalAppointments: number;
  professionalsCount: number;
  weekDates: Date[];
}): DashboardMetrics {
  const { appointments, totalAppointments, professionalsCount, weekDates } = input;
  const totalSales = appointments
    .filter((appointment) => appointment.paymentStatus === "PAID")
    .reduce((total, appointment) => total + (appointment.paymentAmount || appointment.service.price || 0), 0);
  const weekStart = weekDates[0];
  const weekEnd = weekDates[6];
  const currentWeekAppointments = weekStart && weekEnd
    ? appointments.filter((appointment) => {
        const date = new Date(appointment.dateTime);
        return date >= weekStart && date <= weekEnd;
      }).length
    : 0;
  const mercadoPagoSales = appointments
    .filter((appointment) => appointment.paymentStatus === "PAID" && Boolean(
      appointment.paymentMethod?.toLowerCase().includes("mercado") ||
      appointment.paymentMethod?.toLowerCase().includes("online") ||
      appointment.paymentMethod?.toLowerCase() === "apple pay"
    ))
    .reduce((total, appointment) => total + (appointment.paymentAmount || appointment.service.price || 0), 0);
  const localSales = appointments
    .filter((appointment) => appointment.paymentStatus === "PAID" && !Boolean(
      appointment.paymentMethod?.toLowerCase().includes("mercado") ||
      appointment.paymentMethod?.toLowerCase().includes("online") ||
      appointment.paymentMethod?.toLowerCase() === "apple pay"
    ))
    .reduce((total, appointment) => total + (appointment.paymentAmount || appointment.service.price || 0), 0);

  const mercadoPagoPercent = totalSales > 0 ? Math.round((mercadoPagoSales / totalSales) * 100) : 0;
  const localPercent = totalSales > 0 ? Math.round((localSales / totalSales) * 100) : 0;

  return {
    totalReservations: totalAppointments,
    totalSales,
    uniqueClients: new Set(appointments.map((appointment) => appointment.clientWhatsApp)).size,
    professionalsCount,
    currentWeekAppointments,
    visibleAppointments: appointments,
    mercadoPagoSales,
    localSales,
    mercadoPagoPercent,
    localPercent,
    applePaySales: mercadoPagoSales,
    visaSales: localSales,
    applePayPercent: mercadoPagoPercent,
    visaPercent: localPercent,
  };
}
