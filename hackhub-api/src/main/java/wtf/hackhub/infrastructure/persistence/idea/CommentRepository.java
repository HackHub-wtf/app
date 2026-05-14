package wtf.hackhub.infrastructure.persistence.idea;

import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.Comment;

import java.util.List;
import java.util.UUID;

public interface CommentRepository extends JpaRepository<Comment, UUID> {
	List<Comment> findByIdeaIdOrderByCreatedAtAsc(UUID ideaId);
}
