import { Client } from "https://deno.land/x/postgres@v0.17.0/mod.ts";
import { config } from "./config.js";

var client = null;

function convertBigInts(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === "bigint") {
    return Number(obj);
  }
  if (Array.isArray(obj)) {
    var result = [];
    for (var i = 0; i < obj.length; i++) {
      result.push(convertBigInts(obj[i]));
    }
    return result;
  }
  if (typeof obj === "object") {
    var result = {};
    var keys = Object.keys(obj);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      result[key] = convertBigInts(obj[key]);
    }
    return result;
  }
  return obj;
}

export async function getClient() {
  if (client === null) {
    client = new Client(config.dbUrl);
    try {
      await client.connect();
    } catch (e) {
      console.error("Database connection error:", e.message);
      throw new Error("Failed to connect to database. Please check your database is running and the connection string is correct.");
    }
  }
  return client;
}

export async function getMemberById(id) {
  var c = await getClient();
  var r = await c.queryObject(
    "SELECT id, username, points, created_at FROM members WHERE id = $1",
    [id]
  );
  if (r.rows[0]) {
    return convertBigInts(r.rows[0]);
  }
  return null;
}

export async function getMemberByUsername(username) {
  var c = await getClient();
  var r = await c.queryObject(
    "SELECT id, username, password_hash, points FROM members WHERE username = $1",
    [username]
  );
  if (r.rows[0]) {
    return convertBigInts(r.rows[0]);
  }
  return null;
}

export async function createMember(username, passwordHash) {
  try {
    var c = await getClient();
    var r = await c.queryObject(
      "INSERT INTO members (username, password_hash) VALUES ($1, $2) RETURNING id",
      [username, passwordHash]
    );
    return Number(r.rows[0].id);
  } catch (e) {
    console.error("createMember error:", e);
    throw e;
  }
}

export async function listLinks(sort, memberId) {
  var c = await getClient();
  var order;
  if (sort === "rated") {
    order = "ORDER BY aggregate_rating DESC NULLS LAST, created_at DESC";
  } else {
    order = "ORDER BY created_at DESC";
  }
  var sql = "SELECT l.id, l.member_id, l.title, l.description, l.url, l.created_at, " +
            "m.username, m.points, " +
            "(SELECT COALESCE(SUM(CASE WHEN r.is_positive THEN 1 ELSE -1 END), 0) FROM ratings r WHERE r.link_id = l.id) AS aggregate_rating, " +
            "(SELECT COUNT(*) FROM ratings r WHERE r.link_id = l.id AND r.is_positive) AS positive_count, " +
            "(SELECT COUNT(*) FROM ratings r WHERE r.link_id = l.id AND NOT r.is_positive) AS negative_count " +
            "FROM links l " +
            "JOIN members m ON m.id = l.member_id";
  var params = [];
  if (memberId !== null && memberId !== undefined) {
    sql += " WHERE l.id NOT IN (SELECT link_id FROM hidden_links WHERE member_id = $1)";
    params.push(memberId);
  }
  sql += " " + order;
  var r = await c.queryObject(sql, params);
  var rows = convertBigInts(r.rows);
  if (memberId !== null && memberId !== undefined) {
    var hidden = await c.queryObject(
      "SELECT link_id FROM hidden_links WHERE member_id = $1",
      [memberId]
    );
    var hidSet = new Set();
    for (var i = 0; i < hidden.rows.length; i++) {
      hidSet.add(Number(hidden.rows[i].link_id));
    }
    for (var j = 0; j < rows.length; j++) {
      rows[j].hidden = hidSet.has(rows[j].id);
    }
  }
  return rows;
}

export async function addLink(memberId, title, description, url) {
  try {
    var c = await getClient();
    var urlValue = url || null;
    var r = await c.queryObject(
      "INSERT INTO links (member_id, title, description, url) VALUES ($1, $2, $3, $4) RETURNING id",
      [memberId, title, description, urlValue]
    );
    return Number(r.rows[0].id);
  } catch (e) {
    console.error("addLink error:", e);
    throw e;
  }
}

export async function getLink(linkId, memberId) {
  var c = await getClient();
  var sql = "SELECT l.id, l.member_id, l.title, l.description, l.url, l.created_at, " +
            "m.username, m.points, " +
            "(SELECT COALESCE(SUM(CASE WHEN r.is_positive THEN 1 ELSE -1 END), 0) FROM ratings r WHERE r.link_id = l.id) AS aggregate_rating, " +
            "(SELECT COUNT(*) FROM ratings r WHERE r.link_id = l.id AND r.is_positive) AS positive_count, " +
            "(SELECT COUNT(*) FROM ratings r WHERE r.link_id = l.id AND NOT r.is_positive) AS negative_count " +
            "FROM links l " +
            "JOIN members m ON m.id = l.member_id " +
            "WHERE l.id = $1";
  var r = await c.queryObject(sql, [linkId]);
  var row = null;
  if (r.rows[0]) {
    row = convertBigInts(r.rows[0]);
  }
  if (row && memberId !== null && memberId !== undefined) {
    var hid = await c.queryObject(
      "SELECT link_id FROM hidden_links WHERE member_id = $1 AND link_id = $2",
      [memberId, linkId]
    );
    row.hidden = hid.rows.length > 0;
  }
  return row;
}

export async function rateLink(linkId, memberId, positive) {
  var c = await getClient();
  var existing = await c.queryObject(
    "SELECT is_positive FROM ratings WHERE link_id = $1 AND member_id = $2",
    [linkId, memberId]
  );
  var owner = await c.queryObject(
    "SELECT member_id FROM links WHERE id = $1",
    [linkId]
  );
  var ownerId = null;
  if (owner.rows[0]) {
    ownerId = Number(owner.rows[0].member_id);
  }
  if (!ownerId) {
    return { updated: false };
  }

  if (existing.rows.length === 0) {
    await c.queryArray(
      "INSERT INTO ratings (link_id, member_id, is_positive) VALUES ($1, $2, $3)",
      [linkId, memberId, positive]
    );
    var delta;
    if (positive) {
      delta = 1;
    } else {
      delta = -1;
    }
    await c.queryArray(
      "UPDATE members SET points = points + $1 WHERE id = $2",
      [delta, ownerId]
    );
    return { updated: true };
  }

  var prev = Boolean(existing.rows[0].is_positive);
  if (prev === positive) {
    return { updated: false };
  }

  await c.queryArray(
    "UPDATE ratings SET is_positive = $1 WHERE link_id = $2 AND member_id = $3",
    [positive, linkId, memberId]
  );
  var delta2;
  if (positive) {//down to upvote
    delta2 = 2;
  } else {//up to downvote
    delta2 = -2;
  }
  await c.queryArray(
    "UPDATE members SET points = points + $1 WHERE id = $2",
    [delta2, ownerId]
  );
  return { updated: true };
}

export async function hideLink(linkId, memberId) {
  var c = await getClient();
  await c.queryArray(
    "INSERT INTO hidden_links (member_id, link_id) VALUES ($1, $2) ON CONFLICT (member_id, link_id) DO NOTHING",
    [memberId, linkId]
  );
}

export async function favourites(memberId) {
  var c = await getClient();
  var sql = "SELECT l.id, l.member_id, l.title, l.description, l.url, l.created_at, " +
            "m.username, m.points, " +
            "(SELECT COALESCE(SUM(CASE WHEN r.is_positive THEN 1 ELSE -1 END), 0) FROM ratings r WHERE r.link_id = l.id) AS aggregate_rating, " +
            "(SELECT COUNT(*) FROM ratings r WHERE r.link_id = l.id AND r.is_positive) AS positive_count, " +
            "(SELECT COUNT(*) FROM ratings r WHERE r.link_id = l.id AND NOT r.is_positive) AS negative_count " +
            "FROM links l " +
            "JOIN members m ON m.id = l.member_id " +
            "JOIN ratings r0 ON r0.link_id = l.id AND r0.member_id = $1 AND r0.is_positive " +
            "ORDER BY l.created_at DESC";
  var r = await c.queryObject(sql, [memberId]);
  return convertBigInts(r.rows);
}

export async function getHiddenLinks(memberId) {
  var c = await getClient();
  var sql = "SELECT l.id, l.member_id, l.title, l.description, l.url, l.created_at, " +
            "m.username, m.points, " +
            "(SELECT COALESCE(SUM(CASE WHEN r.is_positive THEN 1 ELSE -1 END), 0) FROM ratings r WHERE r.link_id = l.id) AS aggregate_rating, " +
            "(SELECT COUNT(*) FROM ratings r WHERE r.link_id = l.id AND r.is_positive) AS positive_count, " +
            "(SELECT COUNT(*) FROM ratings r WHERE r.link_id = l.id AND NOT r.is_positive) AS negative_count " +
            "FROM links l " +
            "JOIN members m ON m.id = l.member_id " +
            "JOIN hidden_links hl ON hl.link_id = l.id AND hl.member_id = $1 " +
            "ORDER BY l.created_at DESC";
  var r = await c.queryObject(sql, [memberId]);
  return convertBigInts(r.rows);
}

export async function getUserRating(linkId, memberId) {
  var c = await getClient();
  var r = await c.queryObject(
    "SELECT is_positive FROM ratings WHERE link_id = $1 AND member_id = $2",
    [linkId, memberId]
  );
  if (r.rows[0]) {
    return Boolean(r.rows[0].is_positive);
  }
  return null;
}
