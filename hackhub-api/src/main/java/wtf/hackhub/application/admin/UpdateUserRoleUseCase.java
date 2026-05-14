package wtf.hackhub.application.admin;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;

import java.util.UUID;

@Service
public class UpdateUserRoleUseCase {

	private final ProfileRepository profileRepository;

	public UpdateUserRoleUseCase(ProfileRepository profileRepository) {
		this.profileRepository = profileRepository;
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN')")
	public Profile execute(UUID targetUserId, Profile.Role newRole) {
		Profile profile = profileRepository.findById(targetUserId)
				.orElseThrow(() -> new UserNotFoundException(targetUserId));
		profile.changeRole(newRole);
		return profileRepository.save(profile);
	}

	public static class UserNotFoundException extends RuntimeException {
		public UserNotFoundException(UUID id) {
			super("User not found: " + id);
		}
	}
}
