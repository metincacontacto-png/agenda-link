"use client";

import type { ChangeEvent, FormEvent } from "react";
import type { BusinessAdminDTO } from "@/features/businesses/contracts";
import type { BrandingFormState } from "@/features/branding/contracts";
import styles from "../admin.module.css";

interface BrandingTabProps {
  business: BusinessAdminDTO;
  state: BrandingFormState;
  isSaving: boolean;
  onSave: (event: FormEvent<HTMLFormElement>) => void;
  onImageFileChange: (event: ChangeEvent<HTMLInputElement>, setter: (value: string) => void) => void;
}

export default function BrandingTab({ business, state, isSaving, onSave, onImageFileChange }: BrandingTabProps) {
  return (
    <div className={styles.perfilLayoutGrid}>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <section className={styles.glassCard}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px" }}>Personalizar Landing Page</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
            Edita los contenidos, fotos y banners de la página de presentación. La vista previa se actualiza con tus cambios.
          </p>
          <form onSubmit={onSave} className={styles.adminForm}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label>Título Principal</label>
                <input type="text" value={state.landingTitle} onChange={(event) => state.setLandingTitle(event.target.value)} placeholder="Ej. Corte y Estilo Exclusivo" className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label>Subtítulo</label>
                <input type="text" value={state.landingSubtitle} onChange={(event) => state.setLandingSubtitle(event.target.value)} placeholder="Ej. Agenda tu cita en segundos." className={styles.formInput} />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label>Sobre Nosotros (Historia del Negocio)</label>
              <textarea value={state.landingAbout} onChange={(event) => state.setLandingAbout(event.target.value)} placeholder="Describe tu negocio, experiencia y propuesta de valor..." className={styles.formInput} style={{ minHeight: "80px", resize: "vertical" }} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label>Logotipo del Negocio</label>
                <input type="file" id="logo-upload" accept="image/*" style={{ display: "none" }} onChange={(event) => onImageFileChange(event, state.setLogoUrl)} />
                <label htmlFor="logo-upload" className={styles.uploadBtnLabel}>{state.logoUrl ? "Cambiar Logotipo" : "Subir Logotipo"}</label>
                {state.logoUrl && (
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <img src={state.logoUrl} alt="Vista previa del logotipo" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                    <button type="button" onClick={() => state.setLogoUrl("")} style={{ border: "none", background: "none", color: "var(--danger)", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>Eliminar</button>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Banner Principal (Hero)</label>
                <input type="file" id="cover-upload" accept="image/*" style={{ display: "none" }} onChange={(event) => onImageFileChange(event, state.setLandingCoverUrl)} />
                <label htmlFor="cover-upload" className={styles.uploadBtnLabel}>{state.landingCoverUrl ? "Cambiar Banner" : "Subir Banner"}</label>
                {state.landingCoverUrl && (
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "60px", height: "32px", borderRadius: "4px", backgroundImage: `url(${state.landingCoverUrl})`, backgroundSize: "cover" }} />
                    <button type="button" onClick={() => state.setLandingCoverUrl("")} style={{ border: "none", background: "none", color: "var(--danger)", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>Eliminar</button>
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>Banner Secundario</label>
                <input type="file" id="sec-cover-upload" accept="image/*" style={{ display: "none" }} onChange={(event) => onImageFileChange(event, state.setLandingSecondaryCoverUrl)} />
                <label htmlFor="sec-cover-upload" className={styles.uploadBtnLabel}>{state.landingSecondaryCoverUrl ? "Cambiar Banner Sec." : "Subir Banner Sec."}</label>
                {state.landingSecondaryCoverUrl && (
                  <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "60px", height: "32px", borderRadius: "4px", backgroundImage: `url(${state.landingSecondaryCoverUrl})`, backgroundSize: "cover" }} />
                    <button type="button" onClick={() => state.setLandingSecondaryCoverUrl("")} style={{ border: "none", background: "none", color: "var(--danger)", fontSize: "11px", fontWeight: "bold", cursor: "pointer" }}>Eliminar</button>
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className={styles.formGroup}>
                <label>Teléfono de Contacto</label>
                <input type="text" value={state.landingPhone} onChange={(event) => state.setLandingPhone(event.target.value)} placeholder="+56 9 1234 5678" className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label>Dirección</label>
                <input type="text" value={state.landingAddress} onChange={(event) => state.setLandingAddress(event.target.value)} placeholder="Ej. Av. Providencia 1234" className={styles.formInput} />
              </div>
              <div className={styles.formGroup}>
                <label>Horario de Atención</label>
                <input type="text" value={state.landingHours} onChange={(event) => state.setLandingHours(event.target.value)} placeholder="Ej. Lun a Sáb: 9:00 - 20:00" className={styles.formInput} />
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(0,102,255,0.08)", paddingTop: "16px", marginTop: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Ventajas Principales (¿Por qué elegirnos?)</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                  <input type="text" value={state.feat1Title} onChange={(event) => state.setFeat1Title(event.target.value)} placeholder="Ventaja 1" className={styles.formInput} />
                  <input type="text" value={state.feat1Desc} onChange={(event) => state.setFeat1Desc(event.target.value)} placeholder="Descripción Ventaja 1" className={styles.formInput} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                  <input type="text" value={state.feat2Title} onChange={(event) => state.setFeat2Title(event.target.value)} placeholder="Ventaja 2" className={styles.formInput} />
                  <input type="text" value={state.feat2Desc} onChange={(event) => state.setFeat2Desc(event.target.value)} placeholder="Descripción Ventaja 2" className={styles.formInput} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "12px" }}>
                  <input type="text" value={state.feat3Title} onChange={(event) => state.setFeat3Title(event.target.value)} placeholder="Ventaja 3" className={styles.formInput} />
                  <input type="text" value={state.feat3Desc} onChange={(event) => state.setFeat3Desc(event.target.value)} placeholder="Descripción Ventaja 3" className={styles.formInput} />
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid rgba(0,102,255,0.08)", paddingTop: "16px", marginTop: "16px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "700", marginBottom: "12px" }}>Testimonios de Clientes</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ padding: "12px", background: "rgba(0,0,0,0.01)", borderRadius: "12px", border: "1px solid var(--input-border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "8px" }}>
                    <input type="text" value={state.test1Name} onChange={(event) => state.setTest1Name(event.target.value)} placeholder="Nombre Cliente 1" className={styles.formInput} />
                    <select value={state.test1Stars} onChange={(event) => state.setTest1Stars(Number.parseInt(event.target.value, 10))} className={styles.formInput}>
                      <option value="5">5 estrellas</option><option value="4">4 estrellas</option><option value="3">3 estrellas</option>
                    </select>
                  </div>
                  <input type="text" value={state.test1Text} onChange={(event) => state.setTest1Text(event.target.value)} placeholder="Texto del testimonio 1" className={styles.formInput} />
                </div>
                <div style={{ padding: "12px", background: "rgba(0,0,0,0.01)", borderRadius: "12px", border: "1px solid var(--input-border)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px", marginBottom: "8px" }}>
                    <input type="text" value={state.test2Name} onChange={(event) => state.setTest2Name(event.target.value)} placeholder="Nombre Cliente 2" className={styles.formInput} />
                    <select value={state.test2Stars} onChange={(event) => state.setTest2Stars(Number.parseInt(event.target.value, 10))} className={styles.formInput}>
                      <option value="5">5 estrellas</option><option value="4">4 estrellas</option><option value="3">3 estrellas</option>
                    </select>
                  </div>
                  <input type="text" value={state.test2Text} onChange={(event) => state.setTest2Text(event.target.value)} placeholder="Texto del testimonio 2" className={styles.formInput} />
                </div>
              </div>
            </div>

            <button type="submit" disabled={isSaving} className={styles.submitButton} style={{ marginTop: "20px" }}>
              {isSaving ? "Guardando Cambios..." : "Guardar Cambios"}
            </button>
          </form>
        </section>

        <section className={styles.glassCard}>
          <h2 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>🌐 Dominio Personalizado</h2>
          <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginBottom: "20px" }}>
            Configura tu propia dirección web (ej: <code>mi-negocio.cl</code>) para que tus clientes accedan directamente a tu landing page y agenda de reservas.
          </p>
          {business.customDomain ? (
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(52, 199, 89, 0.08)", border: "1px solid rgba(52, 199, 89, 0.2)", padding: "14px 16px", borderRadius: "12px", marginBottom: "20px" }}>
                <div>
                  <span style={{ fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "var(--text-secondary)", display: "block", letterSpacing: "0.5px" }}>Dominio asignado</span>
                  <a href={`https://${business.customDomain}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "15px", fontWeight: "700", color: "var(--primary)", textDecoration: "underline", display: "inline-block", marginTop: "4px" }}>{business.customDomain}</a>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#34c759", display: "inline-block", boxShadow: "0 0 8px #34c759" }} />
                  <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-secondary)" }}>DNS no verificado</span>
                </div>
              </div>
              <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid var(--card-border)", borderRadius: "12px", padding: "16px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px", color: "var(--foreground)" }}>Verificación pendiente</h3>
                <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.5", margin: 0 }}>
                  La asignación está guardada, pero AgendaLink no confirma todavía que el DNS y HTTPS estén activos para este dominio.
                </p>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "rgba(0, 102, 255, 0.05)", border: "1px solid rgba(0, 102, 255, 0.1)", padding: "16px", borderRadius: "12px", marginBottom: "20px" }}>
                <span style={{ fontSize: "24px" }}>💎</span>
                <div style={{ textAlign: "left" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: "700", color: "var(--foreground)", margin: "0 0 4px 0" }}>Dominios personalizados no disponibles</h3>
                  <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.4", margin: 0 }}>La activación de dominios de clientes requiere configuración y verificación de DNS/HTTPS que todavía no está habilitada.</p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      <div className={styles.previewContainer}>
        <div className={styles.iphoneWrapper}>
          <div className={styles.iphoneScreen}>
            <div className={styles.iphoneStatusBar}>
              <span>9:41 AM</span><div style={{ display: "flex", gap: "3px" }}><span>📶</span><span>🔋</span></div>
            </div>
            <div className={styles.previewHeader}>
              {state.logoUrl ? (
                <img src={state.logoUrl} alt="Logo de previsualización" style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", marginBottom: "6px" }} />
              ) : (
                <div className={styles.previewLogo} style={{ marginBottom: "6px" }}>{business.name.substring(0, 2).toUpperCase()}</div>
              )}
              <h4 style={{ fontSize: "13px", fontWeight: "800", margin: 0 }}>{business.name}</h4>
              <span className={styles.statusBadge} style={{ transform: "scale(0.8)", margin: "4px 0" }}><span className={styles.statusDot} />Disponible</span>
            </div>
            <div className={styles.previewHero} style={{ backgroundImage: state.landingCoverUrl ? `url(${state.landingCoverUrl})` : "linear-gradient(135deg, #00c6ff, #0072ff)" }}>
              <div className={styles.previewHeroOverlay}>
                <h2 style={{ color: "white", fontSize: "14px", fontWeight: "800", margin: 0 }}>{state.landingTitle || "Título principal"}</h2>
                <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "10px", margin: "2px 0 0 0" }}>{state.landingSubtitle || "Subtítulo de presentación"}</p>
              </div>
            </div>
            <div style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div className={styles.previewContactPill}><span>📞</span><span>{state.landingPhone || "Teléfono no configurado"}</span></div>
              <div className={styles.previewContactPill}><span>📍</span><span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{state.landingAddress || "Dirección no configurada"}</span></div>
              <div className={styles.previewContactPill}><span>⏰</span><span>{state.landingHours || "Horario no configurado"}</span></div>
            </div>
            <div style={{ padding: "0 12px 12px 12px", textAlign: "left" }}>
              <h5 style={{ fontSize: "11px", fontWeight: "700", marginBottom: "4px" }}>Sobre Nosotros</h5>
              <p style={{ fontSize: "10px", color: "var(--text-secondary)", margin: 0, lineHeight: "1.4" }}>{state.landingAbout || "Agrega información sobre tu negocio."}</p>
            </div>
            {state.landingSecondaryCoverUrl && <div style={{ height: "70px", backgroundImage: `url(${state.landingSecondaryCoverUrl})`, backgroundSize: "cover", backgroundPosition: "center", margin: "0 12px 12px 12px", borderRadius: "10px" }} />}
            <div style={{ padding: "0 12px 12px 12px", textAlign: "left" }}>
              <h5 style={{ fontSize: "11px", fontWeight: "700", marginBottom: "8px" }}>¿Por qué elegirnos?</h5>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {[
                  [state.feat1Title || "Ventaja 1", state.feat1Desc || "Descripción de la ventaja."],
                  [state.feat2Title || "Ventaja 2", state.feat2Desc || "Descripción de la ventaja."],
                  [state.feat3Title || "Ventaja 3", state.feat3Desc || "Descripción de la ventaja."],
                ].map(([title, description], index) => (
                  <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div className={styles.featureIconWrapper}><span className={styles.flatBlueIcon}>{index === 0 ? "✦" : index === 1 ? "✓" : "⚡"}</span></div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontSize: "10px", fontWeight: "600" }}>{title}</span>
                      <span style={{ fontSize: "9px", color: "var(--text-secondary)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "200px" }}>{description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ padding: "0 12px 12px 12px", textAlign: "left" }}>
              <h5 style={{ fontSize: "11px", fontWeight: "700", marginBottom: "6px" }}>Opiniones</h5>
              {(state.test1Name || state.test1Text || state.test2Name || state.test2Text) ? (
                [
                  [state.test1Name, state.test1Stars, state.test1Text],
                  [state.test2Name, state.test2Stars, state.test2Text],
                ].filter(([name, , text]) => name || text).map(([name, stars, text], index) => (
                  <div key={index} style={{ background: "white", padding: "6px 8px", borderRadius: "8px", border: "1px solid rgba(0,0,0,0.03)", marginBottom: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: "700" }}><span>{name}</span><span style={{ color: "#ff9500" }}>{"★".repeat(Number(stars))}</span></div>
                    <p style={{ fontSize: "8px", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>{text}</p>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, fontSize: "8px", color: "var(--text-secondary)" }}>No hay testimonios publicados.</p>
              )}
            </div>
            <div className={styles.previewFooterCTA}><button className={styles.previewBookBtn} type="button">Reservar Cita Online</button></div>
          </div>
        </div>
      </div>
    </div>
  );
}
