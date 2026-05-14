package wtf.hackhub.infrastructure.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.judging.HackathonJudgeRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.UUID;

@Service("hackathonSecurity")
public class HackathonSecurityService {

	private final HackathonRepository hackathonRepository;
	private final OrganizationMemberRepository memberRepository;
	private final HackathonJudgeRepository judgeRepository;

	public HackathonSecurityService(HackathonRepository hackathonRepository,
			OrganizationMemberRepository memberRepository, HackathonJudgeRepository judgeRepository) {
		this.hackathonRepository = hackathonRepository;
		this.memberRepository = memberRepository;
		this.judgeRepository = judgeRepository;
	}

	/**
	 * True if the caller is the hackathon creator OR an owner/manager of the
	 * hackathon's owning org. Used for write operations that platform admins can
	 * always perform via the ADMIN role check, while managers need this.
	 */
	public boolean isOwnerOrOrgManager(UUID hackathonId, Authentication auth) {
		UUID userId = (UUID) auth.getPrincipal();
		return hackathonRepository.findById(hackathonId).map(h -> {
			if (h.getCreatedBy().equals(userId))
				return true;
			if (h.getOrganizationId() == null)
				return false;
			return memberRepository.findByOrganizationIdAndUserId(h.getOrganizationId(), userId).map(
					m -> m.getRole() == OrganizationMember.Role.OWNER || m.getRole() == OrganizationMember.Role.MANAGER)
					.orElse(false);
		}).orElse(false);
	}

	/**
	 * True if the caller is an assigned judge OR an owner/manager of the
	 * hackathon's owning org. Used for scoring endpoints.
	 */
	public boolean isJudgeOrOrgManager(UUID hackathonId, Authentication auth) {
		UUID userId = (UUID) auth.getPrincipal();
		if (judgeRepository.existsByHackathonIdAndUserId(hackathonId, userId)) {
			return true;
		}
		return hackathonRepository.findById(hackathonId).map(h -> {
			if (h.getOrganizationId() == null)
				return false;
			return memberRepository.findByOrganizationIdAndUserId(h.getOrganizationId(), userId).map(
					m -> m.getRole() == OrganizationMember.Role.OWNER || m.getRole() == OrganizationMember.Role.MANAGER)
					.orElse(false);
		}).orElse(false);
	}
}
