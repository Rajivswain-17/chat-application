package com.example.realchatapplication.model.Listener;

import java.time.LocalDateTime;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectedEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import com.example.realchatapplication.model.ChatMessage;
import com.example.realchatapplication.model.ChatMessage.MessageType;
import com.example.realchatapplication.model.Repository.ChatMessageRepository;
import com.example.realchatapplication.model.service.UserService;

@Component
public class WebSocketEventListener {

    private static final Logger logger = LoggerFactory.getLogger(WebSocketEventListener.class);

    @Autowired
    private UserService userService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @EventListener
    public void handleWebSocketConnectListener(SessionConnectedEvent event) {
        logger.info("New WebSocket connection established");
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        
        if (username != null) {
            logger.info("User Disconnected: {}", username);
            
            // Set user offline
            userService.setUserOnlineStatus(username, false);
            
            // Create and save leave message
            ChatMessage leaveMessage = new ChatMessage();
            leaveMessage.setType(MessageType.LEAVE);
            leaveMessage.setSender(username);
            leaveMessage.setContent(username + " left the chat");
            leaveMessage.setTimestamp(LocalDateTime.now());
            
            ChatMessage savedMessage = chatMessageRepository.save(leaveMessage);
            
            // Broadcast to all users
            messagingTemplate.convertAndSend("/topic/public", savedMessage);
        }
    }
}