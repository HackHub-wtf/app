package wtf.hackhub.presentation.organization;

import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.domain.Profile;

import java.time.Instant;
import java.util.UUID;

public record MemberResponse(UUID id, UUID organizationId, UUID userId, String name, String email, String role,
		Instant joinedAt) {

	public static MemberResponse from(OrganizationMember m, Profile profile) {
		return new MemberResponse(m.getId(), m.getOrganizationId(), m.getUserId(),
				profile != null ? profile.getName() : null, profile != null ? profile.getEmail() : null,
				m.getRole().toDbValue(), m.getJoinedAt());
	}

	public static MemberResponse from(OrganizationMember m) {
		return new MemberResponse(m.getId(), m.getOrganizationId(), m.getUserId(), null, null, m.getRole().toDbValue(),
				m.getJoinedAt());
	}
}
