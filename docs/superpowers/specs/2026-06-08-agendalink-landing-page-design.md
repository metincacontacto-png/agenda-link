# Diseño de Especificación: Landing Page de AgendaLink

**Fecha**: 2026-06-08
**Meta**: Crear una landing page (página de inicio) altamente profesional, minimalista y al estilo Apple para **AgendaLink**, integrando el flujo de onboarding existente y mostrando mockups de las interfaces de cliente y administración sin romper el concepto de diseño blanco y simple.

---

## 1. Arquitectura y Secciones de la Página

La página de inicio (`src/app/page.tsx`) se reestructurará para presentar la landing page y el formulario de onboarding de forma unificada:

```
+-------------------------------------------------------------+
|  [Logo] AgendaLink      Funcionalidades   Precios   [Registrar]  |  <-- Header
+-------------------------------------------------------------+
|                                                             |
|  Un solo link.                               [ iPhone ]     |
|  Todo tu negocio resuelto.                   [ Mockup ]     |  <-- Hero Section
|  [agendalink.com/tu-negocio] [Crear link]    [ macOS  ]     |
|                                                             |
+-------------------------------------------------------------+
|  [ Tarjeta 1: Clientes ] [ Tarjeta 2: IA ] [ Tarjeta 3: QR ]|  <-- Features Apple Grid
+-------------------------------------------------------------+
|                                                             |
|              Escribe tu plan ideal                          |
|    [ Plan Individual ]  [ Plan Equipo ]  [ Plan Negocio ]   |  <-- Pricing Section
|                                                             |
+-------------------------------------------------------------+
|                                                             |
|                   Configura tu Negocio                      |
|                  +---------------------+                    |
|                  |  Formulario de 3    |                    |  <-- Onboarding Section
|                  |  Pasos (Existente)  |                    |      (Sección con ID #registro)
|                  +---------------------+                    |
|                                                             |
+-------------------------------------------------------------+
```

---

## 2. Detalles de las Secciones y Flujos Interactivos

### 2.1 Cabecera de Navegación (Header)
*   **Logo**: Renderiza `logo.png` con altura de 28px y enlace al inicio.
*   **Menú**:
    *   `Funcionalidades`: Scroll suave a `#features`.
    *   `Precios`: Scroll suave a `#pricing`.
*   **Acciones**:
    *   `Registrar Negocio`: Botón primario morado (`#7f00ff`) que acciona un scroll suave a `#registro`.

### 2.2 Hero y Buscador de Links
*   **Título**: *"Un solo link. Todo tu negocio resuelto."* con tipografía Apple grande y degradado de marca en la segunda frase.
*   **Buscador**:
    *   Un input estilizado que muestra el prefijo fijo `agendalink.com/`.
    *   El usuario ingresa el nombre de su negocio (slug).
    *   Al hacer clic en **"Crear mi link"**:
        1.  Toma el texto ingresado.
        2.  Pre-popula el campo **Nombre del Negocio** del paso 1 del formulario de onboarding.
        3.  Ejecuta un scroll suave hacia la sección `#registro` para que el usuario complete su registro.

### 2.3 Mockups Visuales con CSS
Para ilustrar las interfaces del sistema de forma limpia sin recargar de imágenes pesadas, colocaremos maquetas maquetadas en CSS puro:
*   **Mockup iPhone (Cliente)**:
    *   Diseño vertical con bordes redondeados y sombra.
    *   Muestra la interfaz del cliente: el nombre del negocio, un servicio seleccionado (ej. "Corte de Pelo"), y el botón simulado "Pagar con  Pay".
*   **Mockup macOS (Administración)**:
    *   Una ventana simulada de Safari con los tres botones superiores de cierre/minimizar de Mac.
    *   Muestra la grilla del calendario semanal con las citas en colores y badges de "✓ PAGADO".

### 2.4 Grilla de Beneficios (Apple Grid)
Tres tarjetas con glassmorphism sobre fondo blanco:
1.  **Simpleza Absoluta**: Reserva y pago en 4 clics, sin contraseñas ni descargas para el cliente.
2.  **Asistentes Linki IA**: Bots automáticos que agendan en WhatsApp 24/7 y reactivan clientes.
3.  **QR Listo para Colgar**: Cartel de vitrina A4 y tarjetas de presentación listas para imprimir.

### 2.5 Tabla de Planes
Tarjetas de precios para planes Individual (Gratis), Equipo ($19.990 CLP/mes) y Negocio ($39.990 CLP/mes).
*   Al presionar "Comenzar" en un plan:
    1.  Pre-selecciona el tamaño del equipo en el formulario del paso 1 (Individual -> "Solo yo", Equipo -> "2-5 personas", Negocio -> "6+ personas").
    2.  Ejecuta un scroll suave a `#registro`.

---

## 3. Especificación Técnica de Archivos

### 3.1 [page.tsx](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/page.tsx)
*   Se convierte la página de onboarding actual en la landing page completa.
*   Se encapsula el formulario de onboarding existente dentro de un contenedor `<section id="registro">`.
*   Se agregan los estados y manejadores de scroll suave y transferencia de valores:
    ```typescript
    const [heroSlug, setHeroSlug] = useState("");
    const handleHeroSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setFormData(prev => ({ ...prev, name: heroSlug }));
      document.getElementById("registro")?.scrollIntoView({ behavior: "smooth" });
    };
    const handleSelectPlan = (teamSize: string) => {
      setFormData(prev => ({ ...prev, teamSize }));
      document.getElementById("registro")?.scrollIntoView({ behavior: "smooth" });
    };
    ```

### 3.2 [page.module.css](file:///Users/dekgiovannirepetto/Documents/DEVELOPER/Agenda%20Link/src/app/page.module.css)
*   Se redefine para soportar layouts de cuadrícula de beneficios, tablas de precios, mockups CSS y posicionamiento del Hero.
