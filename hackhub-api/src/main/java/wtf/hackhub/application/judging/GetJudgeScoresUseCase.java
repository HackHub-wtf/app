package wtf.hackhub.application.judging;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.domain.JudgeScore;
import wtf.hackhub.domain.Team;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaScoreRepository;
import wtf.hackhub.infrastructure.persistence.judging.JudgeScoreRepository;
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
public class GetJudgeScoresUseCase {

	private final JudgeScoreRepository judgeScoreRepository;
	private final IdeaRepository ideaRepository;
	private final IdeaScoreRepository ideaScoreRepository;
	private final HackathonRepository hackathonRepository;
	private final TeamRepository teamRepository;

	public GetJudgeScoresUseCase(JudgeScoreRepository judgeScoreRepository, IdeaRepository ideaRepository,
			IdeaScoreRepository ideaScoreRepository, HackathonRepository hackathonRepository,
			TeamRepository teamRepository) {
		this.judgeScoreRepository = judgeScoreRepository;
		this.ideaRepository = ideaRepository;
		this.ideaScoreRepository = ideaScoreRepository;
		this.hackathonRepository = hackathonRepository;
		this.teamRepository = teamRepository;
	}

	@Transactional(readOnly = true)
	public List<JudgeScore> getScoresForHackathon(UUID hackathonId, UUID requestingUserId, boolean isManager) {
		if (isManager) {
			return judgeScoreRepository.findAllByHackathonId(hackathonId);
		}
		return judgeScoreRepository.findAllByHackathonIdAndJudgeId(hackathonId, requestingUserId);
	}

	@Transactional(readOnly = true)
	public List<ScoreSummary> getSummary(UUID hackathonId) {
		Hackathon hackathon = hackathonRepository.findById(hackathonId)
				.orElseThrow(() -> new HackathonNotFoundException(hackathonId));

		List<Idea> ideas = ideaRepository.findAllByHackathonId(hackathonId);
		List<JudgeScore> allJudgeScores = judgeScoreRepository.findAllByHackathonId(hackathonId);

		Map<UUID, List<JudgeScore>> judgeScoresByIdea = allJudgeScores.stream()
				.collect(Collectors.groupingBy(JudgeScore::getIdeaId));

		int panelWeight = hackathon.getPanelWeight();
		int communityWeight = 100 - panelWeight;

		List<ScoreSummary> summaries = new ArrayList<>();

		for (Idea idea : ideas) {
			List<JudgeScore> panelScores = judgeScoresByIdea.getOrDefault(idea.getId(), List.of());
			double panelAvg = panelScores.isEmpty() ? 0.0
					: panelScores.stream().mapToInt(JudgeScore::getScore).average().orElse(0.0);

			int communityVoterCount = ideaScoreRepository.countDistinctVoters(idea.getId());
			BigDecimal communityScore = ideaScoreRepository.calculateWeightedScore(idea.getId(), hackathonId);

			BigDecimal panelScore = BigDecimal.valueOf(panelAvg).setScale(2, RoundingMode.HALF_UP);

			BigDecimal blendedScore = switch (hackathon.getJudgingMode()) {
				case PANEL -> panelScore;
				case COMMUNITY -> communityScore;
				case BLENDED -> panelScore.multiply(BigDecimal.valueOf(panelWeight))
						.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP)
						.add(communityScore.multiply(BigDecimal.valueOf(communityWeight))
								.divide(BigDecimal.valueOf(100), 4, RoundingMode.HALF_UP))
						.setScale(2, RoundingMode.HALF_UP);
			};

			String teamName = idea.getTeamId() == null ? null
					: teamRepository.findById(idea.getTeamId()).map(Team::getName).orElse(null);

			summaries.add(new ScoreSummary(idea.getId(), idea.getTitle(), panelScore, communityScore, blendedScore,
					communityVoterCount, idea.getTeamId(), teamName, 0));
		}

		summaries.sort(Comparator.comparing(ScoreSummary::blendedScore).reversed());

		List<ScoreSummary> ranked = new ArrayList<>();
		for (int i = 0; i < summaries.size(); i++) {
			ScoreSummary s = summaries.get(i);
			ranked.add(new ScoreSummary(s.ideaId(), s.ideaTitle(), s.panelScore(), s.communityScore(),
					s.blendedScore(), s.communityVoterCount(), s.teamId(), s.teamName(), i + 1));
		}
		return ranked;
	}

	public record ScoreSummary(UUID ideaId, String ideaTitle, BigDecimal panelScore, BigDecimal communityScore,
			BigDecimal blendedScore, int communityVoterCount, UUID teamId, String teamName, int rank) {
	}

	public static class HackathonNotFoundException extends RuntimeException {
		public HackathonNotFoundException(UUID id) {
			super("Hackathon not found: " + id);
		}
	}
}
