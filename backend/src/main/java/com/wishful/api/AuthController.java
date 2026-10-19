package com.wishful.api;

import com.wishful.model.AppUser;
import com.wishful.repository.UserRepository;
import com.wishful.security.JwtService;
import com.wishful.api.ApiDtos.*;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserRepository users;
    private final PasswordEncoder passwords;
    private final JwtService jwt;
    public AuthController(UserRepository users, PasswordEncoder passwords, JwtService jwt) { this.users = users; this.passwords = passwords; this.jwt = jwt; }

    @PostMapping("/register")
    @Transactional
    public AuthResponse register(@Valid @RequestBody RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (users.existsByEmailIgnoreCase(email)) throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists.");
        AppUser user = new AppUser(); user.setName(request.name().trim()); user.setEmail(email); user.setPasswordHash(passwords.encode(request.password()));
        user = users.save(user);
        return new AuthResponse(jwt.issue(user), UserResponse.from(user));
    }

    @PostMapping("/login")
    @Transactional(readOnly = true)
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        AppUser user = users.findByEmailIgnoreCase(request.email().trim())
            .filter(found -> passwords.matches(request.password(), found.getPasswordHash()))
            .orElseThrow(() -> new BadCredentialsException("Email or password is incorrect."));
        return new AuthResponse(jwt.issue(user), UserResponse.from(user));
    }

    @GetMapping("/me")
    public UserResponse me(@org.springframework.security.core.annotation.AuthenticationPrincipal AppUser user) {
        return UserResponse.from(user);
    }
}
