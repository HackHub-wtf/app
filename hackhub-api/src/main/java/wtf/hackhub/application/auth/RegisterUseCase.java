package wtf.hackhub.application.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;

@Service
public class RegisterUseCase {

	private final ProfileRepository profileRepository;
	private final PasswordEncoder passwordEncoder;

	public RegisterUseCase(ProfileRepository profileRepository, PasswordEncoder passwordEncoder) {
		this.profileRepository = profileRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public Profile execute(String email, String name, String plainPassword) {
		if (profileRepository.existsByEmail(email)) {
			throw new EmailAlreadyRegisteredException(email);
		}
		String hash = passwordEncoder.encode(plainPassword);
		Profile profile = new Profile(email, name, hash);
		return profileRepository.save(profile);
	}

	public static class EmailAlreadyRegisteredException extends RuntimeException {
		public EmailAlreadyRegisteredException(String email) {
			super("Email already registered: " + email);
		}
	}
}
