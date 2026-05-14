package wtf.hackhub.application.idea;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Comment;
import wtf.hackhub.infrastructure.persistence.idea.CommentRepository;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CommentUseCaseTest {

	@Mock
	CommentRepository commentRepository;
	@InjectMocks
	CommentUseCase useCase;

	@Test
	void adds_comment() {
		UUID ideaId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		Comment c = new Comment(ideaId, userId, "great idea");
		when(commentRepository.save(any())).thenReturn(c);

		Comment result = useCase.add(ideaId, userId, "great idea");
		assertThat(result.getContent()).isEqualTo("great idea");
	}

	@Test
	void lists_comments_for_idea() {
		UUID ideaId = UUID.randomUUID();
		when(commentRepository.findByIdeaIdOrderByCreatedAtAsc(ideaId))
				.thenReturn(List.of(new Comment(ideaId, UUID.randomUUID(), "first")));

		List<Comment> comments = useCase.listForIdea(ideaId);
		assertThat(comments).hasSize(1);
	}
}
