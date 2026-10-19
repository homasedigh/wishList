package com.wishful.security;

import com.wishful.model.AppUser;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {
    @Test void issuesTokenThatCanBeParsedBackToEmail() {
        JwtService service = new JwtService("test-only-secret-key-that-is-at-least-32-bytes-long", 60);
        AppUser user = new AppUser(); user.setEmail("reader@example.com");
        String token = service.issue(user);
        assertEquals("reader@example.com", service.subject(token));
    }
    @Test void rejectsShortSigningSecret() {
        assertThrows(IllegalArgumentException.class, () -> new JwtService("too-short", 60));
    }
}
