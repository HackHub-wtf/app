package wtf.hackhub.presentation.auth;

import wtf.hackhub.domain.Profile;

import java.util.UUID;

public record AuthResponse(String accessToken, UserDto user) {

	public static AuthResponse from(String accessToken, Profile profile) {
		return new AuthResponse(accessToken, UserDto.from(profile));
	}

	public record UserDto(UUID id, String email, String name, String role, String avatarUrl) {
		public static UserDto from(Profile p) {
			return new UserDto(p.getId(), p.getEmail(), p.getName(), p.getRole().toDbValue(), p.getAvatarUrl());
		}
	}
}
