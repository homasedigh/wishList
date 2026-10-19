# wishful — Your world, wishlisted

A responsive, full-stack wishlist and gift-list application inspired by publicly observable ideas behind Moonsift: save products from different shops in one place, organise them into collections, and share lists for gift-giving. This is an independent implementation and does not use Moonsift's private APIs or proprietary source code.

## What is implemented

- Responsive Next.js + TypeScript interface with collection navigation, product cards, search, modal forms, feedback states, and mobile layouts.
- Email/password registration and login with BCrypt password hashing and stateless JWT authentication.
- Create, list, edit, and delete wishlist collections, including private/link/public visibility and gift-list mode.
- Add, edit, and remove product links, prices, currencies, notes, and optional image URLs.
- Shareable wishlist URLs; visitors can view link-accessible/public lists and reserve gift-list items without signing in.
- PostgreSQL persistence managed by Flyway migrations.
- REST API documentation through Springdoc/Swagger UI.
- GitHub Actions workflow for frontend type-check/build and backend unit tests/package.

## Tech stack

- Frontend: Next.js 14, React 18, TypeScript.
- Backend: Java 17, Spring Boot 3, Spring Security, Spring Data JPA, JWT.
- Database: PostgreSQL 16.
- Schema migrations: Flyway.

## Requirements

Install Node.js 20+, npm, Java 17+, and Maven 3.9+. Docker Compose is recommended for PostgreSQL.

## Run locally

1. Start PostgreSQL from the repository root:

       docker compose up -d postgres

2. Start the API in a second terminal:

       cd backend
       mvn spring-boot:run

   API: http://localhost:8080/api  
   Swagger UI: http://localhost:8080/swagger-ui/index.html

3. Start the frontend in a third terminal:

       cd frontend
       cp .env.example .env.local
       npm install
       npm run dev

   App: http://localhost:3000

Default local database configuration is for development only. Set DATABASE_URL, DATABASE_USERNAME, DATABASE_PASSWORD, JWT_SECRET (at least 32 bytes), and FRONTEND_URL in the environment for your setup. Never use the sample database password or JWT secret in a deployed environment. NEXT_PUBLIC_API_URL defaults to http://localhost:8080/api.

Stop the database with docker compose down; add -v only if you intentionally want to delete its persistent data volume.

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

All owner endpoints require Authorization: Bearer <token>. Link-accessible and public lists can be viewed without authentication. Private gift lists can also be opened by their share token so gift-givers can reserve items; ordinary private lists remain private.

## Product metadata boundary

Saving a product link, title, optional price, image URL, and note is supported. The current implementation does not crawl arbitrary retailer pages or provide retailer-specific browser extensions, automatic price-drop monitoring, affiliate integrations, or Moonsift's AI shopping copilot. Those services require retailer integrations and infrastructure that are outside this local implementation. Users can paste a product URL and provide its details directly.

## Public reference analysis

Public Moonsift pages describe universal product saving, curated collections, shareable wishlists, and gift lists where visitors can mark items bought without necessarily creating an account. Public help pages also document private/public/hidden collection visibility and adding products by pasting links or using browser/mobile sharing. This project recreates the core patterns independently; authenticated-only Moonsift flows were not represented as directly inspected.

References:
- https://www.moonsift.com/
- https://www.moonsift.com/wishlist-maker
- https://www.moonsift.com/how-to-save
- https://www.moonsift.com/help/saving-items

## Verification

Run the same checks used in CI:

    cd frontend
    npm install
    npm run lint
    npm run build
    cd ../backend
    mvn test
    mvn package

The GitHub Actions workflow runs these checks on pushes and pull requests. A green workflow is the remote verification source; a commit alone is not proof that the application has been run locally.
