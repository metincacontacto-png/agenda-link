import type { BusinessAppointmentDTO } from "@/features/businesses/contracts";

export interface DashboardMetrics {
  totalReservations: number;
  totalSales: number;
  uniqueClients: number;
  professionalsCount: number;
  currentWeekAppointments: number;
  visibleAppointments: BusinessAppointmentDTO[];
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
  const applePaySales = appointments
    .filter((appointment) => appointment.paymentStatus === "PAID" && appointment.paymentMethod === "Apple Pay")
    .reduce((total, appointment) => total + (appointment.paymentAmount || appointment.service.price || 0), 0);
  const visaSales = appointments
    .filter((appointment) => appointment.paymentStatus === "PAID" && appointment.paymentMethod !== "Apple Pay")
    .reduce((total, appointment) => total + (appointment.paymentAmount || appointment.service.price || 0), 0);

  return {
    totalReservations: totalAppointments,
    totalSales,
    uniqueClients: new Set(appointments.map((appointment) => appointment.clientWhatsApp)).size,
    professionalsCount,
    currentWeekAppointments,
    visibleAppointments: appointments,
    applePaySales,
    visaSales,
    applePayPercent: totalSales > 0 ? Math.round((applePaySales / totalSales) * 100) : 0,
    visaPercent: totalSales > 0 ? Math.round((visaSales / totalSales) * 100) : 0,
  };
}
