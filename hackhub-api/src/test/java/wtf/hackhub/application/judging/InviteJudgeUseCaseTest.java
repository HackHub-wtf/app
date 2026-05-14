package wtf.hackhub.application.judging;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.domain.HackathonJudge;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.judging.HackathonJudgeRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InviteJudgeUseCaseTest {

	@Mock
	HackathonJudgeRepository judgeRepository;
	@Mock
	HackathonRepository hackathonRepository;
	@Mock
	OrganizationMemberRepository memberRepository;

	@InjectMocks
	InviteJudgeUseCase inviteJudge;

	private Hackathon hackathonWithOrg(UUID orgId) {
		Hackathon h = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(86400), "KEY", 4, 100,
				UUID.randomUUID(), orgId);
		return h;
	}

	@Test
	void invite_judge_succeeds_without_org() {
		UUID hackathonId = UUID.randomUUID();
		UUID targetId = UUID.randomUUID();
		UUID invitedBy = UUID.randomUUID();
		Hackathon hackathon = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(86400), "KEY", 4, 100,
				UUID.randomUUID(), null);
		HackathonJudge saved = new HackathonJudge(hackathonId, targetId, invitedBy);

		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon));
		when(judgeRepository.existsByHackathonIdAndUserId(hackathonId, targetId)).thenReturn(false);
		when(judgeRepository.save(any())).thenReturn(saved);

		HackathonJudge result = inviteJudge.execute(hackathonId, targetId, invitedBy);
		assertThat(result.getUserId()).isEqualTo(targetId);
	}

	@Test
	void invite_judge_returns_existing_if_already_judge() {
		UUID hackathonId = UUID.randomUUID();
		UUID targetId = UUID.randomUUID();
		UUID invitedBy = UUID.randomUUID();
		Hackathon hackathon = new Hackathon("H", "D", Instant.now(), Instant.now().plusSeconds(86400), "KEY", 4, 100,
				UUID.randomUUID(), null);
		HackathonJudge existing = new HackathonJudge(hackathonId, targetId, invitedBy);

		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon));
		when(judgeRepository.existsByHackathonIdAndUserId(hackathonId, targetId)).thenReturn(true);
		when(judgeRepository.findByHackathonIdAndUserId(hackathonId, targetId)).thenReturn(Optional.of(existing));

		HackathonJudge result = inviteJudge.execute(hackathonId, targetId, invitedBy);
		assertThat(result).isEqualTo(existing);
		verify(judgeRepository, never()).save(any());
	}

	@Test
	void invite_judge_with_org_succeeds_for_manager() {
		UUID hackathonId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		UUID targetId = UUID.randomUUID();
		UUID invitedBy = UUID.randomUUID();
		Hackathon hackathon = hackathonWithOrg(orgId);
		OrganizationMember inviter = new OrganizationMember(orgId, invitedBy, OrganizationMember.Role.MANAGER);
		HackathonJudge saved = new HackathonJudge(hackathonId, targetId, invitedBy);

		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, invitedBy)).thenReturn(Optional.of(inviter));
		when(memberRepository.existsByOrganizationIdAndUserId(orgId, targetId)).thenReturn(true);
		when(judgeRepository.existsByHackathonIdAndUserId(hackathonId, targetId)).thenReturn(false);
		when(judgeRepository.save(any())).thenReturn(saved);

		HackathonJudge result = inviteJudge.execute(hackathonId, targetId, invitedBy);
		assertThat(result.getUserId()).isEqualTo(targetId);
	}

	@Test
	void invite_judge_with_org_throws_for_non_manager_inviter() {
		UUID hackathonId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		UUID targetId = UUID.randomUUID();
		UUID invitedBy = UUID.randomUUID();
		Hackathon hackathon = hackathonWithOrg(orgId);
		OrganizationMember member = new OrganizationMember(orgId, invitedBy, OrganizationMember.Role.MEMBER);

		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, invitedBy)).thenReturn(Optional.of(member));

		assertThatThrownBy(() -> inviteJudge.execute(hackathonId, targetId, invitedBy))
				.isInstanceOf(InviteJudgeUseCase.NotAuthorizedToInviteException.class);
	}

	@Test
	void invite_judge_with_org_throws_when_inviter_not_in_org() {
		UUID hackathonId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		UUID invitedBy = UUID.randomUUID();
		Hackathon hackathon = hackathonWithOrg(orgId);

		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, invitedBy)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> inviteJudge.execute(hackathonId, UUID.randomUUID(), invitedBy))
				.isInstanceOf(InviteJudgeUseCase.NotAuthorizedToInviteException.class);
	}

	@Test
	void invite_judge_with_org_throws_when_target_not_in_org() {
		UUID hackathonId = UUID.randomUUID();
		UUID orgId = UUID.randomUUID();
		UUID targetId = UUID.randomUUID();
		UUID invitedBy = UUID.randomUUID();
		Hackathon hackathon = hackathonWithOrg(orgId);
		OrganizationMember manager = new OrganizationMember(orgId, invitedBy, OrganizationMember.Role.OWNER);

		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.of(hackathon));
		when(memberRepository.findByOrganizationIdAndUserId(orgId, invitedBy)).thenReturn(Optional.of(manager));
		when(memberRepository.existsByOrganizationIdAndUserId(orgId, targetId)).thenReturn(false);

		assertThatThrownBy(() -> inviteJudge.execute(hackathonId, targetId, invitedBy))
				.isInstanceOf(InviteJudgeUseCase.TargetNotOrgMemberException.class);
	}

	@Test
	void invite_judge_throws_when_hackathon_not_found() {
		UUID hackathonId = UUID.randomUUID();
		when(hackathonRepository.findById(hackathonId)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> inviteJudge.execute(hackathonId, UUID.randomUUID(), UUID.randomUUID()))
				.isInstanceOf(InviteJudgeUseCase.HackathonNotFoundException.class);
	}
}
