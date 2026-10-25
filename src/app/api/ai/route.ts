import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession, requireBusinessMembership } from "@/server/authorize";
import { callGemini } from "@/server/gemini";
import { logServerError } from "@/server/observability";
import { enforceRateLimit } from "@/server/rate-limit";

export async function POST(request: Request) {
  let businessId: string | undefined;

  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Cuerpo de solicitud inválido" }, { status: 400 });
    }

    const { action, slug } = body as { action?: string; slug?: string; [key: string]: unknown };

    if (!slug || typeof slug !== "string") {
      return NextResponse.json({ error: "Falta el parámetro slug" }, { status: 400 });
    }

    const business = await prisma.business.findUnique({
      where: { slug: slug.trim() },
      include: {
        services: { select: { id: true, name: true, price: true, duration: true } },
        professionals: { select: { id: true, name: true } },
      },
    });

    if (!business) {
      return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });
    }

    businessId = business.id;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://agendalink.cl";

    // ----------------------------------------------------
    // ACCIÓN PÚBLICA: CHAT CON LINKI SECRETARY PARA CLIENTES
    // ----------------------------------------------------
    if (action === "public-secretary-chat" || action === "secretary-chat") {
      const rateLimitResponse = await enforceRateLimit(request, "BOOKING_RATE_LIMITER", "linki-chat");
      if (rateLimitResponse) return rateLimitResponse;

      const { userMessage, chatHistory } = body as {
        userMessage?: string;
        chatHistory?: Array<{ role: "user" | "assistant"; text: string }>;
      };

      if (!userMessage || typeof userMessage !== "string" || !userMessage.trim()) {
        return NextResponse.json({ error: "Falta el mensaje del usuario" }, { status: 400 });
      }

      if (userMessage.length > 500) {
        return NextResponse.json({ error: "El mensaje es demasiado extenso (máximo 500 caracteres)" }, { status: 400 });
      }

      const servicesSummary = business.services
        .map((s) => `• ${s.name}: $${s.price.toLocaleString("es-CL")} CLP (Duración: ${s.duration} min)`)
        .join("\n");
      const professionalsSummary = business.professionals.map((p) => p.name).join(", ");

      const systemInstruction = `Eres Linki, la asistente virtual y recepcionista oficial de reservas de "${business.name}" (${business.category || "Servicios"}).
Tu misión es atender con calidez, rapidez y profesionalismo a los clientes y visitantes de nuestra página web, respondiendo dudas sobre precios, servicios, horarios y ubicación, y animándolos a agendar su cita de inmediato en esta misma página.

Información oficial y real de "${business.name}":
- Catálogo de servicios y precios:
${servicesSummary || "Consulta directa por WhatsApp"}
- Equipo de profesionales: ${professionalsSummary || "Atención personalizada"}
- Horario de atención: ${business.landingHours || "Lunes a Sábado de 09:00 a 19:00 hrs"}
- Dirección / Ubicación: ${business.landingAddress || "Consultar directamente"}
- Teléfono / WhatsApp: ${business.landingPhone || "No especificado"}
- Enlace para agendar en línea: ${appUrl}/${business.slug}

Reglas estrictas de atención:
1. Responde de forma concisa (máximo 2 a 3 oraciones cortas), cálida y directa en español chileno/latinoamericano.
2. Si preguntan por precios, duración o servicios, entrega la información exacta y clara con los valores en CLP.
3. Invita siempre amablemente al cliente a agendar directamente haciendo clic en el botón de reservar que tiene en pantalla.
4. Si preguntan algo que no está en la información, indícales con amabilidad que pueden contactar directamente al negocio por WhatsApp o teléfono.
5. NUNCA inventes precios, promociones ni horarios que no estén en la lista oficial.
6. No uses un lenguaje robótico ni digas que eres un simulador de pruebas; eres la asistente oficial de reservas en línea del negocio.`;

      let historyContext = "";
      if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        historyContext = "Historial reciente de la conversación:\n" +
          chatHistory.slice(-6).map((m) => `${m.role === "user" ? "Cliente" : "Linki"}: ${m.text}`).join("\n") +
          "\n\n";
      }

      const prompt = `${historyContext}Cliente: ${userMessage.trim()}\nLinki:`;

      const aiResponse = await callGemini({
        systemInstruction,
        prompt,
        temperature: 0.6,
        maxOutputTokens: 500,
      });

      return NextResponse.json({
        success: aiResponse.ok,
        reply: aiResponse.text || `¡Hola! Con gusto te ayudo a agendar tu cita en ${business.name}. Puedes elegir tu servicio y horario directamente aquí en la página.`,
        error: aiResponse.error,
      });
    }

    // ACCIONES ADMINISTRATIVAS PRIVADAS (Requieren sesión y membresía de negocio)
    const session = await requireSession(request);
    if (!session.ok) return session.response;

    const auth = await requireBusinessMembership(session.user, business.id);
    if (!auth.ok) return auth.response;

    // ----------------------------------------------------
    // ACCIÓN 1: REPORTE ESTRATÉGICO DE LINKI BUSINESS
    // ----------------------------------------------------
    if (action === "business-report") {
      const appointments = await prisma.appointment.findMany({
        where: { businessId: business.id },
        orderBy: { dateTime: "desc" },
        take: 100,
        select: {
          dateTime: true,
          status: true,
          paymentStatus: true,
          paymentAmount: true,
          service: { select: { name: true, price: true } },
          professional: { select: { name: true } },
        },
      });

      const totalRevenue = appointments
        .filter((a) => a.paymentStatus === "PAID")
        .reduce((sum, a) => sum + (a.paymentAmount || a.service?.price || 0), 0);

      // Calcular distribución por día de la semana
      const dayCounts: Record<string, number> = {
        Lunes: 0,
        Martes: 0,
        Miércoles: 0,
        Jueves: 0,
        Viernes: 0,
        Sábado: 0,
        Domingo: 0,
      };
      const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
      for (const app of appointments) {
        const d = new Date(app.dateTime);
        const dayName = days[d.getDay()] || "Desconocido";
        if (dayCounts[dayName] !== undefined) dayCounts[dayName]++;
      }

      // Ranking de servicios y profesionales
      const serviceCounts: Record<string, number> = {};
      const profCounts: Record<string, number> = {};
      for (const app of appointments) {
        const sName = app.service?.name || "General";
        serviceCounts[sName] = (serviceCounts[sName] || 0) + 1;
        const pName = app.professional?.name || "General";
        profCounts[pName] = (profCounts[pName] || 0) + 1;
      }

      const servicesSummary = business.services.map((s) => `${s.name} ($${s.price.toLocaleString("es-CL")})`).join(", ");
      const professionalsSummary = business.professionals.map((p) => p.name).join(", ");
      const dayDistribution = Object.entries(dayCounts).map(([day, count]) => `${day}: ${count} citas`).join(", ");

      const prompt = `Analiza estos datos operativos reales del negocio "${business.name}" (${business.category || "Servicios"}, Chile):
- Total de citas históricas analizadas: ${appointments.length}
- Facturación pagada registrada: $${totalRevenue.toLocaleString("es-CL")} ${business.currency}
- Servicios activos: ${servicesSummary || "Sin servicios cargados"}
- Equipo de profesionales: ${professionalsSummary || "Sin profesionales cargados"}
- Distribución de reservas por día: ${dayDistribution}
- Servicios más demandados: ${JSON.stringify(serviceCounts)}
- Profesionales con más citas: ${JSON.stringify(profCounts)}

Por favor genera un reporte de asesoría de negocios estructurado en Markdown con las siguientes 4 secciones claras:
### 1. 📊 Diagnóstico General del Negocio
(Evalúa el volumen de citas, la salud del flujo de agendamiento y la facturación).

### 2. ⭐ Servicios y Profesionales Estrella
(Identifica qué servicios generan mayor interés y qué miembros del equipo lideran la demanda).

### 3. 🎯 Oportunidades y Días Valle
(Señala qué días tienen menor ocupación y cómo incentivar la demanda en esos períodos).

### 4. 💡 3 Acciones Concretas para esta Semana
(Entrega 3 recomendaciones directas, viables y de impacto rápido para aumentar las ventas y fidelización).

Usa un tono profesional, motivador y claro para el dueño del negocio.`;

      const aiResponse = await callGemini({
        systemInstruction: "Eres Linki Business, el consultor de negocios y analista estratégico inteligente de AgendaLink. Ayudas a dueños de negocios en Chile y Latinoamérica a rentabilizar su tiempo y multiplicar sus clientes.",
        prompt,
        temperature: 0.7,
      });

      return NextResponse.json({
        success: aiResponse.ok,
        report: aiResponse.text || "No se pudo generar el reporte.",
        generatedAt: new Date().toISOString(),
        error: aiResponse.error,
      });
    }

    // ----------------------------------------------------
    // ACCIÓN 2: CAMPAÑAS Y REACTIVACIÓN DE LINKI MARKETING
    // ----------------------------------------------------
    if (action === "marketing-campaign") {
      const appointments = await prisma.appointment.findMany({
        where: { businessId: business.id },
        orderBy: { dateTime: "desc" },
        take: 150,
        select: {
          clientName: true,
          clientWhatsApp: true,
          dateTime: true,
          service: { select: { name: true } },
        },
      });

      // Agrupar clientes únicos y su última cita
      const clientsMap = new Map<string, { name: string; phone: string; lastDate: Date; lastService: string; daysAgo: number }>();
      const now = new Date();

      for (const app of appointments) {
        if (!app.clientWhatsApp) continue;
        const normalizedPhone = app.clientWhatsApp.trim();
        if (!clientsMap.has(normalizedPhone)) {
          const appDate = new Date(app.dateTime);
          const diffDays = Math.floor((now.getTime() - appDate.getTime()) / (1000 * 60 * 60 * 24));
          clientsMap.set(normalizedPhone, {
            name: app.clientName,
            phone: normalizedPhone,
            lastDate: appDate,
            lastService: app.service?.name || "Servicio",
            daysAgo: Math.max(0, diffDays),
          });
        }
      }

      const clientList = Array.from(clientsMap.values());
      // Ordenar por más tiempo sin venir
      clientList.sort((a, b) => b.daysAgo - a.daysAgo);

      const servicesSummary = business.services.map((s) => s.name).join(", ");

      const prompt = `Negocio: "${business.name}" (${business.category || "Servicios"})
Enlace público de reserva: ${appUrl}/${business.slug}
Servicios: ${servicesSummary}

Crea 3 plantillas de mensajes promocionales de WhatsApp para reactivar clientes inactivos.
Cada plantilla debe tener:
- Título atractivo de la campaña
- Objetivo (ej: Clientes de hace 30 días, Oferta martes/miércoles, Novedades)
- Mensaje exacto listo para enviar por WhatsApp (debe incluir el saludo con [Nombre], mencionar el negocio "${business.name}", un beneficio o promo tentadora, y el link directo de reservas: ${appUrl}/${business.slug}).
- Tono: cercano, profesional y con emojis amigables.

Devuelve la respuesta en formato JSON con la siguiente estructura:
{
  "campaigns": [
    {
      "id": "1",
      "title": "...",
      "target": "...",
      "message": "..."
    }
  ]
}`;

      const aiResponse = await callGemini({
        systemInstruction: "Eres Linki Marketing, el especialista en retención y campañas de WhatsApp para AgendaLink. Respondes exclusivamente con el JSON solicitado sin bloques de código markdown.",
        prompt,
        temperature: 0.6,
      });

      let parsedCampaigns = [];
      if (aiResponse.ok && aiResponse.text) {
        try {
          const cleanedText = aiResponse.text.replace(/```json/g, "").replace(/```/g, "").trim();
          const parsed = JSON.parse(cleanedText);
          parsedCampaigns = parsed.campaigns || [];
        } catch {
          // Fallback a campañas predeterminadas si el parseo falla
          parsedCampaigns = [
            {
              id: "1",
              title: "Reactivación Especial 15% OFF",
              target: "Clientes con más de 30 días sin agendar",
              message: `¡Hola [Nombre]! Te extrañamos en ${business.name} 😊 Hace un tiempo que no te vemos. Queremos regalarte un 15% de descuento en tu próxima visita. Reserva tu hora directamente aquí: ${appUrl}/${business.slug} ¡Te esperamos!`,
            },
            {
              id: "2",
              title: "Renovación y Cuidado Personal",
              target: "Fidelización de clientes frecuentes",
              message: `¡Hola [Nombre]! En ${business.name} queremos asegurarnos de que sigas luciendo y sintiéndote increíble ✨ Tenemos nuevos cupos disponibles esta semana. Elige tu horario favorito con un clic: ${appUrl}/${business.slug}`,
            },
          ];
        }
      }

      return NextResponse.json({
        success: true,
        campaigns: parsedCampaigns,
        clients: clientList.slice(0, 50),
        totalClients: clientList.length,
      });
    }

    return NextResponse.json({ error: "Acción no reconocida" }, { status: 400 });
  } catch (error) {
    logServerError(request, "ai.action.failed", error, { businessId });
    return NextResponse.json({ error: "Error interno procesando la solicitud de IA" }, { status: 500 });
  }
}
