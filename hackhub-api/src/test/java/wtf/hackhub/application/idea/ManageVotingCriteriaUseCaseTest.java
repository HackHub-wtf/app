package wtf.hackhub.application.idea;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.VotingCriteria;
import wtf.hackhub.infrastructure.persistence.idea.VotingCriteriaRepository;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ManageVotingCriteriaUseCaseTest {

	@Mock
	VotingCriteriaRepository criteriaRepository;
	@InjectMocks
	ManageVotingCriteriaUseCase useCase;

	@Test
	void creates_criteria_when_weight_within_limit() {
		UUID hackathonId = UUID.randomUUID();
		when(criteriaRepository.sumWeightsByHackathonId(hackathonId)).thenReturn(60);
		when(criteriaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		useCase.create(hackathonId, "Innovation", "How innovative", 40, 1);

		verify(criteriaRepository).save(any(VotingCriteria.class));
	}

	@Test
	void rejects_criteria_when_weight_would_exceed_100() {
		UUID hackathonId = UUID.randomUUID();
		when(criteriaRepository.sumWeightsByHackathonId(hackathonId)).thenReturn(70);

		assertThatThrownBy(() -> useCase.create(hackathonId, "Extra", "desc", 40, 2))
				.isInstanceOf(ManageVotingCriteriaUseCase.WeightExceedsLimitException.class);

		verify(criteriaRepository, never()).save(any());
	}

	@Test
	void allows_criteria_that_hits_exactly_100() {
		UUID hackathonId = UUID.randomUUID();
		when(criteriaRepository.sumWeightsByHackathonId(hackathonId)).thenReturn(60);
		when(criteriaRepository.save(any())).thenAnswer(i -> i.getArgument(0));

		useCase.create(hackathonId, "Feasibility", "desc", 40, 2);

		verify(criteriaRepository).save(any());
	}
}
