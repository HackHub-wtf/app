package wtf.hackhub.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class HackathonSecurityServiceTest {

	@Mock
	HackathonRepository hackathonRepository;
	@Mock
	OrganizationMemberRepository memberRepository;
	@InjectMocks
	HackathonSecurityService service;

	private Authentication auth(UUID userId) {
		return new UsernamePasswordAuthenticationToken(userId, null, List.of());
	}

	private Hackathon hackathon(UUID createdBy, UUID orgId) {
		return new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(100), "KEY", 4, 100, createdBy, orgId);
	}

	@Test
	void returns_true_for_creator() {
		UUID userId = UUID.randomUUID();
		UUID hackathonId = UUID.randomUUID();
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon(userId, null)));

		assertThat(service.isOwnerOrOrgManager(hackathonId, auth(userId))).isTrue();
	}

	@Test
	void returns_false_for_non_creator_without_org() {
		UUID hackathonId = UUID.randomUUID();
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon(UUID.randomUUID(), null)));

		assertThat(service.isOwnerOrOrgManager(hackathonId, auth(UUID.randomUUID()))).isFalse();
	}

	@Test
	void returns_true_for_org_manager() {
		UUID userId = UUID.randomUUID();
		UUID hackathonId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.MANAGER);
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon(UUID.randomUUID(), orgId)));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.of(member));

		assertThat(service.isOwnerOrOrgManager(hackathonId, auth(userId))).isTrue();
	}

	@Test
	void returns_true_for_org_owner() {
		UUID userId = UUID.randomUUID();
		UUID hackathonId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.OWNER);
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon(UUID.randomUUID(), orgId)));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.of(member));

		assertThat(service.isOwnerOrOrgManager(hackathonId, auth(userId))).isTrue();
	}

	@Test
	void returns_false_for_org_plain_member() {
		UUID userId = UUID.randomUUID();
		UUID hackathonId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, userId, OrganizationMember.Role.MEMBER);
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon(UUID.randomUUID(), orgId)));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.of(member));

		assertThat(service.isOwnerOrOrgManager(hackathonId, auth(userId))).isFalse();
	}

	@Test
	void returns_false_when_user_not_in_org() {
		UUID userId = UUID.randomUUID();
		UUID hackathonId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon(UUID.randomUUID(), orgId)));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, userId)).thenReturn(Optional.empty());

		assertThat(service.isOwnerOrOrgManager(hackathonId, auth(userId))).isFalse();
	}

	@Test
	void returns_false_when_hackathon_not_found() {
		UUID hackathonId = UUID.randomUUID();
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.empty());

		assertThat(service.isOwnerOrOrgManager(hackathonId, auth(UUID.randomUUID()))).isFalse();
	}
}
