package wtf.hackhub.application.organization;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.OrgInvitation;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.organization.OrgInvitationRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class CreateOrgInvitationUseCase {

	private static final int TOKEN_BYTES = 32; // 32 bytes → 64 hex chars = 256-bit entropy
	private static final int EXPIRY_DAYS = 7;

	private final OrgInvitationRepository invitationRepository;
	private final OrganizationRepository organizationRepository;
	private final OrganizationMemberRepository memberRepository;
	private final SecureRandom secureRandom;

	public CreateOrgInvitationUseCase(OrgInvitationRepository invitationRepository,
			OrganizationRepository organizationRepository, OrganizationMemberRepository memberRepository) {
		this.invitationRepository = invitationRepository;
		this.organizationRepository = organizationRepository;
		this.memberRepository = memberRepository;
		this.secureRandom = new SecureRandom();
	}

	@Transactional
	public OrgInvitation execute(UUID organizationId, UUID callerId, OrganizationMember.Role invitedRole,
			String invitedEmail) {
		organizationRepository.findById(organizationId)
				.orElseThrow(() -> new OrganizationNotFoundException(organizationId));

		OrganizationMember caller = memberRepository.findByOrganizationIdAndUserId(organizationId, callerId)
				.orElseThrow(NotAuthorizedToInviteException::new);

		OrganizationMember.Role callerRole = caller.getRole();

		if (callerRole != OrganizationMember.Role.OWNER && callerRole != OrganizationMember.Role.MANAGER) {
			throw new NotAuthorizedToInviteException();
		}

		// Role escalation guard: MANAGER can only invite MEMBER or JUDGE
		if (callerRole == OrganizationMember.Role.MANAGER) {
			if (invitedRole == OrganizationMember.Role.OWNER || invitedRole == OrganizationMember.Role.MANAGER) {
				throw new RoleEscalationException(callerRole, invitedRole);
			}
		}

		String token = generateUniqueToken();
		Instant expiresAt = Instant.now().plus(EXPIRY_DAYS, ChronoUnit.DAYS);

		OrgInvitation invitation = new OrgInvitation(organizationId, callerId, token, expiresAt, invitedRole,
				invitedEmail);
		return invitationRepository.save(invitation);
	}

	private String generateUniqueToken() {
		String token;
		do {
			byte[] bytes = new byte[TOKEN_BYTES];
			secureRandom.nextBytes(bytes);
			token = HexFormat.of().withUpperCase().formatHex(bytes);
		} while (invitationRepository.existsByToken(token));
		return token;
	}

	public static class OrganizationNotFoundException extends RuntimeException {
		public OrganizationNotFoundException(UUID id) {
			super("Organization not found: " + id);
		}
	}

	public static class NotAuthorizedToInviteException extends RuntimeException {
		public NotAuthorizedToInviteException() {
			super("Caller is not an owner or manager of this organization.");
		}
	}

	public static class RoleEscalationException extends RuntimeException {
		public RoleEscalationException(OrganizationMember.Role callerRole, OrganizationMember.Role targetRole) {
			super("A " + callerRole.toDbValue() + " cannot invite a " + targetRole.toDbValue() + ".");
		}
	}
}
