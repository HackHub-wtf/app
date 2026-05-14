package wtf.hackhub.infrastructure.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TeamSecurityServiceTest {

	@Mock
	TeamMemberRepository teamMemberRepository;
	@InjectMocks
	TeamSecurityService service;

	private Authentication auth(UUID userId) {
		return new UsernamePasswordAuthenticationToken(userId, null, List.of());
	}

	@Test
	void is_leader_returns_true_for_leader() {
		UUID userId = UUID.randomUUID();
		UUID teamId = UUID.randomUUID();
		TeamMember leader = new TeamMember(teamId, userId, TeamMember.Role.LEADER);
		when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId)).thenReturn(Optional.of(leader));

		assertThat(service.isLeaderOrAdmin(teamId, auth(userId))).isTrue();
	}

	@Test
	void is_leader_returns_false_for_regular_member() {
		UUID userId = UUID.randomUUID();
		UUID teamId = UUID.randomUUID();
		TeamMember member = new TeamMember(teamId, userId, TeamMember.Role.MEMBER);
		when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId)).thenReturn(Optional.of(member));

		assertThat(service.isLeaderOrAdmin(teamId, auth(userId))).isFalse();
	}

	@Test
	void is_leader_returns_false_when_not_in_team() {
		UUID userId = UUID.randomUUID();
		UUID teamId = UUID.randomUUID();
		when(teamMemberRepository.findByTeamIdAndUserId(teamId, userId)).thenReturn(Optional.empty());

		assertThat(service.isLeaderOrAdmin(teamId, auth(userId))).isFalse();
	}
}
