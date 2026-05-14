package wtf.hackhub.presentation.organization;

import wtf.hackhub.domain.Organization;

import java.time.Instant;
import java.util.UUID;

public record OrgResponse(UUID id, String name, String slug, String description, String logoUrl, String websiteUrl,
		String visibility, String joinPolicy, Instant createdAt) {
	public static OrgResponse from(Organization o) {
		return new OrgResponse(o.getId(), o.getName(), o.getSlug(), o.getDescription(), o.getLogoUrl(),
				o.getWebsiteUrl(), o.getVisibility().toDbValue(), o.getJoinPolicy().toDbValue(), o.getCreatedAt());
	}
}
