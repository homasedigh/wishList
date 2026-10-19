package com.wishful.api;

import com.wishful.api.ApiDtos.*;
import com.wishful.model.AppUser;
import com.wishful.model.Wishlist;
import com.wishful.model.WishlistItem;
import com.wishful.repository.WishlistItemRepository;
import com.wishful.repository.WishlistRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.net.URI;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class WishlistController {
    private final WishlistRepository wishlists;
    private final WishlistItemRepository items;
    public WishlistController(WishlistRepository wishlists, WishlistItemRepository items) { this.wishlists = wishlists; this.items = items; }

    @GetMapping("/wishlists")
    @Transactional(readOnly = true)
    public List<WishlistResponse> list(@AuthenticationPrincipal AppUser user) {
        return wishlists.findAllByOwnerEmailOrderByCreatedAtDesc(user.getEmail()).stream().map(WishlistResponse::from).toList();
    }

    @PostMapping("/wishlists")
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public WishlistResponse create(@AuthenticationPrincipal AppUser user, @Valid @RequestBody CreateWishlistRequest request) {
        Wishlist list = new Wishlist(); list.setOwner(user); list.setTitle(request.title().trim()); list.setDescription(clean(request.description()));
        list.setGiftList(request.giftList()); list.setVisibility(request.visibility() == null ? Wishlist.Visibility.PRIVATE : request.visibility());
        list.setShareToken(UUID.randomUUID().toString().replace("-", ""));
        return WishlistResponse.from(wishlists.save(list));
    }

    @GetMapping("/wishlists/{id}")
    @Transactional(readOnly = true)
    public WishlistResponse get(@AuthenticationPrincipal AppUser user, @PathVariable Long id) {
        return WishlistResponse.from(owned(id, user));
    }

    @PutMapping("/wishlists/{id}")
    @Transactional
    public WishlistResponse update(@AuthenticationPrincipal AppUser user, @PathVariable Long id, @Valid @RequestBody UpdateWishlistRequest request) {
        Wishlist list = owned(id, user); list.setTitle(request.title().trim()); list.setDescription(clean(request.description()));
        list.setGiftList(request.giftList()); list.setVisibility(request.visibility() == null ? Wishlist.Visibility.PRIVATE : request.visibility());
        return WishlistResponse.from(list);
    }

    @DeleteMapping("/wishlists/{id}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUser user, @PathVariable Long id) { wishlists.delete(owned(id, user)); }

    @PostMapping("/wishlists/{id}/items")
    @Transactional
    @ResponseStatus(HttpStatus.CREATED)
    public ItemResponse addItem(@AuthenticationPrincipal AppUser user, @PathVariable Long id, @Valid @RequestBody CreateItemRequest request) {
        Wishlist list = owned(id, user);
        validateUrl(request.url());
        if (request.imageUrl() != null && !request.imageUrl().isBlank()) validateUrl(request.imageUrl());
        WishlistItem item = new WishlistItem(); item.setWishlist(list); item.setTitle(request.title().trim()); item.setProductUrl(request.url().trim());
        item.setImageUrl(clean(request.imageUrl())); item.setPrice(request.price()); item.setCurrency(request.currency() == null ? "GBP" : request.currency().toUpperCase(Locale.ROOT));
        item.setNote(clean(request.note())); list.getItems().add(item);
        return ItemResponse.from(item);
    }

    @PutMapping("/wishlists/{listId}/items/{itemId}")
    @Transactional
    public ItemResponse updateItem(@AuthenticationPrincipal AppUser user, @PathVariable Long listId, @PathVariable Long itemId, @Valid @RequestBody CreateItemRequest request) {
        Wishlist list = owned(listId, user);
        WishlistItem item = items.findByIdAndWishlistId(itemId, list.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wishlist item not found."));
        validateUrl(request.url());
        if (request.imageUrl() != null && !request.imageUrl().isBlank()) validateUrl(request.imageUrl());
        item.setTitle(request.title().trim()); item.setProductUrl(request.url().trim()); item.setImageUrl(clean(request.imageUrl()));
        item.setPrice(request.price()); item.setCurrency(request.currency() == null ? "GBP" : request.currency().toUpperCase(Locale.ROOT)); item.setNote(clean(request.note()));
        return ItemResponse.from(item);
    }

    @DeleteMapping("/wishlists/{listId}/items/{itemId}")
    @Transactional
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteItem(@AuthenticationPrincipal AppUser user, @PathVariable Long listId, @PathVariable Long itemId) {
        owned(listId, user);
        WishlistItem item = items.findByIdAndWishlistId(itemId, listId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wishlist item not found."));
        items.delete(item);
    }

    @GetMapping("/public/wishlists/{shareToken}")
    @Transactional(readOnly = true)
    public WishlistResponse shared(@PathVariable String shareToken) { return WishlistResponse.from(sharedList(shareToken)); }

    @PostMapping("/public/wishlists/{shareToken}/items/{itemId}/reserve")
    @Transactional
    public ItemResponse reserve(@PathVariable String shareToken, @PathVariable Long itemId) {
        Wishlist list = sharedList(shareToken);
        if (!list.isGiftList()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only gift lists support reservations.");
        WishlistItem item = items.findByIdAndWishlistId(itemId, list.getId()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wishlist item not found."));
        if (item.isReserved()) throw new ResponseStatusException(HttpStatus.CONFLICT, "This gift has already been reserved.");
        item.setReserved(true); item.setReservedAt(Instant.now());
        return ItemResponse.from(item);
    }

    private Wishlist owned(Long id, AppUser user) {
        return wishlists.findByIdAndOwnerEmail(id, user.getEmail()).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Wishlist not found."));
    }
    private Wishlist sharedList(String token) {
        Wishlist list = wishlists.findByShareToken(token).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Shared wishlist not found."));
        if (list.getVisibility() == Wishlist.Visibility.PRIVATE && !list.isGiftList()) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "This wishlist is private.");
        return list;
    }
    private static String clean(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static void validateUrl(String value) {
        try {
            URI uri = URI.create(value.trim());
            if (!("http".equalsIgnoreCase(uri.getScheme()) || "https".equalsIgnoreCase(uri.getScheme())) || uri.getHost() == null)
                throw new IllegalArgumentException();
        } catch (RuntimeException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Product links must be valid http or https URLs.");
        }
    }
}
