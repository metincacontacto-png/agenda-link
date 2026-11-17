"use client";

import { useState, type FormEvent } from "react";
import type { ProfessionalDTO } from "@/features/team/contracts";
import { getPlanMaxProfessionals, SUBSCRIPTION_PLANS } from "@/features/businesses/subscription-policy";
import styles from "../admin.module.css";

interface TeamTabProps {
  slug: string;
  professionals: ProfessionalDTO[];
  subscriptionPlan?: string | null;
  onTeamChanged: () => Promise<void>;
  onOpenBilling: () => void;
}

export default function TeamTab({
  slug,
  professionals,
  subscriptionPlan,
  onTeamChanged,
  onOpenBilling,
}: TeamTabProps) {
  const [name, setName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const rawPlan = (subscriptionPlan || "INDIVIDUAL") as "INDIVIDUAL" | "EQUIPO" | "NEGOCIO";
  const planKey = SUBSCRIPTION_PLANS[rawPlan] ? rawPlan : "INDIVIDUAL";
  const maxAllowed = getPlanMaxProfessionals(planKey);
  const currentCount = professionals.length;
  const isLimitReached = currentCount >= maxAllowed;
  const planName = SUBSCRIPTION_PLANS[planKey]?.name || planKey;

  const handleAddProfessional = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!name.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/professionals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error || "Error al agregar el profesional");
        return;
      }

      setName("");
      await onTeamChanged();
    } catch {
      setErrorMessage("Error de conexión al agregar el profesional");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProfessional = async (id: string) => {
    if (professionals.length <= 1) return;
    if (!confirm("¿Seguro que deseas eliminar a este profesional del equipo?")) return;

    setDeletingId(id);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/professionals?id=${encodeURIComponent(id)}&slug=${encodeURIComponent(slug)}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setErrorMessage(data?.error || "Error al eliminar el profesional");
        return;
      }

      await onTeamChanged();
    } catch {
      setErrorMessage("Error de conexión al eliminar el profesional");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className={styles.glassCard}>
      {/* Header with Title, Description and Quota Badge */}
      <div className={styles.teamHeaderRow}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "4px" }}>
            Equipo de profesionales
          </h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: 0 }}>
            Profesionales asociados al negocio y disponibles para recibir reservas.
          </p>
        </div>
        <div className={styles.teamQuotaBadge}>
          <span>👤 {currentCount} de {maxAllowed} profesional(es) utilizados · Plan {planName}</span>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div className={styles.teamErrorBanner} role="alert">
          <span>{errorMessage}</span>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className={styles.teamCloseAlertBtn}
            title="Cerrar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Professional Form or Upgrade Banner */}
      <div style={{ margin: "24px 0" }}>
        {isLimitReached ? (
          <div className={styles.teamUpgradeBanner}>
            <div className={styles.teamUpgradeText}>
              {planKey === "INDIVIDUAL" && (
                <p style={{ margin: 0, fontWeight: 600, fontSize: "13.5px" }}>
                  Has alcanzado el límite de 1 profesional de tu Plan Individual. Pasa a Plan Básico para agregar hasta 2 profesionales.
                </p>
              )}
              {planKey === "EQUIPO" && (
                <p style={{ margin: 0, fontWeight: 600, fontSize: "13.5px" }}>
                  Has alcanzado el límite de 2 profesionales de tu Plan Básico. Pasa a Plan Premium para agregar hasta 5 profesionales.
                </p>
              )}
              {planKey === "NEGOCIO" && (
                <p style={{ margin: 0, fontWeight: 600, fontSize: "13.5px" }}>
                  Has alcanzado el cupo máximo de 5 profesionales de tu Plan Premium.
                </p>
              )}
            </div>
            {planKey === "INDIVIDUAL" && (
              <button
                type="button"
                className={styles.teamUpgradeBtn}
                onClick={onOpenBilling}
              >
                Mejorar a Plan Básico →
              </button>
            )}
            {planKey === "EQUIPO" && (
              <button
                type="button"
                className={styles.teamUpgradeBtn}
                onClick={onOpenBilling}
              >
                Mejorar a Plan Premium →
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleAddProfessional} className={styles.teamAddForm}>
            <input
              type="text"
              placeholder="Nombre del nuevo profesional..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={styles.formInput}
              style={{ flex: 1, minWidth: "240px", minHeight: "44px" }}
              disabled={isSubmitting}
            />
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className={styles.submitButton}
              style={{ minHeight: "44px", padding: "10px 24px", whiteSpace: "nowrap" }}
            >
              {isSubmitting ? "Agregando..." : "+ Agregar al equipo"}
            </button>
          </form>
        )}
      </div>

      {/* Professional Cards List */}
      {professionals.length === 0 ? (
        <p style={{ fontSize: "13px", color: "var(--text-secondary)", textAlign: "center", padding: "28px 0" }}>
          Aún no hay profesionales asociados.
        </p>
      ) : (
        <div className={styles.teamGrid}>
          {professionals.map((professional) => {
            const isOnlyOne = professionals.length <= 1;
            const isDeleting = deletingId === professional.id;
            return (
              <div key={professional.id} className={styles.teamCard}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                  <div className={styles.profAvatar}>
                    {professional.avatar || professional.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className={styles.profName} title={professional.name}>
                    {professional.name}
                  </div>
                </div>
                <button
                  type="button"
                  className={styles.teamCardDeleteBtn}
                  disabled={isOnlyOne || isDeleting}
                  onClick={() => void handleDeleteProfessional(professional.id)}
                  title={isOnlyOne ? "El negocio debe tener al menos un profesional" : "Eliminar profesional"}
                  aria-label={isOnlyOne ? "El negocio debe tener al menos un profesional" : `Eliminar a ${professional.name}`}
                >
                  {isDeleting ? "..." : "✕"}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
