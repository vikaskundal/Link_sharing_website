import { fromFileUrl } from "https://deno.land/std@0.208.0/path/mod.ts";

var config = {
  port: 3000,
  dbUrl: "postgresql://postgres:postgres@localhost:5432/itech3108_vikaskundal_a2",
  jwtSecret: "JWT_SECRET",
  frontendDir: fromFileUrl(new URL("../frontend", import.meta.url)),
};

export { config };