package wtf.hackhub.application.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.domain.RefreshToken;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.auth.RefreshTokenRepository;
import wtf.hackhub.infrastructure.security.JwtProvider;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class LoginUseCaseTest {

	@Mock
	ProfileRepository profileRepository;
	@Mock
	RefreshTokenRepository refreshTokenRepository;
	@Mock
	PasswordEncoder passwordEncoder;
	@Mock
	JwtProvider jwtProvider;
	@Mock
	wtf.hackhub.infrastructure.config.AppProperties appProperties;

	// Manual construction to avoid @InjectMocks needing AppProperties.Jwt
	LoginUseCase buildUseCase() {
		var jwt = mock(wtf.hackhub.infrastructure.config.AppProperties.Jwt.class);
		when(appProperties.jwt()).thenReturn(jwt);
		when(jwt.refreshTokenExpirySeconds()).thenReturn(604800L);
		return new LoginUseCase(profileRepository, refreshTokenRepository, passwordEncoder, jwtProvider, appProperties);
	}

	@Test
	void valid_credentials_return_token_pair() {
		LoginUseCase useCase = buildUseCase();
		Profile profile = new Profile("user@test.com", "User", "hashed");
		when(profileRepository.findByEmail("user@test.com")).thenReturn(Optional.of(profile));
		when(passwordEncoder.matches("secret", "hashed")).thenReturn(true);
		when(jwtProvider.issueAccessToken(profile)).thenReturn("access.token");
		when(refreshTokenRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		LoginUseCase.TokenPair result = useCase.execute("user@test.com", "secret");

		assertThat(result.accessToken()).isEqualTo("access.token");
		assertThat(result.profile().getEmail()).isEqualTo("user@test.com");
		verify(refreshTokenRepository).save(any(RefreshToken.class));
	}

	@Test
	void unknown_email_throws_invalid_credentials() {
		LoginUseCase useCase = buildUseCase();
		when(profileRepository.findByEmail("nobody@test.com")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.execute("nobody@test.com", "any"))
				.isInstanceOf(LoginUseCase.InvalidCredentialsException.class);

		verify(refreshTokenRepository, never()).save(any());
	}

	@Test
	void wrong_password_throws_invalid_credentials() {
		LoginUseCase useCase = buildUseCase();
		Profile profile = new Profile("user@test.com", "User", "hashed");
		when(profileRepository.findByEmail("user@test.com")).thenReturn(Optional.of(profile));
		when(passwordEncoder.matches("wrong", "hashed")).thenReturn(false);

		assertThatThrownBy(() -> useCase.execute("user@test.com", "wrong"))
				.isInstanceOf(LoginUseCase.InvalidCredentialsException.class);

		verify(refreshTokenRepository, never()).save(any());
	}
}
