package wtf.hackhub.infrastructure.persistence.idea;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.Idea;

import java.util.List;
import java.util.UUID;

public interface IdeaRepository extends JpaRepository<Idea, UUID> {
	Page<Idea> findByHackathonIdOrderByCreatedAtDesc(UUID hackathonId, Pageable pageable);
	List<Idea> findAllByHackathonId(UUID hackathonId);
}
