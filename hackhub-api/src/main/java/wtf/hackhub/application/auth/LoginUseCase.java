package wtf.hackhub.application.auth;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.domain.RefreshToken;
import wtf.hackhub.infrastructure.config.AppProperties;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.auth.RefreshTokenRepository;
import wtf.hackhub.infrastructure.security.JwtProvider;

import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class LoginUseCase {

	private final ProfileRepository profileRepository;
	private final RefreshTokenRepository refreshTokenRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtProvider jwtProvider;
	private final long refreshTokenExpirySeconds;
	private final SecureRandom secureRandom = new SecureRandom();

	public LoginUseCase(ProfileRepository profileRepository, RefreshTokenRepository refreshTokenRepository,
			PasswordEncoder passwordEncoder, JwtProvider jwtProvider, AppProperties properties) {
		this.profileRepository = profileRepository;
		this.refreshTokenRepository = refreshTokenRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtProvider = jwtProvider;
		this.refreshTokenExpirySeconds = properties.jwt().refreshTokenExpirySeconds();
	}

	@Transactional
	public TokenPair execute(String email, String password) {
		Profile profile = profileRepository.findByEmail(email).orElseThrow(InvalidCredentialsException::new);

		if (!passwordEncoder.matches(password, profile.getPasswordHash())) {
			throw new InvalidCredentialsException();
		}

		String accessToken = jwtProvider.issueAccessToken(profile);
		String rawRefreshToken = generateSecureToken();
		String tokenHash = sha256(rawRefreshToken);

		RefreshToken refreshToken = new RefreshToken(profile.getId(), tokenHash,
				Instant.now().plusSeconds(refreshTokenExpirySeconds));
		refreshTokenRepository.save(refreshToken);

		return new TokenPair(accessToken, rawRefreshToken, profile);
	}

	private String generateSecureToken() {
		byte[] bytes = new byte[32];
		secureRandom.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	static String sha256(String input) {
		try {
			MessageDigest digest = MessageDigest.getInstance("SHA-256");
			byte[] hash = digest.digest(input.getBytes());
			return Base64.getEncoder().encodeToString(hash);
		} catch (Exception e) {
			throw new IllegalStateException("SHA-256 unavailable", e);
		}
	}

	public record TokenPair(String accessToken, String refreshToken, Profile profile) {
	}

	public static class InvalidCredentialsException extends RuntimeException {
		public InvalidCredentialsException() {
			super("Invalid email or password");
		}
	}
}
