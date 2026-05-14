package wtf.hackhub.application.profile;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;

import java.util.List;
import java.util.UUID;

@Service
public class UpdateProfileUseCase {

	private final ProfileRepository profileRepository;

	public UpdateProfileUseCase(ProfileRepository profileRepository) {
		this.profileRepository = profileRepository;
	}

	@Transactional(readOnly = true)
	public Profile getById(UUID id) {
		return profileRepository.findById(id).orElseThrow(() -> new ProfileNotFoundException(id));
	}

	@Transactional
	public Profile update(UUID userId, String name, String avatarUrl, List<String> skills) {
		Profile profile = profileRepository.findById(userId).orElseThrow(() -> new ProfileNotFoundException(userId));
		profile.updateProfile(name != null ? name : profile.getName(),
				avatarUrl != null ? avatarUrl : profile.getAvatarUrl(), skills != null ? skills : profile.getSkills());
		return profileRepository.save(profile);
	}

	public static class ProfileNotFoundException extends RuntimeException {
		public ProfileNotFoundException(UUID id) {
			super("Profile not found: " + id);
		}
	}
}
