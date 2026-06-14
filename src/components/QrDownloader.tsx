"use client";

import React, { useEffect, useState, useRef } from "react";
import styles from "./QrDownloader.module.css";

interface Props {
  slug: string;
  businessName: string;
}

export default function QrDownloader({ slug, businessName }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Generar la URL de reserva para el QR
    const url = `${window.location.origin}/${slug}`;

    // Cargar QRCode dinámicamente en el cliente
    import("qrcode").then((QRCode) => {
      // Generar Data URL para usar en la impresión (con mayor resolución)
      QRCode.default.toDataURL(url, { width: 600, margin: 2 }, (err, dataUrl) => {
        if (err) {
          console.error("Error generating QR Data URL:", err);
        } else {
          setQrDataUrl(dataUrl);
        }
      });

      // Renderizar en el canvas para vista previa en pantalla
      if (canvasRef.current) {
        QRCode.default.toCanvas(canvasRef.current, url, { width: 160, margin: 1 }, (err) => {
          if (err) {
            console.error("Error rendering QR to Canvas:", err);
          }
        });
      }
    }).catch((err) => {
      console.error("Error loading qrcode library dynamically:", err);
    });
  }, [slug]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={styles.container}>
      <div className={styles.canvasContainer}>
        <canvas ref={canvasRef} />
      </div>

      <button onClick={handlePrint} className={styles.printBtn}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 6 2 18 2 18 9"></polyline>
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
          <rect x="6" y="14" width="12" height="8"></rect>
        </svg>
        Imprimir Cartel A4 y Tarjeta
      </button>

      {/* Área oculta en pantalla, visible solo al imprimir */}
      <div className="printArea">
        {/* Página 1: Cartel de Vitrina A4 */}
        <div className="pageA4">
          <h1>{businessName}</h1>
          <p>Escanea para agendar tu cita al instante</p>
          <div className="qrWrapper">
            {qrDataUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt="Código QR"
                style={{ width: "120mm", height: "120mm" }}
              />
            )}
          </div>
          <p style={{ fontSize: "16px", color: "#86868b", marginTop: "12px" }}>
            Sin contraseñas. Sin descargar apps. Todo con tu WhatsApp.
          </p>
          <span className="brandUrl">agendalink.cl/{slug}</span>
        </div>

        {/* Página 2: Tarjeta de Presentación (85x55mm) */}
        <div className="pageCard">
          <div className="cardText">
            <h2>{businessName}</h2>
            <p>Agenda tu hora en línea directamente</p>
            <span>agendalink.cl/{slug}</span>
          </div>
          <div>
            {qrDataUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={qrDataUrl}
                alt="Código QR"
                style={{ width: "35mm", height: "35mm" }}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
