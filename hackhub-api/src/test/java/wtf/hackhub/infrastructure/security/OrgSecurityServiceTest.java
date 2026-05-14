package wtf.hackhub.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrgSecurityServiceTest {

	@Mock
	OrganizationMemberRepository memberRepository;
	@InjectMocks
	OrgSecurityService service;

	private Authentication auth(UUID userId) {
		return new UsernamePasswordAuthenticationToken(userId, null, List.of());
	}

	@Test
	void is_owner_or_manager_returns_true_for_owner() {
		UUID userId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.OWNER);
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.of(member));

		assertThat(service.isOrgOwnerOrManager(orgId, auth(userId))).isTrue();
	}

	@Test
	void is_owner_or_manager_returns_true_for_manager() {
		UUID userId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.MANAGER);
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.of(member));

		assertThat(service.isOrgOwnerOrManager(orgId, auth(userId))).isTrue();
	}

	@Test
	void is_owner_or_manager_returns_false_for_plain_member() {
		UUID userId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.MEMBER);
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.of(member));

		assertThat(service.isOrgOwnerOrManager(orgId, auth(userId))).isFalse();
	}

	@Test
	void is_owner_or_manager_returns_false_when_not_a_member() {
		UUID userId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.empty());

		assertThat(service.isOrgOwnerOrManager(orgId, auth(userId))).isFalse();
	}

	@Test
	void is_member_returns_true_when_exists() {
		UUID userId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		when(memberRepository.existsByOrganizationIdAndUserId(orgId, userId)).thenReturn(true);

		assertThat(service.isOrgMember(orgId, auth(userId))).isTrue();
	}

	@Test
	void is_member_returns_false_when_not_exists() {
		UUID userId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		when(memberRepository.existsByOrganizationIdAndUserId(orgId, userId)).thenReturn(false);

		assertThat(service.isOrgMember(orgId, auth(userId))).isFalse();
	}
}
