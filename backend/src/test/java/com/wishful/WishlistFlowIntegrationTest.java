package com.wishful;

import com.fasterxml.jackson.databind.JsonNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.*;
import java.util.Map;
import java.util.UUID;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class WishlistFlowIntegrationTest {
    @Autowired TestRestTemplate http;

    @Test void accountCanCreateShareAndReserveGiftList() {
        String email = "test-" + UUID.randomUUID() + "@example.com";
        ResponseEntity<JsonNode> registration = http.postForEntity("/api/auth/register",
            Map.of("name", "Integration Tester", "email", email, "password", "a-strong-test-password"), JsonNode.class);
        assertEquals(HttpStatus.OK, registration.getStatusCode());
        String token = registration.getBody().path("token").asText();
        assertFalse(token.isBlank());

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<JsonNode> created = http.exchange("/api/wishlists", HttpMethod.POST,
            new HttpEntity<>(Map.of("title", "Birthday ideas", "description", "A test collection", "giftList", true, "visibility", "LINK"), headers),
            JsonNode.class);
        assertEquals(HttpStatus.CREATED, created.getStatusCode());
        long listId = created.getBody().path("id").asLong();
        String shareToken = created.getBody().path("shareToken").asText();
        assertTrue(listId > 0);
        assertFalse(shareToken.isBlank());

        ResponseEntity<JsonNode> item = http.exchange("/api/wishlists/" + listId + "/items", HttpMethod.POST,
            new HttpEntity<>(Map.of("title", "A lovely mug", "url", "https://shop.example/mug", "price", 18.50, "currency", "GBP", "note", "Blue, please"), headers),
            JsonNode.class);
        assertEquals(HttpStatus.CREATED, item.getStatusCode());
        long itemId = item.getBody().path("id").asLong();
        assertTrue(itemId > 0);

        ResponseEntity<JsonNode> shared = http.getForEntity("/api/public/wishlists/" + shareToken, JsonNode.class);
        assertEquals(HttpStatus.OK, shared.getStatusCode());
        assertEquals("A lovely mug", shared.getBody().path("items").get(0).path("title").asText());

        ResponseEntity<JsonNode> reserved = http.postForEntity("/api/public/wishlists/" + shareToken + "/items/" + itemId + "/reserve", null, JsonNode.class);
        assertEquals(HttpStatus.OK, reserved.getStatusCode());
        assertTrue(reserved.getBody().path("reserved").asBoolean());

        ResponseEntity<JsonNode> duplicate = http.postForEntity("/api/public/wishlists/" + shareToken + "/items/" + itemId + "/reserve", null, JsonNode.class);
        assertEquals(HttpStatus.CONFLICT, duplicate.getStatusCode());
    }
}
