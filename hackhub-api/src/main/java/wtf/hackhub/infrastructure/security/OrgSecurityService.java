package wtf.hackhub.infrastructure.security;

import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.UUID;

/**
 * Spring Security SpEL helper bean used in @PreAuthorize expressions.
 * Referenced as @orgSecurity in annotations.
 */
@Service("orgSecurity")
public class OrgSecurityService {

	private final OrganizationMemberRepository memberRepository;

	public OrgSecurityService(OrganizationMemberRepository memberRepository) {
		this.memberRepository = memberRepository;
	}

	public boolean isOrgOwnerOrManager(UUID organizationId, Authentication auth) {
		UUID userId = (UUID) auth.getPrincipal();
		return memberRepository.findByOrganizationIdAndUserId(organizationId, userId).map(
				m -> m.getRole() == OrganizationMember.Role.OWNER || m.getRole() == OrganizationMember.Role.MANAGER)
				.orElse(false);
	}

	public boolean isOrgMember(UUID organizationId, Authentication auth) {
		UUID userId = (UUID) auth.getPrincipal();
		return memberRepository.existsByOrganizationIdAndUserId(organizationId, userId);
	}
}
