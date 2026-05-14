package wtf.hackhub.application.organization;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.OrgInvitation;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.organization.OrgInvitationRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.UUID;

@Service
public class RevokeOrgInvitationUseCase {

    private final OrgInvitationRepository invitationRepository;
    private final OrganizationMemberRepository memberRepository;

    public RevokeOrgInvitationUseCase(OrgInvitationRepository invitationRepository,
            OrganizationMemberRepository memberRepository) {
        this.invitationRepository = invitationRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional
    public void execute(UUID organizationId, UUID invitationId, UUID callerId) {
        OrgInvitation invitation = invitationRepository.findById(invitationId)
                .orElseThrow(InvitationNotFoundException::new);

        if (!invitation.getOrganizationId().equals(organizationId)) {
            throw new InvitationNotFoundException();
        }

        OrganizationMember caller = memberRepository.findByOrganizationIdAndUserId(organizationId, callerId)
                .orElseThrow(NotAuthorizedToRevokeException::new);

        OrganizationMember.Role callerRole = caller.getRole();
        if (callerRole != OrganizationMember.Role.OWNER && callerRole != OrganizationMember.Role.MANAGER) {
            throw new NotAuthorizedToRevokeException();
        }

        if (invitation.isUsed() || invitation.isRevoked()) {
            throw new InvitationAlreadyProcessedException();
        }

        invitation.revoke();
        invitationRepository.save(invitation);
    }

    public static class InvitationNotFoundException extends RuntimeException {
        public InvitationNotFoundException() {
            super("Invitation not found.");
        }
    }

    public static class NotAuthorizedToRevokeException extends RuntimeException {
        public NotAuthorizedToRevokeException() {
            super("Caller is not an owner or manager of this organization.");
        }
    }

    public static class InvitationAlreadyProcessedException extends RuntimeException {
        public InvitationAlreadyProcessedException() {
            super("Invitation has already been used or revoked.");
        }
    }
}
