package wtf.hackhub.application.idea;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.infrastructure.persistence.idea.IdeaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetIdeasUseCaseTest {

	@Mock
	IdeaRepository ideaRepository;
	@InjectMocks
	GetIdeasUseCase useCase;

	static final UUID HACKATHON_ID = UUID.randomUUID();

	static Idea idea() {
		return new Idea("t", "d", HACKATHON_ID, null, UUID.randomUUID(), "AI");
	}

	@Test
	void list_by_hackathon_returns_page() {
		when(ideaRepository.findByHackathonIdOrderByCreatedAtDesc(eq(HACKATHON_ID), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(idea(), idea())));

		var page = useCase.listByHackathon(HACKATHON_ID, Pageable.unpaged());
		assertThat(page.getTotalElements()).isEqualTo(2);
	}

	@Test
	void get_by_id_found() {
		UUID id = UUID.randomUUID();
		Idea idea = idea();
		when(ideaRepository.findById(id)).thenReturn(Optional.of(idea));

		assertThat(useCase.getById(id)).isSameAs(idea);
	}

	@Test
	void get_by_id_not_found_throws() {
		UUID id = UUID.randomUUID();
		when(ideaRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> useCase.getById(id)).isInstanceOf(VoteIdeaUseCase.IdeaNotFoundException.class);
	}
}
