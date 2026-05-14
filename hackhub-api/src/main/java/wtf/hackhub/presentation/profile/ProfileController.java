package wtf.hackhub.presentation.profile;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.profile.UpdateProfileUseCase;
import wtf.hackhub.domain.Profile;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Tag(name = "Profiles", description = "User profile retrieval and updates")
@RestController
@RequestMapping("/api/v1/profiles")
public class ProfileController {

	private final UpdateProfileUseCase updateProfileUseCase;

	public ProfileController(UpdateProfileUseCase updateProfileUseCase) {
		this.updateProfileUseCase = updateProfileUseCase;
	}

	@Operation(summary = "Get the authenticated user's profile")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@GetMapping("/me")
	public ProfileResponse getMe(@AuthenticationPrincipal UUID userId) {
		return ProfileResponse.from(updateProfileUseCase.getById(userId));
	}

	@Operation(summary = "Get a user profile by ID")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Success"),
			@ApiResponse(responseCode = "401", description = "Not authenticated"),
			@ApiResponse(responseCode = "404", description = "Profile not found")})
	@GetMapping("/{id}")
	public ProfileResponse getById(@PathVariable UUID id) {
		return ProfileResponse.from(updateProfileUseCase.getById(id));
	}

	@Operation(summary = "Update the authenticated user's profile")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Updated"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@PatchMapping("/me")
	public ProfileResponse updateMe(@AuthenticationPrincipal UUID userId,
			@Valid @RequestBody UpdateProfileRequest request) {
		Profile updated = updateProfileUseCase.update(userId, request.name(), request.avatarUrl(), request.skills());
		return ProfileResponse.from(updated);
	}

	// ── DTOs ──────────────────────────────────────────────────────────────────

	public record ProfileResponse(UUID id, String email, String name, String role, String avatarUrl,
			List<String> skills, UUID organizationId, Instant createdAt, Instant updatedAt) {
		static ProfileResponse from(Profile p) {
			return new ProfileResponse(p.getId(), p.getEmail(), p.getName(), p.getRole().toDbValue(), p.getAvatarUrl(),
					p.getSkills(), p.getOrganizationId(), p.getCreatedAt(), p.getUpdatedAt());
		}
	}

	public record UpdateProfileRequest(@Size(min = 2, max = 100) String name, String avatarUrl, List<String> skills) {
	}
}
