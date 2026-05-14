package wtf.hackhub.application.organization;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;

import java.util.UUID;

@Service
public class CreateOrganizationUseCase {

	private final OrganizationRepository organizationRepository;
	private final OrganizationMemberRepository memberRepository;
	private final ProfileRepository profileRepository;

	public CreateOrganizationUseCase(OrganizationRepository organizationRepository,
			OrganizationMemberRepository memberRepository, ProfileRepository profileRepository) {
		this.organizationRepository = organizationRepository;
		this.memberRepository = memberRepository;
		this.profileRepository = profileRepository;
	}

	@Transactional
	public Organization execute(String name, String slug, UUID createdByUserId) {
		if (organizationRepository.existsBySlug(slug)) {
			throw new SlugAlreadyTakenException(slug);
		}
		// Verify the creating user exists
		profileRepository.findById(createdByUserId)
				.orElseThrow(() -> new IllegalArgumentException("User not found: " + createdByUserId));

		Organization org = organizationRepository.save(new Organization(name, slug, createdByUserId));

		// Creator is automatically the owner
		memberRepository.save(new OrganizationMember(org.getId(), createdByUserId, OrganizationMember.Role.OWNER));

		// Link profile to org
		profileRepository.findById(createdByUserId).ifPresent(profile -> {
			profile.assignOrganization(org.getId());
			profileRepository.save(profile);
		});

		return org;
	}

	public static class SlugAlreadyTakenException extends RuntimeException {
		public SlugAlreadyTakenException(String slug) {
			super("Organization slug already taken: " + slug);
		}
	}
}
