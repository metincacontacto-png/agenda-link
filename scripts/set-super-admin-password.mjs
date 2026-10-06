import { execFileSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const ITERATIONS = 100_000;
const EMAIL = process.argv[2]?.trim().toLowerCase();

function readHidden(prompt) {
  if (!stdin.isTTY) {
    throw new Error("Ejecuta este comando en una terminal interactiva para ocultar la contraseña.");
  }

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

function encodeBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const hash = new Uint8Array(await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256,
  ));
  return `pbkdf2-sha256$${ITERATIONS}$${encodeBase64Url(salt)}$${encodeBase64Url(hash)}`;
}

async function main() {
  let email = EMAIL;
  if (!email) {
    const readline = createInterface({ input: stdin, output: stdout });
    email = (await readline.question("Email de la cuenta Super Admin: ")).trim().toLowerCase();
    readline.close();
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new Error("Email inválido.");
  }

  const password = await readHidden("Nueva contraseña (12-128 caracteres): ");
  if (password.length < 12 || password.length > 128) {
    throw new Error("La contraseña debe tener entre 12 y 128 caracteres.");
  }
  const confirmation = await readHidden("Confirma la contraseña: ");
  if (password !== confirmation) throw new Error("Las contraseñas no coinciden.");

  const passwordHash = await hashPassword(password);
  const sqlEmail = email.replace(/'/g, "''");
  const sql = `UPDATE "User" SET "passwordHash" = '${passwordHash}', "updatedAt" = CURRENT_TIMESTAMP WHERE LOWER(TRIM("email")) = '${sqlEmail}' AND "globalRole" = 'SUPER_ADMIN' RETURNING "id";`;

  let output;
  try {
    output = execFileSync("npx", [
      "wrangler", "d1", "execute", "agenda-link-db", "--remote", "--command", sql,
    ], { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  } catch {
    throw new Error("No se pudo actualizar la cuenta en D1; no se mostró ni guardó la contraseña.");
  }

  if (!/"changes"\s*:\s*1/.test(output)) {
    throw new Error("No se actualizó ninguna cuenta Super Admin con ese email.");
  }
  stdout.write("Contraseña de Super Admin actualizada. La contraseña no se guardó ni se imprimió.\n");
}

main().catch((error) => {
  stdout.write(`${error instanceof Error ? error.message : "No se pudo completar la operación."}\n`);
  process.exitCode = 1;
});
