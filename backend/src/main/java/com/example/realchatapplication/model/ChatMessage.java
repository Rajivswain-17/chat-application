package com.example.realchatapplication.model;


import java.time.LocalDateTime;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Data
@Entity
@Table(name = "chat_messages")
public class ChatMessage {

	@Id
	@GeneratedValue(strategy =  GenerationType.IDENTITY)
	
	private Long id;
	
	private String content;
	
	private String sender;
	
	 private String recipient;
	
	private String color;
	
	
	 @Column(nullable = false)
	    private LocalDateTime timestamp;
	
	@Enumerated(EnumType.STRING)
	private MessageType type;
	
	
	public enum MessageType {
		CHAT, PRIVATE_MESSAGE, JOIN, LEAVE, TYPING
	}
	
	
}
