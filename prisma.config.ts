import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: "file:./prisma/dev.db", // Colocamos la BD dentro de la carpeta prisma para mantener orden
  },
});
