package com.wishful.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "wishlist")
@Getter @Setter @NoArgsConstructor
public class Wishlist {
    public enum Visibility { PRIVATE, LINK, PUBLIC }
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "owner_id", nullable = false) private AppUser owner;
    @Column(nullable = false, length = 100) private String title;
    @Column(length = 500) private String description;
    @Column(name = "share_token", nullable = false, unique = true, length = 64) private String shareToken;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16) private Visibility visibility = Visibility.PRIVATE;
    @Column(name = "gift_list", nullable = false) private boolean giftList;
    @Column(name = "created_at", nullable = false, updatable = false) private Instant createdAt;
    @Column(name = "updated_at", nullable = false) private Instant updatedAt;
    @OneToMany(mappedBy = "wishlist", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("createdAt DESC") private List<WishlistItem> items = new ArrayList<>();
    @PrePersist void onCreate() { Instant now = Instant.now(); createdAt = now; updatedAt = now; }
    @PreUpdate void onUpdate() { updatedAt = Instant.now(); }
}
