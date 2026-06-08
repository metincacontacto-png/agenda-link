"use client";
import React from "react";

interface Props {
  slug: string;
  businessName: string;
}

export default function QrDownloader({ slug, businessName }: Props) {
  return (
    <div style={{ textAlign: "center" }}>
      <p style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
        QR cargando...
      </p>
    </div>
  );
}
