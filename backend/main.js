import { Application } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import { send } from "https://deno.land/x/oak@v12.6.1/send.ts";
import authRoutes from "./routes/auth.js";
import linksRoutes from "./routes/links.js";
import { config } from "./config.js";

var app = new Application();

app.use(async function (ctx, next) {
  var origin = ctx.request.headers.get("Origin");
  var allowOrigin = "*";
  if (origin) {
    allowOrigin = origin;
  }
  ctx.response.headers.set("Access-Control-Allow-Origin", allowOrigin);
  ctx.response.headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (ctx.request.method === "OPTIONS") {
    ctx.response.status = 204;
    return;
  }
  await next();
});

app.use(authRoutes.routes());
app.use(authRoutes.allowedMethods());
app.use(linksRoutes.routes());
app.use(linksRoutes.allowedMethods());

app.use(async function (ctx, next) {
  if (ctx.request.url.pathname.startsWith("/api")) {
    return await next();
  }
  
  if (ctx.request.url.pathname.startsWith("/.well-known")) {
    ctx.response.status = 404;
    ctx.response.body = "Not found";
    return;
  }
  
  try {
    await send(ctx, ctx.request.url.pathname, {
      root: config.frontendDir,
      index: "index.html",
    });
  } catch (e) {
    if (e.status === 404 || e.name === "NotFound") {
      try {
        await send(ctx, "/index.html", {
          root: config.frontendDir,
        });
      } catch (e2) {
        ctx.response.status = 404;
        ctx.response.body = "Not found";
      }
    } else {
      console.error("Static file error:", e.message);
      ctx.response.status = 500;
      ctx.response.body = "Internal server error";
    }
  }
});

console.log("Server running at http://localhost:" + config.port);
await app.listen({ port: config.port });
