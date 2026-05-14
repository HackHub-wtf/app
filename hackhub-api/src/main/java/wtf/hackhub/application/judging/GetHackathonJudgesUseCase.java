package wtf.hackhub.application.judging;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.judging.HackathonJudgeRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class GetHackathonJudgesUseCase {

	private final HackathonJudgeRepository judgeRepository;
	private final ProfileRepository profileRepository;

	public GetHackathonJudgesUseCase(HackathonJudgeRepository judgeRepository, ProfileRepository profileRepository) {
		this.judgeRepository = judgeRepository;
		this.profileRepository = profileRepository;
	}

	@Transactional(readOnly = true)
	public List<JudgeEntry> execute(UUID hackathonId) {
		return judgeRepository.findAllByHackathonId(hackathonId).stream().map(judge -> {
			Profile profile = profileRepository.findById(judge.getUserId()).orElse(null);
			String name = profile != null ? profile.getName() : null;
			String email = profile != null ? profile.getEmail() : null;
			return new JudgeEntry(judge.getId(), judge.getHackathonId(), judge.getUserId(), name, email,
					judge.getInvitedBy(), judge.getInvitedAt());
		}).toList();
	}

	public record JudgeEntry(UUID id, UUID hackathonId, UUID userId, String name, String email, UUID invitedBy,
			Instant invitedAt) {
	}
}
