package wtf.hackhub.application.idea;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.domain.IdeaScore;
import wtf.hackhub.domain.VotingCriteria;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaScoreRepository;
import wtf.hackhub.infrastructure.persistence.idea.VotingCriteriaRepository;

import java.math.BigDecimal;
import java.util.UUID;

@Service
public class ScoreIdeaUseCase {

	private final IdeaScoreRepository scoreRepository;
	private final IdeaRepository ideaRepository;
	private final VotingCriteriaRepository criteriaRepository;

	public ScoreIdeaUseCase(IdeaScoreRepository scoreRepository, IdeaRepository ideaRepository,
			VotingCriteriaRepository criteriaRepository) {
		this.scoreRepository = scoreRepository;
		this.ideaRepository = ideaRepository;
		this.criteriaRepository = criteriaRepository;
	}

	@Transactional
	public IdeaScore execute(UUID ideaId, UUID userId, UUID criteriaId, int score) {
		Idea idea = ideaRepository.findById(ideaId)
				.orElseThrow(() -> new VoteIdeaUseCase.IdeaNotFoundException(ideaId));

		VotingCriteria criteria = criteriaRepository.findById(criteriaId)
				.orElseThrow(() -> new CriteriaNotFoundException(criteriaId));

		// Criteria must belong to the same hackathon as the idea
		if (!criteria.getHackathonId().equals(idea.getHackathonId())) {
			throw new CriteriaMismatchException(criteriaId, idea.getHackathonId());
		}

		IdeaScore ideaScore = scoreRepository.findByIdeaIdAndUserIdAndCriteriaId(ideaId, userId, criteriaId)
				.orElse(new IdeaScore(ideaId, userId, criteriaId, score));

		ideaScore.updateScore(score);
		IdeaScore saved = scoreRepository.save(ideaScore);

		// Recalculate and persist the weighted total score
		BigDecimal weighted = scoreRepository.calculateWeightedScore(ideaId, idea.getHackathonId());
		int voters = scoreRepository.countDistinctVoters(ideaId);
		idea.updateScore(weighted, voters);
		ideaRepository.save(idea);

		return saved;
	}

	public static class CriteriaNotFoundException extends RuntimeException {
		public CriteriaNotFoundException(UUID id) {
			super("Voting criteria not found: " + id);
		}
	}

	public static class CriteriaMismatchException extends RuntimeException {
		public CriteriaMismatchException(UUID criteriaId, UUID hackathonId) {
			super("Criteria " + criteriaId + " does not belong to hackathon " + hackathonId);
		}
	}
}
