package com.example.realchatapplication.model.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.realchatapplication.model.User;
import com.example.realchatapplication.model.Repository.UserRepository;
import com.example.realchatapplication.model.dto.LoginRequestDTO;
import com.example.realchatapplication.model.dto.LoginResponseDTO;
import com.example.realchatapplication.model.dto.RegisterRequestDTO;
import com.example.realchatapplication.model.dto.UserDTO;
import com.example.realchatapplication.model.service.AuthenticationService;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private AuthenticationService authenticationService;
    
    @Autowired
    private UserRepository userRepository;
    
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody RegisterRequestDTO registerRequestDTO) {
        try {
            UserDTO userDTO = authenticationService.signup(registerRequestDTO);
            return ResponseEntity.ok(userDTO);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Signup failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO loginRequestDTO) {
        try {
            LoginResponseDTO loginResponseDTO = authenticationService.login(loginRequestDTO);
            
            // Create HTTP-only cookie for JWT
            ResponseCookie jwtCookie = ResponseCookie.from("jwt", loginResponseDTO.getToken())
                    .httpOnly(true)
                    .secure(false)  // Set to true in production with HTTPS
                    .path("/")
                    .maxAge(60 * 60) // 1 hour
                    .sameSite("Lax")
                    .build();
            
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                    .body(loginResponseDTO.getUserDTO());
                    
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Login failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie jwtCookie = ResponseCookie.from("jwt", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();
        
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, jwtCookie.toString())
                .body(Map.of("message", "Logged out successfully"));
    }
    
    @GetMapping("/getonlineusers")
    public ResponseEntity<?> getOnlineUsers() {
        try {
            List<User> onlineUsers = userRepository.findByIsOnlineTrue();
            
            List<Map<String, Object>> userList = onlineUsers.stream()
                    .map(user -> {
                        Map<String, Object> userMap = new HashMap<>();
                        userMap.put("username", user.getUsername());
                        userMap.put("id", user.getId());
                        userMap.put("email", user.getEmail());
                        return userMap;
                    })
                    .collect(Collectors.toList());
            
            return ResponseEntity.ok(Map.of(
                    "users", userList,
                    "count", userList.size()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to fetch online users"));
        }
    }
    
    @GetMapping("/getcurrentuser")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        if (authentication == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authorized"));
        }
        
        try {
            String username = authentication.getName();
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new RuntimeException("User not found"));
            
            return ResponseEntity.ok(convertToUserDTO(user));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "User not found"));
        }
    }
    
    private UserDTO convertToUserDTO(User user) {
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setEmail(user.getEmail());
        userDTO.setUsername(user.getUsername());
        userDTO.setOnline(user.isOnline());
        return userDTO;
    }
}