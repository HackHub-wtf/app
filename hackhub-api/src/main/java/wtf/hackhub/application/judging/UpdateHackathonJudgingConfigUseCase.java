package wtf.hackhub.application.judging;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;

import java.util.UUID;

@Service
public class UpdateHackathonJudgingConfigUseCase {

	private final HackathonRepository hackathonRepository;

	public UpdateHackathonJudgingConfigUseCase(HackathonRepository hackathonRepository) {
		this.hackathonRepository = hackathonRepository;
	}

	@Transactional
	public Hackathon execute(UUID hackathonId, Hackathon.Visibility visibility, Hackathon.JoinPolicy joinPolicy,
			Hackathon.JudgingMode judgingMode, int panelWeight) {
		Hackathon hackathon = hackathonRepository.findById(hackathonId)
				.orElseThrow(() -> new HackathonNotFoundException(hackathonId));

		if (panelWeight < 0 || panelWeight > 100) {
			throw new InvalidPanelWeightException(panelWeight);
		}

		hackathon.updateJudgingConfig(visibility, joinPolicy, judgingMode, panelWeight);
		return hackathonRepository.save(hackathon);
	}

	@Transactional
	public Hackathon executePartial(UUID hackathonId, Hackathon.Visibility visibility, Hackathon.JoinPolicy joinPolicy,
			Hackathon.JudgingMode judgingMode, Integer panelWeight) {
		Hackathon hackathon = hackathonRepository.findById(hackathonId)
				.orElseThrow(() -> new HackathonNotFoundException(hackathonId));

		Hackathon.Visibility effectiveVisibility = visibility != null ? visibility : hackathon.getVisibility();
		Hackathon.JoinPolicy effectiveJoinPolicy = joinPolicy != null ? joinPolicy : hackathon.getJoinPolicy();
		Hackathon.JudgingMode effectiveMode = judgingMode != null ? judgingMode : hackathon.getJudgingMode();
		int effectiveWeight = panelWeight != null ? panelWeight : hackathon.getPanelWeight();

		if (effectiveWeight < 0 || effectiveWeight > 100) {
			throw new InvalidPanelWeightException(effectiveWeight);
		}

		hackathon.updateJudgingConfig(effectiveVisibility, effectiveJoinPolicy, effectiveMode, effectiveWeight);
		return hackathonRepository.save(hackathon);
	}

	public static class HackathonNotFoundException extends RuntimeException {
		public HackathonNotFoundException(UUID id) {
			super("Hackathon not found: " + id);
		}
	}

	public static class InvalidPanelWeightException extends RuntimeException {
		public InvalidPanelWeightException(int weight) {
			super("Panel weight must be between 0 and 100, got: " + weight);
		}
	}
}
