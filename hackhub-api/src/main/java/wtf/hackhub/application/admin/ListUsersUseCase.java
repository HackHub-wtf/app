package wtf.hackhub.application.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;

@Service
public class ListUsersUseCase {

	private final ProfileRepository profileRepository;

	public ListUsersUseCase(ProfileRepository profileRepository) {
		this.profileRepository = profileRepository;
	}

	@Transactional(readOnly = true)
	@PreAuthorize("hasRole('ADMIN')")
	public Page<Profile> execute(Pageable pageable) {
		return profileRepository.findAll(pageable);
	}
}
