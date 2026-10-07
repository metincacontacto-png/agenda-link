import test from "node:test";
import assert from "node:assert/strict";
import { calculateDashboardMetrics } from "../src/features/businesses/dashboard-metrics.ts";

function appointment(id, { dateTime, phone, status = "CONFIRMED", amount = null, method = null, price = 10000 }) {
  return {
    id,
    dateTime,
    clientWhatsApp: phone,
    paymentStatus: status === "PAID" ? "PAID" : "PENDING",
    paymentAmount: amount,
    paymentMethod: method,
    service: { name: "Consulta", duration: 30, price },
    status,
    clientName: `Client ${id}`,
    professional: { name: "Professional" },
  };
}

test("dashboard metrics are derived from paginated appointment data", () => {
  const metrics = calculateDashboardMetrics({
    totalAppointments: 10,
    professionalsCount: 2,
    weekDates: [new Date("2026-10-05T00:00:00.000Z"), null, null, null, null, null, new Date("2026-10-11T23:59:59.999Z")],
    appointments: [
      appointment("1", { dateTime: "2026-10-06T09:00:00.000Z", phone: "+56911111111", status: "PAID", amount: 10000, method: "Apple Pay" }),
      appointment("2", { dateTime: "2026-10-07T09:00:00.000Z", phone: "+56922222222", status: "PAID", amount: 25000, method: "Visa Sim" }),
      appointment("3", { dateTime: "2026-10-20T09:00:00.000Z", phone: "+56911111111" }),
    ],
  });

  assert.equal(metrics.totalReservations, 10);
  assert.equal(metrics.totalSales, 35000);
  assert.equal(metrics.uniqueClients, 2);
  assert.equal(metrics.professionalsCount, 2);
  assert.equal(metrics.currentWeekAppointments, 2);
  assert.equal(metrics.visibleAppointments.length, 3);
  assert.equal(metrics.applePaySales, 10000);
  assert.equal(metrics.visaSales, 25000);
  assert.equal(metrics.applePayPercent, 29);
  assert.equal(metrics.visaPercent, 71);
});
