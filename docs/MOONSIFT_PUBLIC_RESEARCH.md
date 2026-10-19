# Public Moonsift UX research

Research date: 19 October 2026

This note records observations from publicly accessible pages only. It does not claim access to authenticated product screens, private APIs, or private implementation details.

## Public information architecture

The public home page positions Moonsift as a universal wishlist and shopping collection product, with routes and entry points for wishlist creation, public collections, gift lists/registries, creator/stylist use cases, and help content. Its public marketing emphasizes saving items from different shops, collecting them in visual boards, and sharing collections.

Source: https://www.moonsift.com/

## Observable user-facing patterns

- **Universal saving:** public help describes saving from a retailer URL, browser toolbar/extension, or mobile share menu. A URL-paste path is an important fallback for stores and devices without an extension.
- **Collections:** users organise saved products into collections and can open products at their original retailer.
- **Sharing:** a collection can be shared with a unique link; recipients can browse and follow product links.
- **Visibility:** public help describes public, private, and hidden collections. The local app models private, link-accessible, and public visibility. Hidden-state semantics are not a separate option in the first implementation.
- **Gift lists:** gift-list mode lets visitors reserve/mark items to reduce duplicate gifts. Public help says visitors can reserve items without creating an account and describes additional gift-list options such as notes and quantities.
- **Visual UX:** product image cards, collection navigation, lightweight forms, share actions, and visitor access are core patterns reproduced in the independent implementation.

Sources:
- https://www.moonsift.com/wishlist-maker
- https://www.moonsift.com/how-to-save
- https://www.moonsift.com/help/saving-items
- https://www.moonsift.com/extension-upgraded

## Implementation mapping

| Public pattern | Local implementation |
| --- | --- |
| Create and organise collections | Authenticated collection CRUD, PostgreSQL persistence |
| Save from any store | Add a product by URL and manually provide title, image URL, price, and note |
| Product cards | Responsive image cards with retailer links, search, and remove/edit actions |
| Share a collection | Copy a share URL using a random share token |
| Public/link/private visibility | API visibility checks for shared access |
| Gift list reservations | Public reservation endpoint; first reservation succeeds and subsequent attempts return conflict |
| Account access | Email/password register/login, BCrypt hashes, stateless JWT |
| Mobile and desktop | Responsive CSS with mobile collection navigation |

## Explicit limitations

- No authenticated Moonsift account was used, so private dashboard details and account-only flows are not claimed as directly observed.
- The implementation does not scrape arbitrary retailer pages. Browser extensions, retailer-specific extraction, automatic price tracking/alerts, affiliate services, and Moonsift's AI shopping copilot are not implemented.
- A separate hidden visibility state, gift quantities, comments/messages, cash funds, delivery details, and account profile management are not included in this first implementation.
- Product images can be provided as an image URL; no image upload/storage service is configured.

The app is an independent implementation of the observable interaction patterns, not a copy of Moonsift's code, assets, branding, or private APIs.
