package wtf.hackhub.infrastructure.persistence.idea;

import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.IdeaVote;

import java.util.Optional;
import java.util.UUID;

public interface IdeaVoteRepository extends JpaRepository<IdeaVote, UUID> {
	Optional<IdeaVote> findByIdeaIdAndUserId(UUID ideaId, UUID userId);
	boolean existsByIdeaIdAndUserId(UUID ideaId, UUID userId);
	long countByIdeaId(UUID ideaId);
}
