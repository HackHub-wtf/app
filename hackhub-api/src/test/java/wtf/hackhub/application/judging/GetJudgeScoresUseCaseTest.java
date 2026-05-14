package wtf.hackhub.application.judging;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.domain.JudgeScore;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaScoreRepository;
import wtf.hackhub.infrastructure.persistence.judging.JudgeScoreRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamRepository;
import wtf.hackhub.domain.Team;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetJudgeScoresUseCaseTest {

	@Mock
	JudgeScoreRepository judgeScoreRepository;
	@Mock
	IdeaRepository ideaRepository;
	@Mock
	IdeaScoreRepository ideaScoreRepository;
	@Mock
	HackathonRepository hackathonRepository;
	@Mock
	TeamRepository teamRepository;

	@InjectMocks
	GetJudgeScoresUseCase useCase;

	private Hackathon hackathon(Hackathon.JudgingMode mode, int panelWeight) {
		Hackathon h = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(86400), "KEY", 4, 100,
				UUID.randomUUID(), null);
		h.updateJudgingConfig(Hackathon.Visibility.PRIVATE, Hackathon.JoinPolicy.SELF_REGISTER, mode, panelWeight);
		return h;
	}

	private Idea mockIdea(UUID ideaId, UUID hackathonId, UUID teamId) {
		Idea idea = org.mockito.Mockito.mock(Idea.class);
		org.mockito.Mockito.when(idea.getId()).thenReturn(ideaId);
		org.mockito.Mockito.when(idea.getTitle()).thenReturn("Cool");
		org.mockito.Mockito.when(idea.getTeamId()).thenReturn(teamId);
		return idea;
	}

	// ── getScoresForHackathon ─────────────────────────────────────────────────

	@Test
	void manager_gets_all_scores() {
		UUID hackathonId = UUID.randomUUID();
		UUID judgeId = UUID.randomUUID();
		JudgeScore score = new JudgeScore(hackathonId, UUID.randomUUID(), judgeId, null, 8, null);
		when(judgeScoreRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of(score));

		List<JudgeScore> result = useCase.getScoresForHackathon(hackathonId, judgeId, true);
		assertThat(result).hasSize(1);
	}

	@Test
	void non_manager_gets_only_own_scores() {
		UUID hackathonId = UUID.randomUUID();
		UUID judgeId = UUID.randomUUID();
		JudgeScore score = new JudgeScore(hackathonId, UUID.randomUUID(), judgeId, null, 7, null);
		when(judgeScoreRepository.findAllByHackathonIdAndJudgeId(hackathonId, judgeId)).thenReturn(List.of(score));

		List<JudgeScore> result = useCase.getScoresForHackathon(hackathonId, judgeId, false);
		assertThat(result).hasSize(1);
	}

	// ── getSummary ────────────────────────────────────────────────────────────

	@Test
	void summary_throws_when_hackathon_not_found() {
		UUID hackathonId = UUID.randomUUID();
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.getSummary(hackathonId))
				.isInstanceOf(GetJudgeScoresUseCase.HackathonNotFoundException.class);
	}

	@Test
	void summary_returns_empty_list_when_no_ideas() {
		UUID hackathonId = UUID.randomUUID();
		when(hackathonRepository.findById(hackathonId))
				.thenReturn(Optional.of(hackathon(Hackathon.JudgingMode.PANEL, 70)));
		when(ideaRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of());
		when(judgeScoreRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of());

		List<GetJudgeScoresUseCase.ScoreSummary> result = useCase.getSummary(hackathonId);
		assertThat(result).isEmpty();
	}

	@Test
	void summary_panel_mode_uses_panel_score() {
		UUID hackathonId = UUID.randomUUID();
		UUID ideaId = UUID.randomUUID();
		UUID teamId = UUID.randomUUID();
		Idea idea = mockIdea(ideaId, hackathonId, teamId);
		JudgeScore judgeScore = new JudgeScore(hackathonId, ideaId, UUID.randomUUID(), null, 8, null);
		Team team = new Team("Alpha", "desc", hackathonId, UUID.randomUUID());

		when(hackathonRepository.findById(hackathonId))
				.thenReturn(Optional.of(hackathon(Hackathon.JudgingMode.PANEL, 100)));
		when(ideaRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of(idea));
		when(judgeScoreRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of(judgeScore));
		when(ideaScoreRepository.countDistinctVoters(ideaId)).thenReturn(0);
		when(ideaScoreRepository.calculateWeightedScore(ideaId, hackathonId)).thenReturn(BigDecimal.ZERO);
		when(teamRepository.findById(teamId)).thenReturn(Optional.of(team));

		List<GetJudgeScoresUseCase.ScoreSummary> result = useCase.getSummary(hackathonId);
		assertThat(result).hasSize(1);
		assertThat(result.get(0).rank()).isEqualTo(1);
		assertThat(result.get(0).blendedScore()).isEqualByComparingTo("8.00");
		assertThat(result.get(0).teamName()).isEqualTo("Alpha");
	}

	@Test
	void summary_community_mode_uses_community_score() {
		UUID hackathonId = UUID.randomUUID();
		UUID ideaId = UUID.randomUUID();
		Idea idea = mockIdea(ideaId, hackathonId, null);

		when(hackathonRepository.findById(hackathonId))
				.thenReturn(Optional.of(hackathon(Hackathon.JudgingMode.COMMUNITY, 0)));
		when(ideaRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of(idea));
		when(judgeScoreRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of());
		when(ideaScoreRepository.countDistinctVoters(ideaId)).thenReturn(5);
		when(ideaScoreRepository.calculateWeightedScore(ideaId, hackathonId)).thenReturn(new BigDecimal("7.50"));

		List<GetJudgeScoresUseCase.ScoreSummary> result = useCase.getSummary(hackathonId);
		assertThat(result).hasSize(1);
		assertThat(result.get(0).blendedScore()).isEqualByComparingTo("7.50");
		assertThat(result.get(0).teamName()).isNull();
	}

	@Test
	void summary_blended_mode_combines_panel_and_community() {
		UUID hackathonId = UUID.randomUUID();
		UUID ideaId = UUID.randomUUID();
		Idea idea = mockIdea(ideaId, hackathonId, null);
		JudgeScore judgeScore = new JudgeScore(hackathonId, ideaId, UUID.randomUUID(), null, 10, null);

		when(hackathonRepository.findById(hackathonId))
				.thenReturn(Optional.of(hackathon(Hackathon.JudgingMode.BLENDED, 70)));
		when(ideaRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of(idea));
		when(judgeScoreRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of(judgeScore));
		when(ideaScoreRepository.countDistinctVoters(ideaId)).thenReturn(3);
		when(ideaScoreRepository.calculateWeightedScore(ideaId, hackathonId)).thenReturn(new BigDecimal("6.00"));

		List<GetJudgeScoresUseCase.ScoreSummary> result = useCase.getSummary(hackathonId);
		assertThat(result).hasSize(1);
		// BLENDED: 10 * 0.70 + 6.00 * 0.30 = 7.00 + 1.80 = 8.80
		assertThat(result.get(0).blendedScore()).isEqualByComparingTo("8.80");
	}

	@Test
	void summary_ranks_ideas_by_blended_score_descending() {
		UUID hackathonId = UUID.randomUUID();
		UUID id1 = UUID.randomUUID();
		UUID id2 = UUID.randomUUID();
		Idea idea1 = mockIdea(id1, hackathonId, null);
		Idea idea2 = mockIdea(id2, hackathonId, null);
		JudgeScore high = new JudgeScore(hackathonId, id1, UUID.randomUUID(), null, 9, null);
		JudgeScore low = new JudgeScore(hackathonId, id2, UUID.randomUUID(), null, 3, null);

		when(hackathonRepository.findById(hackathonId))
				.thenReturn(Optional.of(hackathon(Hackathon.JudgingMode.PANEL, 100)));
		when(ideaRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of(idea2, idea1));
		when(judgeScoreRepository.findAllByHackathonId(hackathonId)).thenReturn(List.of(high, low));
		when(ideaScoreRepository.countDistinctVoters(id1)).thenReturn(0);
		when(ideaScoreRepository.countDistinctVoters(id2)).thenReturn(0);
		when(ideaScoreRepository.calculateWeightedScore(id1, hackathonId)).thenReturn(BigDecimal.ZERO);
		when(ideaScoreRepository.calculateWeightedScore(id2, hackathonId)).thenReturn(BigDecimal.ZERO);

		List<GetJudgeScoresUseCase.ScoreSummary> result = useCase.getSummary(hackathonId);
		assertThat(result).hasSize(2);
		assertThat(result.get(0).rank()).isEqualTo(1);
		assertThat(result.get(0).blendedScore()).isGreaterThan(result.get(1).blendedScore());
	}
}
