import { Router } from "https://deno.land/x/oak@v12.6.1/mod.ts";
import * as db from "../db.js";
import { authMiddleware, optionalAuth } from "../middleware/auth.js";

var router = new Router();

function getMemberId(ctx) {
  if (ctx.state.memberId !== null && ctx.state.memberId !== undefined) {
    return ctx.state.memberId;
  }
  return null;
}

router.get("/api/links", optionalAuth, async function (ctx) {
  try {
    var sortParam = ctx.request.url.searchParams.get("sort");
    var sort = "recent";
    if (sortParam === "rated") {
      sort = "rated";
    }
    var memberId = getMemberId(ctx);
    var links = await db.listLinks(sort, memberId);
    ctx.response.body = { links: links };
  } catch (e) {
    ctx.response.status = 500;
    var errorMsg = e.message || String(e);
    ctx.response.body = { error: errorMsg };
  }
});

router.post("/api/links", authMiddleware, async function (ctx) {
  try {
    var result = ctx.request.body({ type: "json" });
    var body = await result.value;
    var title = body.title;
    var description = body.description;
    var url = body.url;
    if (!title || !description) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Title and description required" };
      return;
    }
    if (!url || (typeof url === "string" && !url.trim())) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Link URL is required" };
      return;
    }
    var memberId = ctx.state.memberId;
    var id = await db.addLink(memberId, title, description, url);
    var link = await db.getLink(id, memberId);
    ctx.response.body = { link: link };
  } catch (e) {
    ctx.response.status = 500;
    var errorMsg = e.message || String(e);
    ctx.response.body = { error: errorMsg };
  }
});

router.post("/api/links/:id/rate", authMiddleware, async function (ctx) {
  try {
    var idStr = ctx.params.id;
    var id = parseInt(idStr, 10);
    if (isNaN(id)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid link id" };
      return;
    }
    var result = ctx.request.body({ type: "json" });
    var body = await result.value;
    var positive = false;
    if (body.positive) {
      positive = true;
    }
    var memberId = ctx.state.memberId;
    var resultObj = await db.rateLink(id, memberId, positive);
    var updated = resultObj.updated;
    var link = await db.getLink(id, memberId);
    var userRating = await db.getUserRating(id, memberId);
    ctx.response.body = { link: link, updated: updated, userRating: userRating };
  } catch (e) {
    ctx.response.status = 500;
    var errorMsg = e.message || String(e);
    ctx.response.body = { error: errorMsg };
  }
});

router.post("/api/links/:id/hide", authMiddleware, async function (ctx) {
  try {
    var idStr = ctx.params.id;
    var id = parseInt(idStr, 10);
    if (isNaN(id)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid link id" };
      return;
    }
    var memberId = ctx.state.memberId;
    await db.hideLink(id, memberId);
    ctx.response.body = { ok: true };
  } catch (e) {
    ctx.response.status = 500;
    var errorMsg = e.message || String(e);
    ctx.response.body = { error: errorMsg };
  }
});

router.get("/api/links/favourites", authMiddleware, async function (ctx) {
  try {
    var memberId = ctx.state.memberId;
    var links = await db.favourites(memberId);
    ctx.response.body = { links: links };
  } catch (e) {
    ctx.response.status = 500;
    var errorMsg = e.message || String(e);
    ctx.response.body = { error: errorMsg };
  }
});

router.get("/api/members/me", authMiddleware, async function (ctx) {
  try {
    var memberId = ctx.state.memberId;
    var member = await db.getMemberById(memberId);
    if (!member) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Member not found" };
      return;
    }
    ctx.response.body = { member: member };
  } catch (e) {
    ctx.response.status = 500;
    var errorMsg = e.message || String(e);
    ctx.response.body = { error: errorMsg };
  }
});

router.get("/api/links/hidden", authMiddleware, async function (ctx) {
  try {
    var memberId = ctx.state.memberId;
    var links = await db.getHiddenLinks(memberId);
    ctx.response.body = { links: links };
  } catch (e) {
    ctx.response.status = 500;
    var errorMsg = e.message || String(e);
    ctx.response.body = { error: errorMsg };
  }
});

export default router;
