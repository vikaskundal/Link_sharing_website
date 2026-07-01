import { fromFileUrl } from "https://deno.land/std@0.208.0/path/mod.ts";

var port = 3000;
if (Deno.env.get("PORT")) {
  port = parseInt(Deno.env.get("PORT"), 10);
}

var dbUrl = "postgresql://postgres:postgres@localhost:5432/itech3108_vikaskundal_a2";
if (Deno.env.get("DATABASE_URL")) {
  dbUrl = Deno.env.get("DATABASE_URL");
}

var jwtSecret = "JWT_SECRET";
if (Deno.env.get("JWT_SECRET")) {
  jwtSecret = Deno.env.get("JWT_SECRET");
}

var config = {
  port: port,
  hostname: "0.0.0.0",
  dbUrl: dbUrl,
  jwtSecret: jwtSecret,
  frontendDir: fromFileUrl(new URL("../frontend", import.meta.url)),
};

export { config };
