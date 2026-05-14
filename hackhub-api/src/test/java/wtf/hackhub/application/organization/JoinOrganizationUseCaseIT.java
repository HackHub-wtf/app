package wtf.hackhub.application.organization;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.support.PostgresIntegrationTest;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JoinOrganizationUseCaseIT extends PostgresIntegrationTest {

	@Autowired
	CreateOrganizationUseCase createUseCase;
	@Autowired
	JoinOrganizationUseCase joinUseCase;

	@Test
	void joining_adds_member_with_member_role() {
		String ownerId = insertProfile("owner@test.com", "Owner", "manager");
		String joinerId = insertProfile("joiner@test.com", "Joiner", "participant");
		Organization org = createUseCase.execute("Test Org", "test-org", UUID.fromString(ownerId));

		OrganizationMember member = joinUseCase.execute("test-org", UUID.fromString(joinerId));

		assertThat(member.getRole()).isEqualTo(OrganizationMember.Role.MEMBER);
		assertThat(member.getUserId()).isEqualTo(UUID.fromString(joinerId));
		assertThat(member.getOrganizationId()).isEqualTo(org.getId());
	}

	@Test
	void joining_unknown_slug_throws_not_found() {
		String userId = insertProfile("user@test.com", "User", "participant");
		assertThatThrownBy(() -> joinUseCase.execute("no-such-org", UUID.fromString(userId)))
				.isInstanceOf(JoinOrganizationUseCase.OrganizationNotFoundException.class);
	}

	@Test
	void joining_twice_throws_already_member() {
		String ownerId = insertProfile("owner2@test.com", "Owner2", "manager");
		createUseCase.execute("Dup Org", "dup-org", UUID.fromString(ownerId));

		// owner is already a member — joining again should throw
		assertThatThrownBy(() -> joinUseCase.execute("dup-org", UUID.fromString(ownerId)))
				.isInstanceOf(JoinOrganizationUseCase.AlreadyMemberException.class);
	}
}
