package wtf.hackhub.application.organization;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.UUID;

@Service
public class UpdateMemberRoleUseCase {

	private final OrganizationMemberRepository memberRepository;

	public UpdateMemberRoleUseCase(OrganizationMemberRepository memberRepository) {
		this.memberRepository = memberRepository;
	}

	@Transactional
	@PreAuthorize("hasRole('ADMIN') or @orgSecurity.isOrgOwnerOrManager(#organizationId, authentication)")
	public OrganizationMember execute(UUID organizationId, UUID targetUserId, OrganizationMember.Role newRole) {
		OrganizationMember member = memberRepository.findByOrganizationIdAndUserId(organizationId, targetUserId)
				.orElseThrow(() -> new MemberNotFoundException(organizationId, targetUserId));

		member.changeRole(newRole);
		return memberRepository.save(member);
	}

	public static class MemberNotFoundException extends RuntimeException {
		public MemberNotFoundException(UUID orgId, UUID userId) {
			super("Member not found in org " + orgId + ": " + userId);
		}
	}
}
