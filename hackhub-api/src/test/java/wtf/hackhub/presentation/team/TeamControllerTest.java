package wtf.hackhub.presentation.team;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import wtf.hackhub.application.team.*;
import wtf.hackhub.domain.Team;
import wtf.hackhub.domain.TeamMember;
import wtf.hackhub.infrastructure.config.SecurityConfig;
import wtf.hackhub.infrastructure.security.JwtAuthFilter;
import wtf.hackhub.infrastructure.security.JwtProvider;
import wtf.hackhub.presentation.common.GlobalExceptionHandler;
import wtf.hackhub.support.MockAuthHelper;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(TeamController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
		"app.jwt.private-key=-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBg=====\\n-----END PRIVATE KEY-----",
		"app.jwt.public-key=-----BEGIN PUBLIC KEY-----\\nMIIBIjANBg=====\\n-----END PUBLIC KEY-----",
		"app.cors.allowed-origins=http://localhost:5173", "app.minio.endpoint=http://localhost:9000",
		"app.minio.access-key=test", "app.minio.secret-key=test"})
class TeamControllerTest {

	@Autowired
	MockMvc mvc;

	@MockBean
	CreateTeamUseCase createTeamUseCase;
	@MockBean
	GetTeamsUseCase getTeamsUseCase;
	@MockBean
	UpdateTeamUseCase updateTeamUseCase;
	@MockBean
	JoinTeamUseCase joinTeamUseCase;
	@MockBean
	LeaveTeamUseCase leaveTeamUseCase;
	@MockBean
	JwtProvider jwtProvider;

	static final UUID USER_ID = UUID.randomUUID();
	static final UUID HACKATHON_ID = UUID.randomUUID();
	static final UUID TEAM_ID = UUID.randomUUID();

	private Team sampleTeam() {
		return new Team("Alpha", "desc", HACKATHON_ID, USER_ID);
	}

	@Test
	void list_teams_by_hackathon_returns_200() throws Exception {
		when(getTeamsUseCase.listByHackathon(HACKATHON_ID)).thenReturn(List.of(sampleTeam()));

		mvc.perform(get("/api/v1/hackathons/" + HACKATHON_ID + "/teams").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Alpha"));
	}

	@Test
	void list_teams_unauthenticated_returns_401() throws Exception {
		mvc.perform(get("/api/v1/hackathons/" + HACKATHON_ID + "/teams")).andExpect(status().isUnauthorized());
	}

	@Test
	void create_team_returns_201() throws Exception {
		when(createTeamUseCase.execute(eq("Alpha"), any(), eq(HACKATHON_ID), eq(USER_ID))).thenReturn(sampleTeam());

		mvc.perform(post("/api/v1/hackathons/" + HACKATHON_ID + "/teams").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Alpha\",\"description\":\"desc\"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.name").value("Alpha"));
	}

	@Test
	void create_team_missing_name_returns_400() throws Exception {
		mvc.perform(post("/api/v1/hackathons/" + HACKATHON_ID + "/teams").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"description\":\"desc\"}"))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.title").value("Validation Failed"));
	}

	@Test
	void create_team_duplicate_name_returns_409() throws Exception {
		when(createTeamUseCase.execute(any(), any(), any(), any()))
				.thenThrow(new CreateTeamUseCase.TeamNameTakenException("Alpha", HACKATHON_ID));

		mvc.perform(post("/api/v1/hackathons/" + HACKATHON_ID + "/teams").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Alpha\",\"description\":\"desc\"}"))
				.andExpect(status().isConflict()).andExpect(jsonPath("$.title").value("Team Name Taken"));
	}

	@Test
	void get_team_by_id_returns_200() throws Exception {
		when(getTeamsUseCase.getById(TEAM_ID)).thenReturn(sampleTeam());

		mvc.perform(get("/api/v1/teams/" + TEAM_ID).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Alpha"));
	}

	@Test
	void get_team_not_found_returns_404() throws Exception {
		when(getTeamsUseCase.getById(TEAM_ID)).thenThrow(new JoinTeamUseCase.TeamNotFoundException(TEAM_ID));

		mvc.perform(get("/api/v1/teams/" + TEAM_ID).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNotFound());
	}

	@Test
	void join_team_returns_201() throws Exception {
		TeamMember member = new TeamMember(TEAM_ID, USER_ID, TeamMember.Role.MEMBER);
		when(joinTeamUseCase.execute(TEAM_ID, USER_ID)).thenReturn(member);

		mvc.perform(post("/api/v1/teams/" + TEAM_ID + "/members").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.role").value("member"));
	}

	@Test
	void join_team_full_returns_409() throws Exception {
		when(joinTeamUseCase.execute(any(), any())).thenThrow(new JoinTeamUseCase.TeamFullException(TEAM_ID, 4));

		mvc.perform(post("/api/v1/teams/" + TEAM_ID + "/members").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isConflict());
	}

	@Test
	void get_team_members_returns_list() throws Exception {
		TeamMember member = new TeamMember(TEAM_ID, USER_ID, TeamMember.Role.LEADER);
		when(getTeamsUseCase.getMembers(TEAM_ID)).thenReturn(List.of(member));

		mvc.perform(get("/api/v1/teams/" + TEAM_ID + "/members").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].role").value("leader"));
	}

	@Test
	void leave_team_returns_204() throws Exception {
		mvc.perform(delete("/api/v1/teams/" + TEAM_ID + "/members/me").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNoContent());
	}
}
