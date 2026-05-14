package wtf.hackhub.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "org_invitations")
public class OrgInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "organization_id", nullable = false)
    private UUID organizationId;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(nullable = false, unique = true, length = 64)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    @Column(name = "used_at")
    private Instant usedAt;

    @Column(name = "invited_role", nullable = false)
    @Convert(converter = OrganizationMember.Role.RoleConverter.class)
    private OrganizationMember.Role invitedRole = OrganizationMember.Role.MEMBER;

    @Column(name = "invited_email")
    private String invitedEmail;

    @Column(name = "revoked_at")
    private Instant revokedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected OrgInvitation() {
    }

    public OrgInvitation(UUID organizationId, UUID createdBy, String token, Instant expiresAt,
                         OrganizationMember.Role invitedRole, String invitedEmail) {
        this.organizationId = organizationId;
        this.createdBy = createdBy;
        this.token = token;
        this.expiresAt = expiresAt;
        this.invitedRole = invitedRole != null ? invitedRole : OrganizationMember.Role.MEMBER;
        this.invitedEmail = invitedEmail;
    }

    public void markUsed() {
        this.usedAt = Instant.now();
    }

    public boolean isExpired() {
        return Instant.now().isAfter(expiresAt);
    }

    public boolean isUsed() {
        return usedAt != null;
    }

    public boolean isRevoked() {
        return revokedAt != null;
    }

    public void revoke() {
        this.revokedAt = Instant.now();
    }

    public boolean isValid() {
        return !isUsed() && !isExpired() && !isRevoked();
    }

    public UUID getId() {
        return id;
    }

    public UUID getOrganizationId() {
        return organizationId;
    }

    public UUID getCreatedBy() {
        return createdBy;
    }

    public String getToken() {
        return token;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public Instant getUsedAt() {
        return usedAt;
    }

    public OrganizationMember.Role getInvitedRole() {
        return invitedRole;
    }

    public String getInvitedEmail() {
        return invitedEmail;
    }

    public Instant getRevokedAt() {
        return revokedAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
