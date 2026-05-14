package wtf.hackhub.application.organization;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;

import java.util.UUID;

@Service
public class UpdateOrganizationSettingsUseCase {

	private final OrganizationRepository organizationRepository;
	private final OrganizationMemberRepository memberRepository;

	public UpdateOrganizationSettingsUseCase(OrganizationRepository organizationRepository,
			OrganizationMemberRepository memberRepository) {
		this.organizationRepository = organizationRepository;
		this.memberRepository = memberRepository;
	}

	@Transactional
	public Organization execute(UUID orgId, UUID requestingUserId, Organization.Visibility visibility,
			Organization.JoinPolicy joinPolicy) {
		Organization org = organizationRepository.findById(orgId)
				.orElseThrow(() -> new OrganizationNotFoundException(orgId));

		OrganizationMember member = memberRepository.findByOrganizationIdAndUserId(orgId, requestingUserId)
				.orElseThrow(() -> new NotOwnerException(requestingUserId, orgId));

		if (member.getRole() != OrganizationMember.Role.OWNER && member.getRole() != OrganizationMember.Role.MANAGER) {
			throw new NotOwnerException(requestingUserId, orgId);
		}

		org.updateSettings(visibility, joinPolicy);
		return organizationRepository.save(org);
	}

	public static class OrganizationNotFoundException extends RuntimeException {
		public OrganizationNotFoundException(UUID id) {
			super("Organization not found: " + id);
		}
	}

	public static class NotOwnerException extends RuntimeException {
		public NotOwnerException(UUID userId, UUID orgId) {
			super("User " + userId + " is not the owner of organization " + orgId);
		}
	}
}
