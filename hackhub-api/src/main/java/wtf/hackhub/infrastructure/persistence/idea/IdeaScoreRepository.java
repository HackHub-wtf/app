package wtf.hackhub.infrastructure.persistence.idea;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import wtf.hackhub.domain.IdeaScore;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface IdeaScoreRepository extends JpaRepository<IdeaScore, UUID> {
	Optional<IdeaScore> findByIdeaIdAndUserIdAndCriteriaId(UUID ideaId, UUID userId, UUID criteriaId);
	List<IdeaScore> findAllByIdeaId(UUID ideaId);

	@Query("""
			SELECT COALESCE(SUM(
			    (SELECT AVG(CAST(s2.score AS double)) FROM IdeaScore s2
			     WHERE s2.ideaId = :ideaId AND s2.criteriaId = vc.id)
			    * vc.weight / 100.0
			), 0)
			FROM VotingCriteria vc
			WHERE vc.hackathonId = :hackathonId
			""")
	BigDecimal calculateWeightedScore(UUID ideaId, UUID hackathonId);

	@Query("SELECT COUNT(DISTINCT s.userId) FROM IdeaScore s WHERE s.ideaId = :ideaId")
	int countDistinctVoters(UUID ideaId);
}
