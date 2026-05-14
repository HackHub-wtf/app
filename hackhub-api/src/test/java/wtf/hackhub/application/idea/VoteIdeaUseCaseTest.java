package wtf.hackhub.application.idea;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.domain.IdeaVote;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;
import wtf.hackhub.infrastructure.persistence.idea.IdeaVoteRepository;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VoteIdeaUseCaseTest {

	@Mock
	IdeaRepository ideaRepository;
	@Mock
	IdeaVoteRepository voteRepository;
	@InjectMocks
	VoteIdeaUseCase useCase;

	private Idea idea(UUID id) {
		return new Idea("Title", "Desc", UUID.randomUUID(), null, UUID.randomUUID(), "tech");
	}

	@Test
	void voting_creates_new_vote_and_returns_voted_true() {
		UUID ideaId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();

		when(ideaRepository.findById(ideaId)).thenReturn(Optional.of(idea(ideaId)));
		when(voteRepository.findByIdeaIdAndUserId(ideaId, userId)).thenReturn(Optional.empty());
		when(voteRepository.save(any())).thenAnswer(i -> i.getArgument(0));
		when(voteRepository.countByIdeaId(ideaId)).thenReturn(1L);

		VoteIdeaUseCase.Result result = useCase.execute(ideaId, userId);

		assertThat(result.voted()).isTrue();
		assertThat(result.voteCount()).isEqualTo(1L);
		verify(voteRepository).save(any(IdeaVote.class));
		verify(voteRepository, never()).delete(any());
	}

	@Test
	void voting_again_removes_vote_and_returns_voted_false() {
		UUID ideaId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		IdeaVote existing = new IdeaVote(ideaId, userId);

		when(ideaRepository.findById(ideaId)).thenReturn(Optional.of(idea(ideaId)));
		when(voteRepository.findByIdeaIdAndUserId(ideaId, userId)).thenReturn(Optional.of(existing));
		when(voteRepository.countByIdeaId(ideaId)).thenReturn(0L);

		VoteIdeaUseCase.Result result = useCase.execute(ideaId, userId);

		assertThat(result.voted()).isFalse();
		assertThat(result.voteCount()).isEqualTo(0L);
		verify(voteRepository).delete(existing);
		verify(voteRepository, never()).save(any());
	}

	@Test
	void throws_not_found_for_unknown_idea() {
		when(ideaRepository.findById(any())).thenReturn(Optional.empty());
		assertThatThrownBy(() -> useCase.execute(UUID.randomUUID(), UUID.randomUUID()))
				.isInstanceOf(VoteIdeaUseCase.IdeaNotFoundException.class);
	}
}
