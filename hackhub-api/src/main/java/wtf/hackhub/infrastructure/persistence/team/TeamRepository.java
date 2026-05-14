package wtf.hackhub.infrastructure.persistence.team;

import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.Team;

import java.util.List;
import java.util.UUID;

public interface TeamRepository extends JpaRepository<Team, UUID> {
	List<Team> findAllByHackathonId(UUID hackathonId);
	boolean existsByNameAndHackathonId(String name, UUID hackathonId);
}
