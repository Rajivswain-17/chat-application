package com.example.realchatapplication.model.controller;

import java.time.LocalDateTime;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import com.example.realchatapplication.model.ChatMessage;
import com.example.realchatapplication.model.ChatMessage.MessageType;
import com.example.realchatapplication.model.Repository.ChatMessageRepository;
import com.example.realchatapplication.model.service.UserService;

@Controller
public class ChatController {

    @Autowired
    private UserService userService;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/public")
    public ChatMessage addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String username = chatMessage.getSender();
        
        if (userService.userExists(username)) {
            // Store username in WebSocket session
            headerAccessor.getSessionAttributes().put("username", username);
            
            // Set user online
            userService.setUserOnlineStatus(username, true);
            
            System.out.println("User added: " + username + " with session ID: " + headerAccessor.getSessionId());
            
            // Set timestamp and save
            chatMessage.setTimestamp(LocalDateTime.now());
            if (chatMessage.getContent() == null || chatMessage.getContent().isEmpty()) {
                chatMessage.setContent(username + " joined the chat");
            }
            
            return chatMessageRepository.save(chatMessage);
        }
        
        return null;
    }

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/public")
    public ChatMessage sendMessage(@Payload ChatMessage chatMessage) {
        if (chatMessage.getType() == MessageType.TYPING) {
            // Don't save typing indicators to database
            return chatMessage;
        }
        
        if (userService.userExists(chatMessage.getSender())) {
            if (chatMessage.getTimestamp() == null) {
                chatMessage.setTimestamp(LocalDateTime.now());
            }
            
            if (chatMessage.getContent() == null) {
                chatMessage.setContent("");
            }
            
            return chatMessageRepository.save(chatMessage);
        }
        
        return null;
    }

    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage) {
        String sender = chatMessage.getSender();
        String recipient = chatMessage.getRecipient();
        
        if (userService.userExists(sender) && userService.userExists(recipient)) {
            if (chatMessage.getTimestamp() == null) {
                chatMessage.setTimestamp(LocalDateTime.now());
            }
            
            if (chatMessage.getContent() == null) {
                chatMessage.setContent("");
            }
            
            chatMessage.setType(MessageType.PRIVATE_MESSAGE);
            
            // Save message to database
            ChatMessage savedMessage = chatMessageRepository.save(chatMessage);
            System.out.println("Private message saved with ID: " + savedMessage.getId());
            
            try {
                // Send to recipient
                String recipientDestination = "/user/" + recipient + "/queue/private";
                messagingTemplate.convertAndSend(recipientDestination, savedMessage);
                System.out.println("Message sent to recipient: " + recipient);
                
                // Send to sender (for message confirmation)
                String senderDestination = "/user/" + sender + "/queue/private";
                messagingTemplate.convertAndSend(senderDestination, savedMessage);
                System.out.println("Message sent to sender: " + sender);
                
            } catch (Exception e) {
                System.err.println("Error sending private message: " + e.getMessage());
                e.printStackTrace();
            }
        } else {
            System.err.println("Sender or recipient does not exist: " + sender + " / " + recipient);
        }
    }
}