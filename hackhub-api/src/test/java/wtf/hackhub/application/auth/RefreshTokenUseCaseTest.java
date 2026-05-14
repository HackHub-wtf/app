package wtf.hackhub.application.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.domain.RefreshToken;
import wtf.hackhub.infrastructure.config.AppProperties;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.auth.RefreshTokenRepository;
import wtf.hackhub.infrastructure.security.JwtProvider;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RefreshTokenUseCaseTest {

	@Mock
	RefreshTokenRepository refreshTokenRepository;
	@Mock
	ProfileRepository profileRepository;
	@Mock
	JwtProvider jwtProvider;
	@Mock
	AppProperties appProperties;

	RefreshTokenUseCase buildUseCase() {
		var jwt = mock(AppProperties.Jwt.class);
		when(appProperties.jwt()).thenReturn(jwt);
		when(jwt.refreshTokenExpirySeconds()).thenReturn(604800L);
		return new RefreshTokenUseCase(refreshTokenRepository, profileRepository, jwtProvider, appProperties);
	}

	@Test
	void valid_token_rotates_and_returns_new_pair() {
		RefreshTokenUseCase useCase = buildUseCase();
		UUID userId = UUID.randomUUID();
		String rawToken = "raw_token_value";
		String tokenHash = LoginUseCase.sha256(rawToken);

		RefreshToken stored = new RefreshToken(userId, tokenHash, Instant.now().plusSeconds(3600));
		Profile profile = new Profile("u@test.com", "User", "hash");

		when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(stored));
		when(profileRepository.findById(userId)).thenReturn(Optional.of(profile));
		when(jwtProvider.issueAccessToken(profile)).thenReturn("new.access.token");
		when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		LoginUseCase.TokenPair result = useCase.execute(rawToken);

		assertThat(result.accessToken()).isEqualTo("new.access.token");
		assertThat(stored.isRevoked()).isTrue();
		// save called twice: once for revoking old, once for new token
		verify(refreshTokenRepository, times(2)).save(any(RefreshToken.class));
	}

	@Test
	void unknown_token_throws_invalid_refresh_token() {
		RefreshTokenUseCase useCase = buildUseCase();
		when(refreshTokenRepository.findByTokenHash(any())).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.execute("unknown_token"))
				.isInstanceOf(RefreshTokenUseCase.InvalidRefreshTokenException.class);
	}

	@Test
	void expired_token_revokes_all_and_throws() {
		RefreshTokenUseCase useCase = buildUseCase();
		UUID userId = UUID.randomUUID();
		String rawToken = "expired_raw";
		String tokenHash = LoginUseCase.sha256(rawToken);

		// Token is expired (expiresAt in the past)
		RefreshToken expired = new RefreshToken(userId, tokenHash, Instant.now().minusSeconds(1));

		when(refreshTokenRepository.findByTokenHash(tokenHash)).thenReturn(Optional.of(expired));

		assertThatThrownBy(() -> useCase.execute(rawToken))
				.isInstanceOf(RefreshTokenUseCase.InvalidRefreshTokenException.class);

		verify(refreshTokenRepository).revokeAllForUser(userId);
	}
}
