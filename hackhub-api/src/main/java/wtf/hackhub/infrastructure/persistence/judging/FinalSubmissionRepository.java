package wtf.hackhub.infrastructure.persistence.judging;

import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.FinalSubmission;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FinalSubmissionRepository extends JpaRepository<FinalSubmission, UUID> {
	Optional<FinalSubmission> findByHackathonIdAndTeamId(UUID hackathonId, UUID teamId);
	List<FinalSubmission> findAllByHackathonId(UUID hackathonId);
}
