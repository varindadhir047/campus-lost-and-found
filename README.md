# Findly Campus — Phase 2 Starter

This starter preserves the seven original Phase 1 frontend files in `frontend/` and adds an Express/MVC-style backend in `backend/`.

## Step 1: Run backend locally

1. Install Node.js 20 or later.
2. Create a MongoDB Atlas database and allow your current development IP.
3. In `backend/`, copy `.env.example` to `.env` and replace `MONGODB_URI` with your own connection string. Never commit `.env`.
4. Run `npm install` and `npm run dev` inside `backend/`.
5. Test `GET http://localhost:5000/api/health` in Postman or Thunder Client. Expected JSON: `{"status":"ok","project":"Findly Campus","phase":2}`.

## What is implemented

- Existing frontend preserved without modifications.
- Express app with CORS, JSON parsing, MVC-style route/controller, MongoDB connection, and a health-check API.

## Not implemented yet

- Item/User MongoDB models, authentication/JWT, CRUD APIs, server-side scoring, frontend API integration, image upload, claims, map, or deployment. These are subsequent steps.

## GitHub

Unzip and copy the `frontend/`, `backend/`, `.gitignore`, and README into your **existing** repository. Do not create a new repository. Do not upload `.env` or `node_modules`.
