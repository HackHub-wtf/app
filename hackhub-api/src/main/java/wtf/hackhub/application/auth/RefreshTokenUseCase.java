package wtf.hackhub.application.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.domain.RefreshToken;
import wtf.hackhub.infrastructure.config.AppProperties;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.auth.RefreshTokenRepository;
import wtf.hackhub.infrastructure.security.JwtProvider;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

@Service
public class RefreshTokenUseCase {

	private final RefreshTokenRepository refreshTokenRepository;
	private final ProfileRepository profileRepository;
	private final JwtProvider jwtProvider;
	private final long refreshTokenExpirySeconds;
	private final SecureRandom secureRandom = new SecureRandom();

	public RefreshTokenUseCase(RefreshTokenRepository refreshTokenRepository, ProfileRepository profileRepository,
			JwtProvider jwtProvider, AppProperties properties) {
		this.refreshTokenRepository = refreshTokenRepository;
		this.profileRepository = profileRepository;
		this.jwtProvider = jwtProvider;
		this.refreshTokenExpirySeconds = properties.jwt().refreshTokenExpirySeconds();
	}

	@Transactional
	public LoginUseCase.TokenPair execute(String rawRefreshToken) {
		String tokenHash = LoginUseCase.sha256(rawRefreshToken);

		RefreshToken stored = refreshTokenRepository.findByTokenHash(tokenHash)
				.orElseThrow(InvalidRefreshTokenException::new);

		if (!stored.isValid()) {
			// Revoke all tokens for this user — possible token theft
			refreshTokenRepository.revokeAllForUser(stored.getUserId());
			throw new InvalidRefreshTokenException();
		}

		// Rotate: revoke old token
		stored.revoke();
		refreshTokenRepository.save(stored);

		Profile profile = profileRepository.findById(stored.getUserId()).orElseThrow(InvalidRefreshTokenException::new);

		String newAccessToken = jwtProvider.issueAccessToken(profile);
		String newRawToken = generateSecureToken();
		String newHash = LoginUseCase.sha256(newRawToken);

		RefreshToken newToken = new RefreshToken(profile.getId(), newHash,
				Instant.now().plusSeconds(refreshTokenExpirySeconds));
		refreshTokenRepository.save(newToken);

		return new LoginUseCase.TokenPair(newAccessToken, newRawToken, profile);
	}

	private String generateSecureToken() {
		byte[] bytes = new byte[32];
		secureRandom.nextBytes(bytes);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	public static class InvalidRefreshTokenException extends RuntimeException {
		public InvalidRefreshTokenException() {
			super("Invalid or expired refresh token");
		}
	}
}
