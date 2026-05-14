package wtf.hackhub.infrastructure.persistence.team;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import wtf.hackhub.domain.TeamMember;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface TeamMemberRepository extends JpaRepository<TeamMember, UUID> {
	List<TeamMember> findAllByTeamId(UUID teamId);
	Optional<TeamMember> findByTeamIdAndUserId(UUID teamId, UUID userId);
	boolean existsByTeamIdAndUserId(UUID teamId, UUID userId);
	List<TeamMember> findAllByUserId(UUID userId);
	void deleteAllByTeamId(UUID teamId);

	@Query("SELECT COUNT(tm) > 0 FROM TeamMember tm JOIN Team t ON tm.teamId = t.id WHERE t.hackathonId = :hackathonId AND tm.userId = :userId")
	boolean existsByHackathonIdAndUserId(@Param("hackathonId") UUID hackathonId, @Param("userId") UUID userId);
}
