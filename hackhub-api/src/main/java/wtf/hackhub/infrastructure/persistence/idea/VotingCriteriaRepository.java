package wtf.hackhub.infrastructure.persistence.idea;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import wtf.hackhub.domain.VotingCriteria;

import java.util.List;
import java.util.UUID;

public interface VotingCriteriaRepository extends JpaRepository<VotingCriteria, UUID> {
	List<VotingCriteria> findAllByHackathonIdOrderByDisplayOrder(UUID hackathonId);

	@Query("SELECT COALESCE(SUM(v.weight), 0) FROM VotingCriteria v WHERE v.hackathonId = :hackathonId")
	int sumWeightsByHackathonId(UUID hackathonId);
}
