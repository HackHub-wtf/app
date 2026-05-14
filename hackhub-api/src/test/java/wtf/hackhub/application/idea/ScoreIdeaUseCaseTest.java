package wtf.hackhub.application.idea;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.domain.IdeaScore;
import wtf.hackhub.domain.VotingCriteria;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaScoreRepository;
import wtf.hackhub.infrastructure.persistence.idea.VotingCriteriaRepository;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScoreIdeaUseCaseTest {

	@Mock
	IdeaScoreRepository scoreRepository;
	@Mock
	IdeaRepository ideaRepository;
	@Mock
	VotingCriteriaRepository criteriaRepository;
	@InjectMocks
	ScoreIdeaUseCase useCase;

	static final UUID HACKATHON_ID = UUID.randomUUID();
	static final UUID IDEA_ID = UUID.randomUUID();
	static final UUID USER_ID = UUID.randomUUID();
	static final UUID CRITERIA_ID = UUID.randomUUID();

	static Idea idea() {
		return new Idea("t", "d", HACKATHON_ID, null, USER_ID, "AI");
	}

	static VotingCriteria criteria(UUID hackathonId) {
		return new VotingCriteria(hackathonId, "Quality", null, 50, 1);
	}

	@Test
	void records_new_score() {
		Idea idea = idea();
		VotingCriteria crit = criteria(HACKATHON_ID);
		IdeaScore score = new IdeaScore(IDEA_ID, USER_ID, CRITERIA_ID, 8);

		when(ideaRepository.findById(IDEA_ID)).thenReturn(Optional.of(idea));
		when(criteriaRepository.findById(CRITERIA_ID)).thenReturn(Optional.of(crit));
		when(scoreRepository.findByIdeaIdAndUserIdAndCriteriaId(any(), any(), any())).thenReturn(Optional.empty());
		when(scoreRepository.save(any())).thenReturn(score);
		when(scoreRepository.calculateWeightedScore(any(), any())).thenReturn(BigDecimal.valueOf(8.0));
		when(scoreRepository.countDistinctVoters(any())).thenReturn(1);
		when(ideaRepository.save(any())).thenReturn(idea);

		IdeaScore result = useCase.execute(IDEA_ID, USER_ID, CRITERIA_ID, 8);
		assertThat(result.getScore()).isEqualTo(8);
	}

	@Test
	void updates_existing_score() {
		Idea idea = idea();
		VotingCriteria crit = criteria(HACKATHON_ID);
		IdeaScore existing = new IdeaScore(IDEA_ID, USER_ID, CRITERIA_ID, 5);

		when(ideaRepository.findById(IDEA_ID)).thenReturn(Optional.of(idea));
		when(criteriaRepository.findById(CRITERIA_ID)).thenReturn(Optional.of(crit));
		when(scoreRepository.findByIdeaIdAndUserIdAndCriteriaId(any(), any(), any())).thenReturn(Optional.of(existing));
		when(scoreRepository.save(any())).thenReturn(existing);
		when(scoreRepository.calculateWeightedScore(any(), any())).thenReturn(BigDecimal.valueOf(9.0));
		when(scoreRepository.countDistinctVoters(any())).thenReturn(2);
		when(ideaRepository.save(any())).thenReturn(idea);

		IdeaScore result = useCase.execute(IDEA_ID, USER_ID, CRITERIA_ID, 9);
		assertThat(result).isNotNull();
	}

	@Test
	void idea_not_found_throws() {
		when(ideaRepository.findById(IDEA_ID)).thenReturn(Optional.empty());
		assertThatThrownBy(() -> useCase.execute(IDEA_ID, USER_ID, CRITERIA_ID, 5))
				.isInstanceOf(VoteIdeaUseCase.IdeaNotFoundException.class);
	}

	@Test
	void criteria_not_found_throws() {
		when(ideaRepository.findById(IDEA_ID)).thenReturn(Optional.of(idea()));
		when(criteriaRepository.findById(CRITERIA_ID)).thenReturn(Optional.empty());
		assertThatThrownBy(() -> useCase.execute(IDEA_ID, USER_ID, CRITERIA_ID, 5))
				.isInstanceOf(ScoreIdeaUseCase.CriteriaNotFoundException.class);
	}

	@Test
	void criteria_from_different_hackathon_throws() {
		Idea idea = idea();
		VotingCriteria wrongCrit = criteria(UUID.randomUUID()); // different hackathon

		when(ideaRepository.findById(IDEA_ID)).thenReturn(Optional.of(idea));
		when(criteriaRepository.findById(CRITERIA_ID)).thenReturn(Optional.of(wrongCrit));
		assertThatThrownBy(() -> useCase.execute(IDEA_ID, USER_ID, CRITERIA_ID, 5))
				.isInstanceOf(ScoreIdeaUseCase.CriteriaMismatchException.class);
	}
}
