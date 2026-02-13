import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import * as db from "../db.js";
import { createToken } from "../middleware/auth.js";

var router = new Router();

router.post("/api/auth/signup", async function (ctx) {
  try {
    var result = ctx.request.body({ type: "json" });
    var body = await result.value;
    var username = body.username;
    var password = body.password;
    if (!username || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Username and password required" };
      return;
    }
    var existing = await db.getMemberByUsername(username);
    if (existing) {
      ctx.response.status = 409;
      ctx.response.body = { error: "Username already taken" };
      return;
    }
    var hash = await bcrypt.hash(password);
    var id = await db.createMember(username, hash);
    var token = await createToken(id);
    ctx.response.body = { token: token, memberId: id, username: username };
  } catch (e) {
    console.error("Signup error:", e);
    ctx.response.status = 500;
    var errorMsg = e.message || String(e);
    ctx.response.body = { error: errorMsg };
  }
});

router.post("/api/auth/login", async function (ctx) {
  try {
    var result = ctx.request.body({ type: "json" });
    var body = await result.value;
    var username = body.username;
    var password = body.password;
    if (!username || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Username and password required" };
      return;
    }
    var member = await db.getMemberByUsername(username);
    if (!member) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid username or password" };
      return;
    }
    var passwordMatch = await bcrypt.compare(password, member.password_hash);
    if (!passwordMatch) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid username or password" };
      return;
    }
    var token = await createToken(member.id);
    ctx.response.body = { token: token, memberId: member.id, username: member.username };
  } catch (e) {
    ctx.response.status = 500;
    var errorMsg = e.message || String(e);
    ctx.response.body = { error: errorMsg };
  }
});

export default router;
