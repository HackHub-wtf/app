package wtf.hackhub.application.judging;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.JudgeScore;
import wtf.hackhub.infrastructure.persistence.judging.HackathonJudgeRepository;
import wtf.hackhub.infrastructure.persistence.judging.JudgeScoreRepository;

import java.util.UUID;

@Service
public class SubmitJudgeScoreUseCase {

	private final JudgeScoreRepository scoreRepository;
	private final HackathonJudgeRepository judgeRepository;

	public SubmitJudgeScoreUseCase(JudgeScoreRepository scoreRepository, HackathonJudgeRepository judgeRepository) {
		this.scoreRepository = scoreRepository;
		this.judgeRepository = judgeRepository;
	}

	@Transactional
	public JudgeScore execute(UUID hackathonId, UUID ideaId, UUID judgeId, UUID criterionId, int score,
			String comment) {
		if (!judgeRepository.existsByHackathonIdAndUserId(hackathonId, judgeId)) {
			throw new NotAJudgeException(judgeId, hackathonId);
		}

		return scoreRepository.findByIdeaIdAndJudgeIdAndCriterionId(ideaId, judgeId, criterionId).map(existing -> {
			existing.update(score, comment);
			return scoreRepository.save(existing);
		}).orElseGet(
				() -> scoreRepository.save(new JudgeScore(hackathonId, ideaId, judgeId, criterionId, score, comment)));
	}

	public static class NotAJudgeException extends RuntimeException {
		public NotAJudgeException(UUID userId, UUID hackathonId) {
			super("User " + userId + " is not a judge for hackathon " + hackathonId);
		}
	}
}
