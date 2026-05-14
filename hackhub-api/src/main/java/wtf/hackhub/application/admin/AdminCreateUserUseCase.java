package wtf.hackhub.application.admin;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.UUID;

@Service
public class AdminCreateUserUseCase {

	private final ProfileRepository profileRepository;
	private final OrganizationMemberRepository organizationMemberRepository;
	private final PasswordEncoder passwordEncoder;

	public AdminCreateUserUseCase(ProfileRepository profileRepository,
			OrganizationMemberRepository organizationMemberRepository, PasswordEncoder passwordEncoder) {
		this.profileRepository = profileRepository;
		this.organizationMemberRepository = organizationMemberRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
	@Transactional
	public Profile execute(String email, String name, String plainPassword, Profile.Role role, UUID organizationId,
			UUID callerUserId, boolean callerIsManager) {

		if (callerIsManager) {
			if (role == Profile.Role.ADMIN) {
				throw new AccessDeniedException("Managers cannot create admin users");
			}
			// Ignore caller-supplied org; resolve from the caller's own membership
			organizationId = organizationMemberRepository.findAllByUserId(callerUserId).stream()
					.filter(m -> m.getRole() == OrganizationMember.Role.OWNER
							|| m.getRole() == OrganizationMember.Role.MANAGER)
					.map(OrganizationMember::getOrganizationId).findFirst()
					.orElseThrow(() -> new CallerNotInOrganizationException(callerUserId));
		}

		if (profileRepository.existsByEmail(email)) {
			throw new EmailAlreadyRegisteredException(email);
		}

		String hash = passwordEncoder.encode(plainPassword);
		Profile profile = new Profile(email, name, hash);
		profile.changeRole(role != null ? role : Profile.Role.PARTICIPANT);
		profile = profileRepository.save(profile);

		if (organizationId != null) {
			OrganizationMember.Role memberRole = (profile.getRole() == Profile.Role.MANAGER)
					? OrganizationMember.Role.OWNER
					: OrganizationMember.Role.MEMBER;
			organizationMemberRepository.save(new OrganizationMember(organizationId, profile.getId(), memberRole));
			profile.assignOrganization(organizationId);
			profile = profileRepository.save(profile);
		}

		return profile;
	}

	public static class EmailAlreadyRegisteredException extends RuntimeException {
		public EmailAlreadyRegisteredException(String email) {
			super("Email already registered: " + email);
		}
	}

	public static class CallerNotInOrganizationException extends RuntimeException {
		public CallerNotInOrganizationException(UUID callerUserId) {
			super("Caller " + callerUserId + " is not an owner or manager of any organization");
		}
	}
}
