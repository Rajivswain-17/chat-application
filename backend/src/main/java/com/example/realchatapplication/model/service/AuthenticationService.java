package com.example.realchatapplication.model.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.realchatapplication.model.User;
import com.example.realchatapplication.model.Repository.UserRepository;
import com.example.realchatapplication.model.dto.LoginRequestDTO;
import com.example.realchatapplication.model.dto.LoginResponseDTO;
import com.example.realchatapplication.model.dto.RegisterRequestDTO;
import com.example.realchatapplication.model.dto.UserDTO;
import com.example.realchatapplication.model.jwt.JwtService;

@Service
public class AuthenticationService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private JwtService jwtService;

    public UserDTO signup(RegisterRequestDTO registerRequestDTO) {

        if (userRepository.findByUsername(registerRequestDTO.getUsername()).isPresent()) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();
        user.setUsername(registerRequestDTO.getUsername());
        user.setEmail(registerRequestDTO.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequestDTO.getPassword()));
        user.setOnline(false);

        User savedUser = userRepository.save(user);

        return convertToUserDTO(savedUser);
    }

    public LoginResponseDTO login(LoginRequestDTO loginRequestDTO) {

        User user = userRepository.findByUsername(loginRequestDTO.getUsername())
                .orElseThrow(() -> new RuntimeException("Username not found"));

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequestDTO.getUsername(),
                        loginRequestDTO.getPassword()
                )
        );

        String jwtToken = jwtService.generateToken(user);

        return LoginResponseDTO.builder()
                .token(jwtToken)
                .userDTO(convertToUserDTO(user))
                .build();
    }

    public ResponseEntity<String> logout() {

        ResponseCookie responseCookie = ResponseCookie.from("JWT", "")
                .httpOnly(true)
                .secure(false)
                .path("/")
                .maxAge(0)
                .sameSite("Lax")
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, responseCookie.toString())
                .body("logged out successfully");
    }

    public Map<String, Object> getOnlineUsers() {

        List<User> usersList = userRepository.findByIsOnlineTrue();

        Map<String, Object> onlineUsers = usersList.stream()
                .collect(Collectors.toMap(
                        User::getUsername,
                        User::getUsername
                ));
        return onlineUsers;
    }

    public UserDTO convertToUserDTO(User user) {

        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setEmail(user.getEmail());
        userDTO.setUsername(user.getUsername());
        userDTO.setOnline(user.isOnline());

        return userDTO;
    }
}