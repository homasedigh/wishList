package com.wishful.api;

import com.wishful.model.AppUser;
import com.wishful.model.Wishlist;
import com.wishful.model.WishlistItem;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public final class ApiDtos {
    private ApiDtos() {}
    public record RegisterRequest(@NotBlank @Size(min=2,max=100) String name, @NotBlank @Email @Size(max=254) String email, @NotBlank @Size(min=8,max=72) String password) {}
    public record LoginRequest(@NotBlank @Email String email, @NotBlank String password) {}
    public record UserResponse(Long id, String name, String email) {
        public static UserResponse from(AppUser user) { return new UserResponse(user.getId(), user.getName(), user.getEmail()); }
    }
    public record AuthResponse(String token, UserResponse user) {}
    public record CreateWishlistRequest(@NotBlank @Size(max=100) String title, @Size(max=500) String description, boolean giftList, Wishlist.Visibility visibility) {}
    public record UpdateWishlistRequest(@NotBlank @Size(max=100) String title, @Size(max=500) String description, boolean giftList, Wishlist.Visibility visibility) {}
    public record CreateItemRequest(@NotBlank @Size(max=180) String title, @NotBlank @Size(max=2048) String url, @Size(max=2048) String imageUrl, @DecimalMin("0.00") @Digits(integer=10,fraction=2) BigDecimal price, @Pattern(regexp="[A-Za-z]{3}") String currency, @Size(max=1000) String note) {}
    public record ItemResponse(Long id, String title, String productUrl, String imageUrl, BigDecimal price, String currency, String note, boolean reserved, Instant createdAt) {
        public static ItemResponse from(WishlistItem i) { return new ItemResponse(i.getId(), i.getTitle(), i.getProductUrl(), i.getImageUrl(), i.getPrice(), i.getCurrency(), i.getNote(), i.isReserved(), i.getCreatedAt()); }
    }
    public record WishlistResponse(Long id, String title, String description, String shareToken, Wishlist.Visibility visibility, boolean giftList, List<ItemResponse> items, Instant createdAt) {
        public static WishlistResponse from(Wishlist w) { return new WishlistResponse(w.getId(), w.getTitle(), w.getDescription(), w.getShareToken(), w.getVisibility(), w.isGiftList(), w.getItems().stream().map(ItemResponse::from).toList(), w.getCreatedAt()); }
    }
}
