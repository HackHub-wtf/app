package wtf.hackhub.application.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.support.PostgresIntegrationTest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AuthFlowIT extends PostgresIntegrationTest {

	@Autowired
	RegisterUseCase registerUseCase;
	@Autowired
	LoginUseCase loginUseCase;
	@Autowired
	LogoutUseCase logoutUseCase;
	@Autowired
	RefreshTokenUseCase refreshTokenUseCase;
	@Autowired
	ProfileRepository profileRepository;

	@Test
	void register_creates_profile_with_hashed_password() {
		Profile profile = registerUseCase.execute("alice@test.com", "Alice", "Secret99!");

		assertThat(profile.getId()).isNotNull();
		assertThat(profile.getEmail()).isEqualTo("alice@test.com");
		// Password must never be stored in plain text
		assertThat(profile.getPasswordHash()).doesNotContain("Secret99!");
		assertThat(profile.getPasswordHash()).startsWith("$2a$");
	}

	@Test
	void register_duplicate_email_throws() {
		registerUseCase.execute("dup@test.com", "Dup", "Pass1234!");
		assertThatThrownBy(() -> registerUseCase.execute("dup@test.com", "Dup2", "Pass1234!"))
				.isInstanceOf(RegisterUseCase.EmailAlreadyRegisteredException.class);
	}

	@Test
	void login_returns_token_pair() {
		registerUseCase.execute("bob@test.com", "Bob", "Secret99!");
		LoginUseCase.TokenPair tokens = loginUseCase.execute("bob@test.com", "Secret99!");

		assertThat(tokens.accessToken()).isNotBlank();
		assertThat(tokens.refreshToken()).isNotBlank();
		assertThat(tokens.profile().getEmail()).isEqualTo("bob@test.com");
	}

	@Test
	void login_wrong_password_throws() {
		registerUseCase.execute("carol@test.com", "Carol", "RealPass1!");
		assertThatThrownBy(() -> loginUseCase.execute("carol@test.com", "WrongPass!"))
				.isInstanceOf(LoginUseCase.InvalidCredentialsException.class);
	}

	@Test
	void login_unknown_email_throws() {
		assertThatThrownBy(() -> loginUseCase.execute("nobody@test.com", "any"))
				.isInstanceOf(LoginUseCase.InvalidCredentialsException.class);
	}

	@Test
	void refresh_token_rotates_on_use() {
		registerUseCase.execute("dave@test.com", "Dave", "Secret99!");
		LoginUseCase.TokenPair first = loginUseCase.execute("dave@test.com", "Secret99!");

		LoginUseCase.TokenPair second = refreshTokenUseCase.execute(first.refreshToken());
		assertThat(second.accessToken()).isNotBlank();
		// Old refresh token must be rejected after rotation
		assertThatThrownBy(() -> refreshTokenUseCase.execute(first.refreshToken()))
				.isInstanceOf(RefreshTokenUseCase.InvalidRefreshTokenException.class);
	}

	@Test
	void logout_invalidates_all_tokens_for_user() {
		registerUseCase.execute("eve@test.com", "Eve", "Secret99!");
		LoginUseCase.TokenPair tokens = loginUseCase.execute("eve@test.com", "Secret99!");

		logoutUseCase.execute(tokens.profile().getId());

		// Any existing refresh token should now be rejected
		assertThatThrownBy(() -> refreshTokenUseCase.execute(tokens.refreshToken()))
				.isInstanceOf(RefreshTokenUseCase.InvalidRefreshTokenException.class);
	}
}
