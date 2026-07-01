# Deployment Guide

This project works locally and on a demo/cloud server. Follow these steps.

## Why deployment may fail

1. **Missing Deno permissions** – the server must run with `--allow-net --allow-read --allow-env`
2. **Wrong port** – hosting platforms set a `PORT` environment variable (not always 3000)
3. **Database on localhost** – `localhost` only works on your own computer; a deployed server needs a real database URL
4. **PostgreSQL not set up** – the database and tables must exist before the app starts

## Quick start on a server

### 1. Set up PostgreSQL

Create a PostgreSQL database (local server, Render, Supabase, Neon, etc.) and run:

```bash
psql -d YOUR_DATABASE_NAME -f sql/init.sql
```

### 2. Set environment variables

On the hosting platform, set:

| Variable | Example | Required for deployment |
|----------|---------|-------------------------|
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` | Yes |
| `PORT` | `8080` | Usually set automatically by the host |
| `JWT_SECRET` | `your-secret-key-here` | Recommended |

**Local development** – if you do not set these, the app uses defaults in `backend/config.js`.

### 3. Start the server

From the `backend` folder:

```bash
cd backend
deno task start
```

Or:

```bash
deno run --allow-net --allow-read --allow-env main.js
```

### 4. Open the site

Visit the URL given by your host, for example:

- Local: `http://localhost:3000`
- Deployed: `https://your-app-name.onrender.com`

## Render.com example

1. Create a **PostgreSQL** database on Render
2. Run `sql/init.sql` on that database
3. Create a **Web Service**
   - **Root directory:** `backend`
   - **Build command:** (leave empty)
   - **Start command:** `deno run --allow-net --allow-read --allow-env main.js`
4. Add environment variables:
   - `DATABASE_URL` = your Render PostgreSQL connection string
   - `JWT_SECRET` = any long random string
5. Deploy

## Test login after deployment

Use the seed users from `sql/init.sql`:

- Username: `alice` | Password: `password`
- Username: `bob` | Password: `password`
- Username: `charlie` | Password: `password`

## Check the app is running

- Open the homepage – you should see the Paper Link front page
- Open `/api/links` – you should get JSON with links (or an empty list)
- If you see **500 errors**, check:
  - Database connection (`DATABASE_URL` is correct)
  - `init.sql` was run
  - Server was started with `--allow-read`
