# wishful — Your world, wishlisted

A responsive wishlist and gift-list application inspired by publicly observable ideas behind Moonsift. This is an independent implementation and does not use Moonsift's private APIs or proprietary source code.

## What is implemented

- Responsive Next.js + TypeScript interface with collection navigation, product cards, search, modal forms, feedback states, and mobile layouts.
- Email/password registration and login with BCrypt-compatible password hashing and stateless JWT authentication.
- Create, list, edit, and delete wishlist collections, including private/link/public visibility and gift-list mode.
- Add, edit, and remove product links, prices, currencies, notes, and optional image URLs.
- Shareable wishlist URLs; visitors can view link-accessible/public lists and reserve gift-list items without signing in.
- PostgreSQL persistence.
- REST API implemented in TypeScript with NestJS and the Fastify HTTP adapter.
- GitHub Actions checks for frontend type-check/build and backend test/type-check/build.

## Tech stack

- Frontend: Next.js, React, TypeScript.
- Backend: Node.js 20+, TypeScript, NestJS, Fastify, PostgreSQL (`pg`), bcryptjs and JWT.
- Database: PostgreSQL 16.

## Requirements

Install Node.js 20.9+, npm, and Docker Compose. Java and Maven are no longer required.

## Run locally

1. Start PostgreSQL from the repository root:

       docker compose up -d postgres

2. In a second terminal, configure and start the API:

       cd backend
       cp .env.example .env
       npm install
       npm run start:dev

   API: http://localhost:8080/api  
   Health: http://localhost:8080/api/health

3. In a third terminal, start the frontend:

       cd frontend
       cp .env.example .env.local
       npm install
       npm run dev

   App: http://localhost:3000

The backend creates the required tables and indexes on startup. The local database settings are for development only. Set `DATABASE_URL`, `JWT_SECRET` (at least 32 characters in production), and `FRONTEND_URL` for your environment. Never use sample credentials or a development JWT secret in production. `NEXT_PUBLIC_API_URL` defaults to `http://localhost:8080/api`.

Stop PostgreSQL with `docker compose down`; add `-v` only if you intentionally want to delete its persistent data volume.

## API overview

| Method | Endpoint | Purpose |
| --- | --- | --- |
| POST | /api/auth/register | Create an account and receive a JWT |
| POST | /api/auth/login | Sign in and receive a JWT |
| GET | /api/auth/me | Current account |
| GET/POST | /api/wishlists | List or create collections |
| GET/PUT/DELETE | /api/wishlists/{id} | Read, edit, or delete a collection |
| POST | /api/wishlists/{id}/items | Add a product |
| PUT/DELETE | /api/wishlists/{listId}/items/{itemId} | Edit or remove a product |
| GET | /api/public/wishlists/{shareToken} | View a shareable list |
| POST | /api/public/wishlists/{shareToken}/items/{itemId}/reserve | Reserve a gift |

All owner endpoints require `Authorization: Bearer <token>`. Link-accessible and public lists can be viewed without authentication. Private gift lists can also be opened by their share token so gift-givers can reserve items; ordinary private lists remain private.

## Product metadata boundary

Saving a product link, title, optional price, image URL, and note is supported. The current implementation does not crawl arbitrary retailer pages or provide retailer-specific browser extensions, automatic price-drop monitoring, affiliate integrations, or Moonsift's AI shopping copilot. Users can paste a product URL and provide its details directly.

## Public reference analysis

Public Moonsift pages describe universal product saving, curated collections, shareable wishlists, and gift lists where visitors can mark items bought without necessarily creating an account. This project recreates the core patterns independently.

References:
- https://www.moonsift.com/
- https://www.moonsift.com/wishlist-maker
- https://www.moonsift.com/how-to-save
- https://www.moonsift.com/help/saving-items
