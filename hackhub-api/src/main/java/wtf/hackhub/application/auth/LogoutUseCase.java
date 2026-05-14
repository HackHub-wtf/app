package wtf.hackhub.application.auth;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.infrastructure.persistence.auth.RefreshTokenRepository;

import java.util.UUID;

@Service
public class LogoutUseCase {

	private final RefreshTokenRepository refreshTokenRepository;

	public LogoutUseCase(RefreshTokenRepository refreshTokenRepository) {
		this.refreshTokenRepository = refreshTokenRepository;
	}

	@Transactional
	public void execute(UUID userId) {
		refreshTokenRepository.revokeAllForUser(userId);
	}
}
