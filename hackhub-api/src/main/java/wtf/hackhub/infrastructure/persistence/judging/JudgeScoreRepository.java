package wtf.hackhub.infrastructure.persistence.judging;

import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.JudgeScore;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface JudgeScoreRepository extends JpaRepository<JudgeScore, UUID> {
	List<JudgeScore> findAllByHackathonIdAndJudgeId(UUID hackathonId, UUID judgeId);
	List<JudgeScore> findAllByHackathonId(UUID hackathonId);
	List<JudgeScore> findAllByIdeaId(UUID ideaId);
	Optional<JudgeScore> findByIdeaIdAndJudgeIdAndCriterionId(UUID ideaId, UUID judgeId, UUID criterionId);
	void deleteByIdeaIdAndJudgeIdAndCriterionId(UUID ideaId, UUID judgeId, UUID criterionId);
}
