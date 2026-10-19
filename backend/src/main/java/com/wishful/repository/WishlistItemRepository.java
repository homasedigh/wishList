package com.wishful.repository;

import com.wishful.model.WishlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface WishlistItemRepository extends JpaRepository<WishlistItem, Long> {
    Optional<WishlistItem> findByIdAndWishlistId(Long id, Long wishlistId);
}
