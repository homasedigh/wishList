# Moonsift-Inspired Wishlist Application — Project Task

This document is the canonical task specification for rebuilding a wishlist application inspired by the publicly observable functionality and user experience of [Moonsift](https://www.moonsift.com/).

## Objective

Analyze the publicly accessible parts of Moonsift and independently rebuild its core functionality and user experience using TypeScript, React, Next.js, Java, Spring Boot, and PostgreSQL. This is a functional full-stack implementation task, not merely a static visual mockup.

Do not copy proprietary source code, private APIs, credentials, or other non-public implementation details. Where functionality depends on unavailable private infrastructure or APIs, implement a reasonable working local equivalent behind a clean abstraction and document the limitation.

## 1. Analyze Moonsift

Thoroughly inspect and analyze publicly accessible pages and behavior at https://www.moonsift.com/, including:

- Overall website structure and information architecture
- Public pages, routes, navigation, and page hierarchy
- User flows and interactions
- Registration and login flows
- Wishlist creation and management
- Product search and product importing
- Product cards and product details
- Adding, removing, and editing wishlist items
- Wishlist sharing
- Gift reservation functionality
- User profile and account functionality
- Responsive behavior and mobile/desktop layouts
- UI/UX patterns
- Forms and validation
- Buttons, menus, modals, dialogs, and interactive components
- Loading, empty, success, and error states
- Authentication-related flows
- URL structure and routing
- Product metadata and image handling
- Publicly observable integrations and third-party services
- Accessibility considerations
- SEO behavior where applicable

Base conclusions on observable evidence. Do not claim to have inspected flows that are inaccessible without an account or unavailable to public browsing.

## 2. Rebuild the Application

### Frontend

- TypeScript
- React
- Next.js
- Modern responsive CSS
- Component-based architecture
- Appropriate client/server separation

### Backend

- Java
- Spring Boot
- RESTful APIs
- Spring Data JPA
- PostgreSQL
- Spring Security
- JWT-based authentication where appropriate

### Supporting technologies

Use suitable, proportionate tools for:

- Database migrations
- Validation
- Error handling
- API documentation
- Testing
- Caching where needed
- File and image handling where needed
- Environment-based configuration

Keep the architecture clean and maintainable. Avoid unnecessary technologies.

## 3. Reproduce the Core UX

Reproduce the core user experience and interaction patterns as closely as practical while implementing the application independently.

Do not leave major functionality as fake buttons or static placeholders. If an external service is unavailable, provide a working mock or local equivalent and document the boundary clearly.

## 4. Application Structure

Use a maintainable full-stack layout. The following is illustrative; adjust it when the repository or architecture warrants it.

```text
wishList/
├── frontend/
│   ├── src/
│   ├── components/
│   ├── app/
│   ├── services/
│   └── ...
├── backend/
│   └── src/
│       └── main/
│           └── java/
│               ├── controller/
│               ├── service/
│               ├── repository/
│               ├── entity/
│               └── security/
├── docker/
├── docs/
└── README.md
```

## 5. Local Development

Configure the application to run locally after dependencies and required services are installed.

- Provide a default local URL, preferably http://localhost:3000 for the frontend.
- Ensure the frontend communicates with the backend correctly.
- Include a `docker-compose.yml` for PostgreSQL and any other necessary infrastructure when useful.
- Document environment variables, setup, startup, and shutdown commands.
- Do not commit secrets or credentials.

## 6. Runtime Verification

Run the application locally and verify it rather than relying on code inspection alone.

At minimum verify:

- Application starts successfully
- Frontend loads at the documented URL
- Backend starts successfully
- API requests work
- Database connection and persistence work
- Main navigation works
- Main user flows work
- No blocking console or runtime errors exist

If the current environment prevents a check, state exactly what could not be run and why. Never claim unperformed verification.

## 7. Code Quality and Security

- Strong TypeScript typing
- Clean Java/Spring Boot architecture
- Meaningful naming
- Reusable components
- Separation of concerns
- Proper error handling
- Input validation
- Secure authentication and authorization
- No hardcoded secrets
- Environment variables for configuration
- Minimal duplication
- Reasonable test coverage
- Clear README documentation

## 8. Git Repository and Workflow

Repository: https://github.com/homasedigh/wishList  
Required branch: `first`

Before making implementation changes:

1. Inspect the existing repository and branch.
2. Understand the current architecture and existing work.
3. Preserve useful existing work unless it conflicts with the task.

After implementation:

1. Check Git status.
2. Review all changes.
3. Remove unnecessary files, generated artifacts, secrets, and temporary files.
4. Build the project successfully.
5. Run available tests.
6. Fix build, test, and runtime issues.
7. Commit all relevant changes on the local `first` branch.
8. Push `first` to `homasedigh/wishList`.

Suggested commit message:

`feat: rebuild wishlist application inspired by Moonsift`

Do not overwrite unrelated work or force-push without a clear, justified need. Report the actual commit hash and push result.

## 9. Final Verification Checklist

Before declaring the task complete, verify and report whether:

- [ ] The implementation exists in the repository.
- [ ] The application starts locally.
- [ ] The documented default URL works.
- [ ] Frontend and backend communicate.
- [ ] Database connectivity and persistence work.
- [ ] Main wishlist flows work.
- [ ] Build and available tests pass.
- [ ] Changes are committed on local branch `first`.
- [ ] The commit exists on the remote `first` branch.

## 10. Final Report

Provide a concise, evidence-based summary containing:

- What parts of Moonsift were analyzed
- What was implemented
- Frontend technology
- Backend technology
- Database technology
- Default local URL
- Git branch used
- Commit hash and message
- Push status
- Tests and build commands run, with results
- Known limitations and functionality that could not be reproduced

Do not stop after analyzing the website. Implement, run, verify, commit, and push the working application to the extent the available environment permits, and clearly report any constraints.

---

## Standing project instruction

Treat this document as the canonical specification whenever working on this wishlist rebuild in this repository. Inspect the current repository state before each new set of changes, preserve unrelated work, perform the requested work directly where tools permit, verify claims against actual results, and report limitations transparently.
