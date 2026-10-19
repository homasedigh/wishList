package com.wishful.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "wishlist_item")
@Getter @Setter @NoArgsConstructor
public class WishlistItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "wishlist_id", nullable = false) private Wishlist wishlist;
    @Column(nullable = false, length = 180) private String title;
    @Column(name = "product_url", nullable = false, length = 2048) private String productUrl;
    @Column(name = "image_url", length = 2048) private String imageUrl;
    @Column(precision = 12, scale = 2) private BigDecimal price;
    @Column(nullable = false, length = 3) private String currency = "GBP";
    @Column(length = 1000) private String note;
    @Column(nullable = false) private boolean reserved;
    @Column(name = "reserved_at") private Instant reservedAt;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @PrePersist void onCreate() { if (createdAt == null) createdAt = Instant.now(); }
}
