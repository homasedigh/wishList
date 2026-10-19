package com.wishful.repository;

import com.wishful.model.Wishlist;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WishlistRepository extends JpaRepository<Wishlist, Long> {
    List<Wishlist> findAllByOwnerEmailOrderByCreatedAtDesc(String email);
    Optional<Wishlist> findByIdAndOwnerEmail(Long id, String email);
    Optional<Wishlist> findByShareToken(String shareToken);
}
