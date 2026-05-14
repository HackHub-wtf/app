package wtf.hackhub.application.organization;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.OrgInvitation;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrgInvitationRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.UUID;

@Service
public class AcceptOrgInvitationUseCase {

    private final OrgInvitationRepository invitationRepository;
    private final OrganizationMemberRepository memberRepository;
    private final ProfileRepository profileRepository;

    public AcceptOrgInvitationUseCase(OrgInvitationRepository invitationRepository,
            OrganizationMemberRepository memberRepository, ProfileRepository profileRepository) {
        this.invitationRepository = invitationRepository;
        this.memberRepository = memberRepository;
        this.profileRepository = profileRepository;
    }

    @Transactional
    public OrganizationMember execute(String token, UUID userId) {
        OrgInvitation invitation = invitationRepository.findByToken(token)
                .orElseThrow(InvalidInvitationTokenException::new);

        if (invitation.isRevoked()) {
            throw new InvalidInvitationTokenException();
        }

        if (invitation.isUsed()) {
            throw new InvalidInvitationTokenException();
        }

        if (invitation.isExpired()) {
            throw new InvitationExpiredException();
        }

        if (memberRepository.existsByOrganizationIdAndUserId(invitation.getOrganizationId(), userId)) {
            throw new JoinOrganizationUseCase.AlreadyMemberException(userId, invitation.getOrganizationId());
        }

        invitation.markUsed();
        invitationRepository.save(invitation);

        OrganizationMember member = memberRepository
                .save(new OrganizationMember(invitation.getOrganizationId(), userId, invitation.getInvitedRole()));

        profileRepository.findById(userId).ifPresent(profile -> {
            profile.assignOrganization(invitation.getOrganizationId());
            profileRepository.save(profile);
        });

        return member;
    }

    public static class InvalidInvitationTokenException extends RuntimeException {
        public InvalidInvitationTokenException() {
            super("Invitation token is invalid, revoked, or has already been used.");
        }
    }

    public static class InvitationExpiredException extends RuntimeException {
        public InvitationExpiredException() {
            super("Invitation token has expired.");
        }
    }
}
