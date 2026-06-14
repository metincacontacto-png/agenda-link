"use client";

import React from "react";
import styles from "./maintenance.module.css";

export default function MaintenancePage() {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.card}>
        <div className={styles.iconContainer}>
          <span className={styles.cogMain}>⚙️</span>
          <span className={styles.cogSmall}>🛠️</span>
        </div>
        
        <h1 className={styles.title}>Plataforma en Mantenimiento</h1>
        <p className={styles.description}>
          Estamos realizando mejoras importantes en nuestros servidores para ofrecerte una experiencia más rápida y segura. Volveremos a estar en línea muy pronto.
        </p>

        <div className={styles.statusIndicator}>
          <span className={styles.pulseDot} />
          <span>Trabajando en actualizaciones</span>
        </div>

        <div className={styles.divider} />

        <button onClick={handleRefresh} className={styles.refreshBtn}>
          Reintentar acceso ↻
        </button>
      </div>
    </div>
  );
}
