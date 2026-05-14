package wtf.hackhub.application.judging;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.HackathonJudge;
import wtf.hackhub.infrastructure.persistence.judging.HackathonJudgeRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;

import java.util.UUID;

@Service
public class InviteJudgeUseCase {

	private final HackathonJudgeRepository judgeRepository;
	private final HackathonRepository hackathonRepository;
	private final OrganizationMemberRepository memberRepository;

	public InviteJudgeUseCase(HackathonJudgeRepository judgeRepository, HackathonRepository hackathonRepository,
			OrganizationMemberRepository memberRepository) {
		this.judgeRepository = judgeRepository;
		this.hackathonRepository = hackathonRepository;
		this.memberRepository = memberRepository;
	}

	@Transactional
	public HackathonJudge execute(UUID hackathonId, UUID targetUserId, UUID invitedBy) {
		var hackathon = hackathonRepository.findById(hackathonId)
				.orElseThrow(() -> new HackathonNotFoundException(hackathonId));

		if (hackathon.getOrganizationId() != null) {
			boolean inviterIsManager = memberRepository
					.findByOrganizationIdAndUserId(hackathon.getOrganizationId(), invitedBy)
					.map(m -> m.getRole() == wtf.hackhub.domain.OrganizationMember.Role.OWNER
							|| m.getRole() == wtf.hackhub.domain.OrganizationMember.Role.MANAGER)
					.orElse(false);
			if (!inviterIsManager) {
				throw new NotAuthorizedToInviteException(invitedBy);
			}

			boolean targetIsMember = memberRepository.existsByOrganizationIdAndUserId(hackathon.getOrganizationId(),
					targetUserId);
			if (!targetIsMember) {
				throw new TargetNotOrgMemberException(targetUserId);
			}
		}

		if (judgeRepository.existsByHackathonIdAndUserId(hackathonId, targetUserId)) {
			return judgeRepository.findByHackathonIdAndUserId(hackathonId, targetUserId).orElseThrow();
		}

		return judgeRepository.save(new HackathonJudge(hackathonId, targetUserId, invitedBy));
	}

	public static class HackathonNotFoundException extends RuntimeException {
		public HackathonNotFoundException(UUID id) {
			super("Hackathon not found: " + id);
		}
	}

	public static class NotAuthorizedToInviteException extends RuntimeException {
		public NotAuthorizedToInviteException(UUID userId) {
			super("User " + userId + " is not authorized to invite judges");
		}
	}

	public static class TargetNotOrgMemberException extends RuntimeException {
		public TargetNotOrgMemberException(UUID userId) {
			super("Target user " + userId + " is not a member of this organization");
		}
	}
}
