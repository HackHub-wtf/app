package wtf.hackhub.presentation.admin;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import wtf.hackhub.domain.Profile;

import java.util.UUID;

public record AdminCreateUserRequest(@NotBlank @Email String email, @NotBlank @Size(min = 2, max = 100) String name,
		@NotBlank @Size(min = 8, max = 100) String password, Profile.Role role, UUID organizationId) {
}
