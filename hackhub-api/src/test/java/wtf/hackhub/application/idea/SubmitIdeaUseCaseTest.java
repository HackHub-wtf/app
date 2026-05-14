package wtf.hackhub.application.idea;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SubmitIdeaUseCaseTest {

	@Mock
	IdeaRepository ideaRepository;
	@InjectMocks
	SubmitIdeaUseCase useCase;

	static final UUID USER_ID = UUID.randomUUID();
	static final UUID HACKATHON_ID = UUID.randomUUID();

	static Idea idea(UUID creator) {
		return new Idea("title", "desc", HACKATHON_ID, null, creator, "AI");
	}

	@Test
	void submits_new_idea() {
		Idea saved = idea(USER_ID);
		when(ideaRepository.save(any())).thenReturn(saved);

		Idea result = useCase.execute("title", "desc", HACKATHON_ID, null, USER_ID, "AI", List.of("ml"));
		assertThat(result.getTitle()).isEqualTo("title");
	}

	@Test
	void update_changes_fields() {
		Idea existing = idea(USER_ID);
		when(ideaRepository.findById(any())).thenReturn(Optional.of(existing));
		when(ideaRepository.save(any())).thenReturn(existing);

		UUID id = UUID.randomUUID();
		useCase.update(id, USER_ID, "new title", "d", "AI", List.of(), Idea.Status.SUBMITTED, null, null, null);
		verify(ideaRepository).save(existing);
	}

	@Test
	void update_by_non_owner_throws() {
		Idea existing = idea(UUID.randomUUID()); // owned by different user
		when(ideaRepository.findById(any())).thenReturn(Optional.of(existing));

		assertThatThrownBy(() -> useCase.update(UUID.randomUUID(), USER_ID, "t", "d", "AI", List.of(),
				Idea.Status.DRAFT, null, null, null)).isInstanceOf(SubmitIdeaUseCase.IdeaAccessDeniedException.class);
	}

	@Test
	void delete_by_non_owner_throws() {
		Idea existing = idea(UUID.randomUUID());
		when(ideaRepository.findById(any())).thenReturn(Optional.of(existing));

		assertThatThrownBy(() -> useCase.delete(UUID.randomUUID(), USER_ID))
				.isInstanceOf(SubmitIdeaUseCase.IdeaAccessDeniedException.class);
	}

	@Test
	void delete_by_owner_succeeds() {
		Idea existing = idea(USER_ID);
		when(ideaRepository.findById(any())).thenReturn(Optional.of(existing));

		useCase.delete(existing.getId(), USER_ID);
		verify(ideaRepository).delete(existing);
	}
}
