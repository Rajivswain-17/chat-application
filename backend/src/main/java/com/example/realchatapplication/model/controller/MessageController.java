package com.example.realchatapplication.model.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.realchatapplication.model.ChatMessage;
import com.example.realchatapplication.model.Repository.ChatMessageRepository;

@RestController
@RequestMapping("/api/message")
public class MessageController {

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @GetMapping("/private")
    public ResponseEntity<List<ChatMessage>> getPrivateMessage(
            @RequestParam String user1,
            @RequestParam String user2) {

        List<ChatMessage> messages =
                chatMessageRepository.findPrivateMessageBetweenTwoUsers(user1, user2);

        return ResponseEntity.ok(messages);
    }
}
