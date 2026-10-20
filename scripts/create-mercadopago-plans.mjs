import { stdin, stdout } from "node:process";

const backUrl = process.env.MERCADOPAGO_BACK_URL || "https://agendalink.cl/login";

function readHidden(prompt) {
  if (!stdin.isTTY) throw new Error("Ejecuta este script en una terminal interactiva o define MERCADOPAGO_ACCESS_TOKEN de forma segura.");
  return new Promise((resolve, reject) => {
    let value = "";
    stdout.write(prompt);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const cleanup = () => {
      stdin.removeListener("data", onData);
      stdin.setRawMode(false);
      stdout.write("\n");
    };
    const onData = (chunk) => {
      for (const character of chunk) {
        if (character === "\u0003") {
          cleanup();
          reject(new Error("Operación cancelada."));
          return;
        }
        if (character === "\r" || character === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (character === "\u007f" || character === "\b") {
          value = value.slice(0, -1);
          continue;
        }
        value += character;
      }
    };
    stdin.on("data", onData);
  });
}

const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN || await readHidden("Mercado Pago access token: ");
if (!accessToken.startsWith("APP_USR-") && !accessToken.startsWith("TEST-")) {
  process.stderr.write("El token no tiene un formato válido de Mercado Pago (debe comenzar con APP_USR- o TEST-); no se crearán planes.\n");
  process.exit(1);
}

const plans = [
  { code: "INDIVIDUAL", name: "AgendaLink Individual", amount: 10000 },
  { code: "EQUIPO", name: "AgendaLink Básico", amount: 29000 },
  { code: "NEGOCIO", name: "AgendaLink Premium", amount: 49000 },
];

for (const plan of plans) {
  const body = {
    reason: plan.name,
    back_url: backUrl,
    status: "active",
    auto_recurring: {
      frequency: 1,
      frequency_type: "months",
      transaction_amount: plan.amount,
      currency_id: "CLP",
    },
  };
  const existingId = process.env[`MERCADOPAGO_PLAN_ID_${plan.code}`];
  const url = existingId
    ? `https://api.mercadopago.com/preapproval_plan/${existingId}`
    : "https://api.mercadopago.com/preapproval_plan";
  const method = existingId ? "PUT" : "POST";

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    process.stderr.write(`Error creando plan ${plan.code}: ${errText}\n`);
    continue;
  }

  const result = await res.json();
  process.stdout.write(`MERCADOPAGO_PLAN_ID_${plan.code}=${result.id} (${plan.name}: $${plan.amount.toLocaleString("es-CL")} CLP/mes)\n`);
  if (result.init_point) {
    process.stdout.write(`  Link de suscripción: ${result.init_point}\n`);
  }
}

process.stdout.write("Planes configurados con éxito.\n");
