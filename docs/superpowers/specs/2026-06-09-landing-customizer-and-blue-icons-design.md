# Documento de Diseño: Personalizador de Landing y Iconos Azules

Este documento especifica los cambios de diseño y arquitectura para reestructurar la personalización de la Landing Page en el Panel de Administración de AgendaLink, extrayendo el editor de perfil a una pestaña de nivel superior, y actualizando la visualización de características/ventajas en la landing page pública y el simulador móvil con iconos vectoriales planos de color azul corporativo.

---

## 1. Requerimientos y Casos de Uso

*   **Pestaña de Nivel Superior (Botón Externo):** El usuario quiere editar la Landing Page directamente desde la barra lateral, sin tener que navegar por sub-pestañas dentro de "Ajustes de Negocio".
*   **Iconos Azules de Marca:** Reemplazar los emojis de las 3 características principales por iconos vectoriales SVG planos de color azul en la landing page pública y el simulador de iPhone.

---

## 2. Arquitectura de Navegación y Estado

### 2.1 Cambios en `activeTab`
En `src/app/admin/[slug]/page.tsx`, ampliaremos la unión de tipos del estado `activeTab` para admitir `"landing"`:
```typescript
const [activeTab, setActiveTab] = useState<"dashboard" | "ventas" | "clientes" | "administracion" | "calendario" | "reservas" | "secretary" | "marketing" | "business" | "mesas" | "carta" | "landing">("dashboard");
```

### 2.2 Botones de la Barra Lateral (Sidebar)
Agregaremos una nueva pestaña en la sección de "Configuración" de la barra lateral:
*   **Texto:** Personalizar Landing
*   **Icono:** Un SVG de plantilla/diseño de página.
*   **Acción:** `setActiveTab("landing")`
*   **Estilo:** Heredará la clase `.navItem` y `.navItemActive` cuando esté activo, garantizando la consistencia visual.

---

## 3. Reubicación del Panel de Personalización

El panel en dos columnas (`styles.perfilLayoutGrid`) que reside actualmente en:
```typescript
{activeTab === "administracion" && adminSubTab === "perfil" && ( ... )}
```
Se moverá a su propio bloque condicional de nivel superior:
```typescript
{activeTab === "landing" && ( ... )}
```
Al mismo tiempo, la sub-pestaña `"perfil"` se eliminará del control segmentado de `"administracion"`. El botón "Ajustes de Negocio" apuntará directamente a la pestaña `"servicios"`.

---

## 4. Iconos Vectoriales SVG Planos Azules

import json

log_path = "/Users/dekgiovannirepetto/.gemini/antigravity/brain/9e748bce-872c-4683-9f42-dfe2b1d15c71/.system_generated/logs/transcript.jsonl"

print("Escaneando todo transcript.jsonl...")

with open(log_path, "r", encoding="utf-8") as f:
    for i, line in enumerate(f):
        try:
            step = json.loads(line)
            content = step.get("content", "")
            step_type = step.get("type", "")
            
            # Buscar menciones a page.tsx en tool_calls o content
            if "page.tsx" in line:
                # Si es un tool call o es un output
                tool_calls = step.get("tool_calls", [])
                for call in tool_calls:
                    name = call.get("name", "")
                    if "page.tsx" in str(call):
                        print(f"Línea {i+1} (Paso {step.get('step_index')}): LLAMADA A {name}")
                
                if step_type in ["VIEW_FILE", "WRITE_TO_FILE", "REPLACE_FILE_CONTENT", "MULTI_REPLACE_FILE_CONTENT"] or "page.tsx" in content:
                    # Si es un view de page.tsx
                    if "Total Lines:" in content and "page.tsx" in content:
                        print(f"Línea {i+1} (Paso {step.get('step_index')}): VISTA DE page.tsx ({content[:100]}...)")
                    elif "diff_block_start" in content:
                        print(f"Línea {i+1} (Paso {step.get('step_index')}): DIFF DE page.tsx")
        except Exception as e:
            pass

### 4.2 Contenedor de Iconos y Estilos
Crearemos estilos en `page.module.css` (de la página pública) y `admin.module.css` (para el simulador):
```css
.featureIconWrapper {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(0, 102, 255, 0.05);
  border: 1px solid rgba(0, 102, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--primary);
  transition: all 0.3s ease;
}

.featureItem:hover .featureIconWrapper {
  background: rgba(0, 102, 255, 0.1);
  transform: scale(1.08);
}
```

---

## 5. Plan de Verificación

*   **Verificación de Compilación:** Ejecutar `npm run build` para asegurar que no haya errores de tipado de TypeScript en Next.js.
*   **Verificación Visual:** Comprobar la correcta alineación y color de los iconos en el simulador móvil del administrador y en la página pública del negocio.
