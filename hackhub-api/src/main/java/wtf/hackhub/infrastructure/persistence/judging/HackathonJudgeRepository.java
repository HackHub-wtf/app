package wtf.hackhub.infrastructure.persistence.judging;

import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.HackathonJudge;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface HackathonJudgeRepository extends JpaRepository<HackathonJudge, UUID> {
	List<HackathonJudge> findAllByHackathonId(UUID hackathonId);
	Optional<HackathonJudge> findByHackathonIdAndUserId(UUID hackathonId, UUID userId);
	boolean existsByHackathonIdAndUserId(UUID hackathonId, UUID userId);
	void deleteByHackathonIdAndUserId(UUID hackathonId, UUID userId);
}
