package wtf.hackhub.application.idea;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Comment;
import wtf.hackhub.infrastructure.persistence.idea.CommentRepository;

import java.util.List;
import java.util.UUID;

@Service
public class CommentUseCase {

	private final CommentRepository commentRepository;

	public CommentUseCase(CommentRepository commentRepository) {
		this.commentRepository = commentRepository;
	}

	@Transactional
	public Comment add(UUID ideaId, UUID userId, String content) {
		return commentRepository.save(new Comment(ideaId, userId, content));
	}

	@Transactional(readOnly = true)
	public List<Comment> listForIdea(UUID ideaId) {
		return commentRepository.findByIdeaIdOrderByCreatedAtAsc(ideaId);
	}
}
