package wtf.hackhub.application.organization;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.Organization.JoinPolicy;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;

import java.util.UUID;

@Service
public class JoinOrganizationUseCase {

	private final OrganizationRepository organizationRepository;
	private final OrganizationMemberRepository memberRepository;
	private final ProfileRepository profileRepository;

	public JoinOrganizationUseCase(OrganizationRepository organizationRepository,
			OrganizationMemberRepository memberRepository, ProfileRepository profileRepository) {
		this.organizationRepository = organizationRepository;
		this.memberRepository = memberRepository;
		this.profileRepository = profileRepository;
	}

	@Transactional
	public OrganizationMember execute(String slug, UUID userId) {
		Organization org = organizationRepository.findBySlug(slug)
				.orElseThrow(() -> new OrganizationNotFoundException(slug));

		if (org.getJoinPolicy() == Organization.JoinPolicy.INVITE_ONLY) {
			throw new JoinNotAllowedException(org.getId());
		}

		if (memberRepository.existsByOrganizationIdAndUserId(org.getId(), userId)) {
			throw new AlreadyMemberException(userId, org.getId());
		}

		OrganizationMember member = memberRepository
				.save(new OrganizationMember(org.getId(), userId, OrganizationMember.Role.MEMBER));

		profileRepository.findById(userId).ifPresent(profile -> {
			profile.assignOrganization(org.getId());
			profileRepository.save(profile);
		});

		return member;
	}

	public static class OrganizationNotFoundException extends RuntimeException {
		public OrganizationNotFoundException(String slug) {
			super("Organization not found: " + slug);
		}
	}

	public static class JoinNotAllowedException extends RuntimeException {
		public JoinNotAllowedException(UUID orgId) {
			super("Organization " + orgId + " requires an invitation to join");
		}
	}

	public static class AlreadyMemberException extends RuntimeException {
		public AlreadyMemberException(UUID userId, UUID orgId) {
			super("User " + userId + " is already a member of organization " + orgId);
		}
	}
}
