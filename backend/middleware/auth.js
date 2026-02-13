import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts";
import { config } from "../config.js";

var key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(config.jwtSecret),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
);

export async function createToken(memberId) {
  var now = Math.floor(Date.now() / 1000);
  var exp = now + (7 * 24 * 60 * 60);
  var payload = {
    sub: String(memberId),
    iat: now,
    exp: exp,
  }
  return await djwt.create(
    { alg: "HS256", typ: "JWT" },
    payload,
    key
  );
 }

export async function verifyToken(token) {
  try {
    var payload = await djwt.verify(token, key);
    return payload;
  } catch (e) {
    return null;
  }
}

export async function authMiddleware(ctx, next) {
  var auth = ctx.request.headers.get("Authorization");
  var token = null;
  if (auth && auth.startsWith("Bearer ")) {
    token = auth.slice(7);
  }
  if (!token) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }
  var payload = await verifyToken(token);
  if (!payload) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid or expired token" };
    return;
  }
  ctx.state.memberId = parseInt(payload.sub, 10);
  await next();
}

export async function optionalAuth(ctx, next) {
  var auth = ctx.request.headers.get("Authorization");
  var token = null;
  if (auth && auth.startsWith("Bearer ")) {
    token = auth.slice(7);
  }
  if (token) {
    var payload = await verifyToken(token);
    if (payload) {
      ctx.state.memberId = parseInt(payload.sub, 10);
    }
  }
  await next();
}
