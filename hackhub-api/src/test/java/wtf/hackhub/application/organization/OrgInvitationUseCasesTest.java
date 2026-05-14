package wtf.hackhub.application.organization;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.OrgInvitation;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrgInvitationRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;
import wtf.hackhub.domain.Organization;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OrgInvitationUseCasesTest {

	@Mock
	OrgInvitationRepository invitationRepository;
	@Mock
	OrganizationMemberRepository memberRepository;
	@Mock
	OrganizationRepository organizationRepository;
	@Mock
	ProfileRepository profileRepository;

	// ── CreateOrgInvitationUseCase ────────────────────────────────────────────

	@InjectMocks
	CreateOrgInvitationUseCase createInvitation;

	@Test
	void create_invitation_owner_can_invite_member() {
		UUID orgId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		Organization org = new Organization("Acme", "acme", callerId);
		OrganizationMember owner = new OrganizationMember(orgId, callerId, OrganizationMember.Role.OWNER);
		OrgInvitation saved = new OrgInvitation(orgId, callerId, "TOKEN", Instant.now().plusSeconds(86400),
				OrganizationMember.Role.MEMBER, null);

		when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.of(owner));
		when(invitationRepository.existsByToken(any())).thenReturn(false);
		when(invitationRepository.save(any())).thenReturn(saved);

		OrgInvitation result = createInvitation.execute(orgId, callerId, OrganizationMember.Role.MEMBER, null);
		assertThat(result.getInvitedRole()).isEqualTo(OrganizationMember.Role.MEMBER);
	}

	@Test
	void create_invitation_manager_cannot_invite_owner() {
		UUID orgId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		Organization org = new Organization("Acme", "acme", UUID.randomUUID());
		OrganizationMember manager = new OrganizationMember(orgId, callerId, OrganizationMember.Role.MANAGER);

		when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.of(manager));

		assertThatThrownBy(() -> createInvitation.execute(orgId, callerId, OrganizationMember.Role.OWNER, null))
				.isInstanceOf(CreateOrgInvitationUseCase.RoleEscalationException.class);
	}

	@Test
	void create_invitation_manager_cannot_invite_manager() {
		UUID orgId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		Organization org = new Organization("Acme", "acme", UUID.randomUUID());
		OrganizationMember manager = new OrganizationMember(orgId, callerId, OrganizationMember.Role.MANAGER);

		when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.of(manager));

		assertThatThrownBy(() -> createInvitation.execute(orgId, callerId, OrganizationMember.Role.MANAGER, null))
				.isInstanceOf(CreateOrgInvitationUseCase.RoleEscalationException.class);
	}

	@Test
	void create_invitation_regular_member_cannot_invite() {
		UUID orgId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		Organization org = new Organization("Acme", "acme", UUID.randomUUID());
		OrganizationMember member = new OrganizationMember(orgId, callerId, OrganizationMember.Role.MEMBER);

		when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.of(member));

		assertThatThrownBy(() -> createInvitation.execute(orgId, callerId, OrganizationMember.Role.MEMBER, null))
				.isInstanceOf(CreateOrgInvitationUseCase.NotAuthorizedToInviteException.class);
	}

	@Test
	void create_invitation_non_member_cannot_invite() {
		UUID orgId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		Organization org = new Organization("Acme", "acme", UUID.randomUUID());

		when(organizationRepository.findById(orgId)).thenReturn(Optional.of(org));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> createInvitation.execute(orgId, callerId, OrganizationMember.Role.MEMBER, null))
				.isInstanceOf(CreateOrgInvitationUseCase.NotAuthorizedToInviteException.class);
	}

	@Test
	void create_invitation_org_not_found_throws() {
		UUID orgId = UUID.randomUUID();
		when(organizationRepository.findById(orgId)).thenReturn(Optional.empty());

		assertThatThrownBy(
				() -> createInvitation.execute(orgId, UUID.randomUUID(), OrganizationMember.Role.MEMBER, null))
				.isInstanceOf(CreateOrgInvitationUseCase.OrganizationNotFoundException.class);
	}

	// ── AcceptOrgInvitationUseCase ────────────────────────────────────────────

	@InjectMocks
	AcceptOrgInvitationUseCase acceptInvitation;

	@Test
	void accept_invitation_creates_membership() {
		UUID orgId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null);
		OrganizationMember saved = new OrganizationMember(orgId, userId, OrganizationMember.Role.MEMBER);

		when(invitationRepository.findByToken("TOKEN")).thenReturn(Optional.of(inv));
		when(memberRepository.existsByOrganizationIdAndUserId(orgId, userId)).thenReturn(false);
		when(invitationRepository.save(inv)).thenReturn(inv);
		when(memberRepository.save(any())).thenReturn(saved);
		when(profileRepository.findById(userId)).thenReturn(Optional.empty());

		OrganizationMember result = acceptInvitation.execute("TOKEN", userId);
		assertThat(result.getOrganizationId()).isEqualTo(orgId);
		assertThat(inv.isUsed()).isTrue();
	}

	@Test
	void accept_invitation_also_updates_profile_org() {
		UUID orgId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null);
		OrganizationMember saved = new OrganizationMember(orgId, userId, OrganizationMember.Role.MEMBER);
		Profile profile = new Profile("u@x.com", "User", "hash");

		when(invitationRepository.findByToken("TOKEN")).thenReturn(Optional.of(inv));
		when(memberRepository.existsByOrganizationIdAndUserId(orgId, userId)).thenReturn(false);
		when(invitationRepository.save(inv)).thenReturn(inv);
		when(memberRepository.save(any())).thenReturn(saved);
		when(profileRepository.findById(userId)).thenReturn(Optional.of(profile));
		when(profileRepository.save(profile)).thenReturn(profile);

		acceptInvitation.execute("TOKEN", userId);
		assertThat(profile.getOrganizationId()).isEqualTo(orgId);
	}

	@Test
	void accept_invitation_invalid_token_throws() {
		when(invitationRepository.findByToken("BAD")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> acceptInvitation.execute("BAD", UUID.randomUUID()))
				.isInstanceOf(AcceptOrgInvitationUseCase.InvalidInvitationTokenException.class);
	}

	@Test
	void accept_invitation_revoked_throws() {
		UUID orgId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null);
		inv.revoke();
		when(invitationRepository.findByToken("TOKEN")).thenReturn(Optional.of(inv));

		assertThatThrownBy(() -> acceptInvitation.execute("TOKEN", UUID.randomUUID()))
				.isInstanceOf(AcceptOrgInvitationUseCase.InvalidInvitationTokenException.class);
	}

	@Test
	void accept_invitation_already_used_throws() {
		UUID orgId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null);
		inv.markUsed();
		when(invitationRepository.findByToken("TOKEN")).thenReturn(Optional.of(inv));

		assertThatThrownBy(() -> acceptInvitation.execute("TOKEN", UUID.randomUUID()))
				.isInstanceOf(AcceptOrgInvitationUseCase.InvalidInvitationTokenException.class);
	}

	@Test
	void accept_invitation_expired_throws() {
		UUID orgId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().minusSeconds(1),
				OrganizationMember.Role.MEMBER, null);
		when(invitationRepository.findByToken("TOKEN")).thenReturn(Optional.of(inv));

		assertThatThrownBy(() -> acceptInvitation.execute("TOKEN", UUID.randomUUID()))
				.isInstanceOf(AcceptOrgInvitationUseCase.InvitationExpiredException.class);
	}

	@Test
	void accept_invitation_already_member_throws() {
		UUID orgId = UUID.randomUUID();
		UUID userId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null);
		when(invitationRepository.findByToken("TOKEN")).thenReturn(Optional.of(inv));
		when(memberRepository.existsByOrganizationIdAndUserId(orgId, userId)).thenReturn(true);

		assertThatThrownBy(() -> acceptInvitation.execute("TOKEN", userId))
				.isInstanceOf(JoinOrganizationUseCase.AlreadyMemberException.class);
	}

	// ── GetOrgInvitationsUseCase ──────────────────────────────────────────────

	@InjectMocks
	GetOrgInvitationsUseCase getInvitations;

	@Test
	void get_pending_returns_list_for_owner() {
		UUID orgId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		OrganizationMember owner = new OrganizationMember(orgId, callerId, OrganizationMember.Role.OWNER);
		OrgInvitation inv = new OrgInvitation(orgId, callerId, "T", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null);

		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.of(owner));
		when(invitationRepository.findAllByOrganizationIdAndUsedAtIsNullAndRevokedAtIsNull(orgId))
				.thenReturn(List.of(inv));

		List<OrgInvitation> result = getInvitations.getPending(orgId, callerId);
		assertThat(result).hasSize(1);
	}

	@Test
	void get_pending_throws_for_member_role() {
		UUID orgId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, callerId, OrganizationMember.Role.MEMBER);
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.of(member));

		assertThatThrownBy(() -> getInvitations.getPending(orgId, callerId))
				.isInstanceOf(GetOrgInvitationsUseCase.NotAuthorizedToListException.class);
	}

	@Test
	void get_pending_throws_for_non_member() {
		UUID orgId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> getInvitations.getPending(orgId, callerId))
				.isInstanceOf(GetOrgInvitationsUseCase.NotAuthorizedToListException.class);
	}

	@Test
	void preview_returns_invitation_when_valid() {
		UUID orgId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null);
		when(invitationRepository.findByToken("TOKEN")).thenReturn(Optional.of(inv));

		OrgInvitation result = getInvitations.preview("TOKEN");
		assertThat(result.getToken()).isEqualTo("TOKEN");
	}

	@Test
	void preview_throws_when_token_not_found() {
		when(invitationRepository.findByToken("BAD")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> getInvitations.preview("BAD"))
				.isInstanceOf(GetOrgInvitationsUseCase.InvalidTokenException.class);
	}

	@Test
	void preview_throws_when_invitation_invalid() {
		UUID orgId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().minusSeconds(1),
				OrganizationMember.Role.MEMBER, null);
		when(invitationRepository.findByToken("TOKEN")).thenReturn(Optional.of(inv));

		assertThatThrownBy(() -> getInvitations.preview("TOKEN"))
				.isInstanceOf(GetOrgInvitationsUseCase.InvalidTokenException.class);
	}

	// ── RevokeOrgInvitationUseCase ────────────────────────────────────────────

	@InjectMocks
	RevokeOrgInvitationUseCase revokeInvitation;

	@Test
	void revoke_invitation_succeeds_for_owner() {
		UUID orgId = UUID.randomUUID();
		UUID invId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		OrgInvitation inv = spy(new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null));
		OrganizationMember owner = new OrganizationMember(orgId, callerId, OrganizationMember.Role.OWNER);

		when(invitationRepository.findById(invId)).thenReturn(Optional.of(inv));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.of(owner));
		when(invitationRepository.save(inv)).thenReturn(inv);

		revokeInvitation.execute(orgId, invId, callerId);
		verify(invitationRepository).save(inv);
	}

	@Test
	void revoke_invitation_throws_when_not_found() {
		UUID orgId = UUID.randomUUID();
		UUID invId = UUID.randomUUID();
		when(invitationRepository.findById(invId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> revokeInvitation.execute(orgId, invId, UUID.randomUUID()))
				.isInstanceOf(RevokeOrgInvitationUseCase.InvitationNotFoundException.class);
	}

	@Test
	void revoke_invitation_throws_when_org_mismatch() {
		UUID orgId = UUID.randomUUID();
		UUID invId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(UUID.randomUUID(), UUID.randomUUID(), "TOKEN",
				Instant.now().plusSeconds(3600), OrganizationMember.Role.MEMBER, null);
		when(invitationRepository.findById(invId)).thenReturn(Optional.of(inv));

		assertThatThrownBy(() -> revokeInvitation.execute(orgId, invId, UUID.randomUUID()))
				.isInstanceOf(RevokeOrgInvitationUseCase.InvitationNotFoundException.class);
	}

	@Test
	void revoke_invitation_throws_when_caller_not_authorized() {
		UUID orgId = UUID.randomUUID();
		UUID invId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null);
		OrganizationMember member = new OrganizationMember(orgId, callerId, OrganizationMember.Role.MEMBER);

		when(invitationRepository.findById(invId)).thenReturn(Optional.of(inv));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.of(member));

		assertThatThrownBy(() -> revokeInvitation.execute(orgId, invId, callerId))
				.isInstanceOf(RevokeOrgInvitationUseCase.NotAuthorizedToRevokeException.class);
	}

	@Test
	void revoke_invitation_throws_when_non_member_caller() {
		UUID orgId = UUID.randomUUID();
		UUID invId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null);

		when(invitationRepository.findById(invId)).thenReturn(Optional.of(inv));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> revokeInvitation.execute(orgId, invId, callerId))
				.isInstanceOf(RevokeOrgInvitationUseCase.NotAuthorizedToRevokeException.class);
	}

	@Test
	void revoke_invitation_throws_when_already_processed() {
		UUID orgId = UUID.randomUUID();
		UUID invId = UUID.randomUUID();
		UUID callerId = UUID.randomUUID();
		OrgInvitation inv = new OrgInvitation(orgId, UUID.randomUUID(), "TOKEN", Instant.now().plusSeconds(3600),
				OrganizationMember.Role.MEMBER, null);
		inv.markUsed();
		OrganizationMember owner = new OrganizationMember(orgId, callerId, OrganizationMember.Role.OWNER);

		when(invitationRepository.findById(invId)).thenReturn(Optional.of(inv));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, callerId)).thenReturn(Optional.of(owner));

		assertThatThrownBy(() -> revokeInvitation.execute(orgId, invId, callerId))
				.isInstanceOf(RevokeOrgInvitationUseCase.InvitationAlreadyProcessedException.class);
	}
}
