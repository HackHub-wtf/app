package wtf.hackhub.application.idea;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.VotingCriteria;
import wtf.hackhub.infrastructure.persistence.idea.VotingCriteriaRepository;

import java.util.List;
import java.util.UUID;

@Service
public class ManageVotingCriteriaUseCase {

	private final VotingCriteriaRepository criteriaRepository;

	public ManageVotingCriteriaUseCase(VotingCriteriaRepository criteriaRepository) {
		this.criteriaRepository = criteriaRepository;
	}

	@Transactional(readOnly = true)
	public List<VotingCriteria> listForHackathon(UUID hackathonId) {
		return criteriaRepository.findAllByHackathonIdOrderByDisplayOrder(hackathonId);
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN') or @hackathonSecurity.isOwnerOrOrgManager(#hackathonId, authentication)")
	public VotingCriteria create(UUID hackathonId, String name, String description, int weight, int displayOrder) {
		validateWeight(hackathonId, weight, null);
		return criteriaRepository.save(new VotingCriteria(hackathonId, name, description, weight, displayOrder));
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN') or @hackathonSecurity.isOwnerOrOrgManager(#hackathonId, authentication)")
	public void delete(UUID hackathonId, UUID criteriaId) {
		criteriaRepository.deleteById(criteriaId);
	}

	/**
	 * Validates that adding/updating a criteria with the given weight won't push
	 * the total over 100 for the hackathon. excludeId is the criteria being updated
	 * (null for new).
	 */
	private void validateWeight(UUID hackathonId, int newWeight, UUID excludeId) {
		int existing = criteriaRepository.sumWeightsByHackathonId(hackathonId);
		// If updating, subtract the existing weight of the criteria being replaced
		if (excludeId != null) {
			existing -= criteriaRepository.findById(excludeId).map(VotingCriteria::getWeight).orElse(0);
		}
		if (existing + newWeight > 100) {
			throw new WeightExceedsLimitException(existing, newWeight);
		}
	}

	public static class WeightExceedsLimitException extends RuntimeException {
		public WeightExceedsLimitException(int current, int adding) {
			super("Total weight would exceed 100: current=" + current + ", adding=" + adding);
		}
	}
}
