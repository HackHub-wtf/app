package wtf.hackhub.application.auth;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.infrastructure.persistence.auth.RefreshTokenRepository;

import java.util.UUID;

import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class LogoutUseCaseTest {

	@Mock
	RefreshTokenRepository refreshTokenRepository;
	@InjectMocks
	LogoutUseCase useCase;

	@Test
	void revokes_all_tokens_for_user() {
		UUID userId = UUID.randomUUID();

		useCase.execute(userId);

		verify(refreshTokenRepository).revokeAllForUser(userId);
	}

	@Test
	void revoke_is_idempotent_for_unknown_user() {
		UUID userId = UUID.randomUUID();
		// revokeAllForUser is a @Modifying query — no exception if no rows match
		useCase.execute(userId);

		verify(refreshTokenRepository).revokeAllForUser(userId);
	}
}
