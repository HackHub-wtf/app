package wtf.hackhub.application.hackathon;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.domain.IdeaScore;
import wtf.hackhub.domain.VotingCriteria;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaScoreRepository;
import wtf.hackhub.infrastructure.persistence.idea.VotingCriteriaRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GetLeaderboardUseCase {

	private final IdeaRepository ideaRepository;
	private final IdeaScoreRepository scoreRepository;
	private final VotingCriteriaRepository criteriaRepository;
	private final TeamRepository teamRepository;

	public GetLeaderboardUseCase(IdeaRepository ideaRepository, IdeaScoreRepository scoreRepository,
			VotingCriteriaRepository criteriaRepository, TeamRepository teamRepository) {
		this.ideaRepository = ideaRepository;
		this.scoreRepository = scoreRepository;
		this.criteriaRepository = criteriaRepository;
		this.teamRepository = teamRepository;
	}

	@Transactional(readOnly = true)
	public List<LeaderboardEntry> execute(UUID hackathonId) {
		List<Idea> ideas = ideaRepository.findAllByHackathonId(hackathonId);
		List<VotingCriteria> allCriteria = criteriaRepository.findAllByHackathonIdOrderByDisplayOrder(hackathonId);

		List<LeaderboardEntry> entries = new ArrayList<>();

		for (Idea idea : ideas) {
			List<IdeaScore> scores = scoreRepository.findAllByIdeaId(idea.getId());

			// Group scores by criteria
			Map<UUID, List<IdeaScore>> byCriteria = scores.stream()
					.collect(Collectors.groupingBy(IdeaScore::getCriteriaId));

			List<CriteriaScore> criteriaScores = new ArrayList<>();
			BigDecimal totalWeightedScore = BigDecimal.ZERO;

			for (VotingCriteria criteria : allCriteria) {
				List<IdeaScore> criteriaScoreList = byCriteria.getOrDefault(criteria.getId(), List.of());
				double avgScore = criteriaScoreList.isEmpty()
						? 0.0
						: criteriaScoreList.stream().mapToInt(IdeaScore::getScore).average().orElse(0.0);

				BigDecimal avg = BigDecimal.valueOf(avgScore).setScale(2, RoundingMode.HALF_UP);
				BigDecimal weighted = avg.multiply(BigDecimal.valueOf(criteria.getWeight()))
						.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP);
				totalWeightedScore = totalWeightedScore.add(weighted);

				criteriaScores.add(new CriteriaScore(criteria.getId(), criteria.getName(), criteria.getWeight(), avg));
			}

			int voterCount = (int) scores.stream().map(IdeaScore::getUserId).distinct().count();
			BigDecimal finalScore = totalWeightedScore.setScale(2, RoundingMode.HALF_UP);

			String teamName = idea.getTeamId() == null
					? null
					: teamRepository.findById(idea.getTeamId()).map(t -> t.getName()).orElse(null);

			entries.add(new LeaderboardEntry(0, idea.getId(), idea.getTitle(), idea.getDescription(), idea.getTeamId(),
					teamName, finalScore, voterCount, criteriaScores));
		}

		entries.sort(Comparator.comparing(LeaderboardEntry::totalScore).reversed());

		List<LeaderboardEntry> ranked = new ArrayList<>();
		for (int i = 0; i < entries.size(); i++) {
			LeaderboardEntry e = entries.get(i);
			ranked.add(new LeaderboardEntry(i + 1, e.ideaId(), e.title(), e.description(), e.teamId(), e.teamName(),
					e.totalScore(), e.voteCount(), e.criteriaScores()));
		}

		return ranked;
	}

	public record LeaderboardEntry(int rank, UUID ideaId, String title, String description, UUID teamId,
			String teamName, BigDecimal totalScore, int voteCount, List<CriteriaScore> criteriaScores) {
	}

	public record CriteriaScore(UUID criteriaId, String criteriaName, int weight, BigDecimal averageScore) {
	}
}
