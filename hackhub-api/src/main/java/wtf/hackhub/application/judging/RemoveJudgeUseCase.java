package wtf.hackhub.application.judging;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.infrastructure.persistence.judging.HackathonJudgeRepository;

import java.util.UUID;

@Service
public class RemoveJudgeUseCase {

	private final HackathonJudgeRepository judgeRepository;

	public RemoveJudgeUseCase(HackathonJudgeRepository judgeRepository) {
		this.judgeRepository = judgeRepository;
	}

	@Transactional
	public void execute(UUID hackathonId, UUID userId) {
		if (!judgeRepository.existsByHackathonIdAndUserId(hackathonId, userId)) {
			throw new JudgeNotFoundException(hackathonId, userId);
		}
		judgeRepository.deleteByHackathonIdAndUserId(hackathonId, userId);
	}

	public static class JudgeNotFoundException extends RuntimeException {
		public JudgeNotFoundException(UUID hackathonId, UUID userId) {
			super("Judge " + userId + " not found in hackathon " + hackathonId);
		}
	}
}
