package com.example.realchatapplication.model.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.example.realchatapplication.model.Repository.UserRepository;

@Service
public class UserService {

	
	@Autowired
	private UserRepository userRepository;
	
	
	public boolean userExists(String username) {
		return userRepository.existsByUsername(username);
	}
	
	public void setUserOnlineStatus(String username, boolean isOnline) {
		userRepository.updateUserOnlineStatus(username, isOnline);
	}
}
