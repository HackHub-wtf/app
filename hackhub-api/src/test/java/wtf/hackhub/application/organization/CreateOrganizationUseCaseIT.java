package wtf.hackhub.application.organization;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;
import wtf.hackhub.support.PostgresIntegrationTest;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class CreateOrganizationUseCaseIT extends PostgresIntegrationTest {

	@Autowired
	CreateOrganizationUseCase useCase;
	@Autowired
	OrganizationRepository orgRepo;
	@Autowired
	OrganizationMemberRepository memberRepo;

	@Test
	void creates_org_and_assigns_creator_as_owner() {
		String userId = insertProfile("admin@test.com", "Admin", "admin");

		Organization org = useCase.execute("Acme Corp", "acme-corp", UUID.fromString(userId));

		assertThat(org.getId()).isNotNull();
		assertThat(org.getSlug()).isEqualTo("acme-corp");

		List<OrganizationMember> members = memberRepo.findAllByOrganizationId(org.getId());
		assertThat(members).hasSize(1);
		assertThat(members.get(0).getRole()).isEqualTo(OrganizationMember.Role.OWNER);
		assertThat(members.get(0).getUserId()).isEqualTo(UUID.fromString(userId));
	}

	@Test
	void rejects_duplicate_slug() {
		String userId = insertProfile("user@test.com", "User", "manager");
		useCase.execute("First Org", "my-org", UUID.fromString(userId));

		String userId2 = insertProfile("user2@test.com", "User2", "manager");
		assertThatThrownBy(() -> useCase.execute("Second Org", "my-org", UUID.fromString(userId2)))
				.isInstanceOf(CreateOrganizationUseCase.SlugAlreadyTakenException.class);
	}

	@Test
	void links_profile_to_organization() {
		String userId = insertProfile("link@test.com", "Link", "participant");
		Organization org = useCase.execute("Linked Corp", "linked-corp", UUID.fromString(userId));

		String orgId = jdbc.queryForObject("SELECT organization_id::text FROM profiles WHERE id = ?::uuid",
				String.class, userId);
		assertThat(orgId).isEqualTo(org.getId().toString());
	}
}
