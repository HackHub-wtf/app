package wtf.hackhub.application.organization;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.OrgInvitation;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.organization.OrgInvitationRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.List;
import java.util.UUID;

@Service
public class GetOrgInvitationsUseCase {

    private final OrgInvitationRepository invitationRepository;
    private final OrganizationMemberRepository memberRepository;

    public GetOrgInvitationsUseCase(OrgInvitationRepository invitationRepository,
            OrganizationMemberRepository memberRepository) {
        this.invitationRepository = invitationRepository;
        this.memberRepository = memberRepository;
    }

    @Transactional(readOnly = true)
    public List<OrgInvitation> getPending(UUID organizationId, UUID callerId) {
        OrganizationMember caller = memberRepository.findByOrganizationIdAndUserId(organizationId, callerId)
                .orElseThrow(NotAuthorizedToListException::new);

        OrganizationMember.Role callerRole = caller.getRole();
        if (callerRole != OrganizationMember.Role.OWNER && callerRole != OrganizationMember.Role.MANAGER) {
            throw new NotAuthorizedToListException();
        }

        return invitationRepository.findAllByOrganizationIdAndUsedAtIsNullAndRevokedAtIsNull(organizationId);
    }

    @Transactional(readOnly = true)
    public OrgInvitation preview(String token) {
        OrgInvitation inv = invitationRepository.findByToken(token)
                .orElseThrow(InvalidTokenException::new);

        if (!inv.isValid()) {
            throw new InvalidTokenException();
        }

        return inv;
    }

    public static class InvalidTokenException extends RuntimeException {
        public InvalidTokenException() {
            super("Invitation token is invalid, expired, or has been used.");
        }
    }

    public static class NotAuthorizedToListException extends RuntimeException {
        public NotAuthorizedToListException() {
            super("Caller is not an owner or manager of this organization.");
        }
    }
}
