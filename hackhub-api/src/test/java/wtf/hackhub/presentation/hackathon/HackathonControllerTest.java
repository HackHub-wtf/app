package wtf.hackhub.presentation.hackathon;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import wtf.hackhub.application.hackathon.*;
import wtf.hackhub.domain.Hackathon;
import wtf.hackhub.infrastructure.config.SecurityConfig;
import wtf.hackhub.infrastructure.security.JwtAuthFilter;
import wtf.hackhub.infrastructure.security.JwtProvider;
import wtf.hackhub.presentation.common.GlobalExceptionHandler;
import wtf.hackhub.support.MockAuthHelper;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(HackathonController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
		"app.jwt.private-key=-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBg=====\\n-----END PRIVATE KEY-----",
		"app.jwt.public-key=-----BEGIN PUBLIC KEY-----\\nMIIBIjANBg=====\\n-----END PUBLIC KEY-----",
		"app.cors.allowed-origins=http://localhost:5173", "app.minio.endpoint=http://localhost:9000",
		"app.minio.access-key=test", "app.minio.secret-key=test"})
class HackathonControllerTest {

	@Autowired
	MockMvc mvc;
	@MockBean
	CreateHackathonUseCase createUseCase;
	@MockBean
	GetHackathonsUseCase getUseCase;
	@MockBean
	UpdateHackathonUseCase updateUseCase;
	@MockBean
	JoinHackathonUseCase joinUseCase;
	@MockBean
	GetLeaderboardUseCase leaderboardUseCase;
	@MockBean
	JwtProvider jwtProvider;

	static final UUID USER_ID = UUID.randomUUID();

	static Hackathon hackathon() {
		return new Hackathon("Hack 2026", "Desc", Instant.now(), Instant.now().plusSeconds(86400), "KEY123", 4, 100,
				USER_ID, null);
	}

	// ── list ──────────────────────────────────────────────────────────────────

	@Test
	void list_returns_page() throws Exception {
		when(getUseCase.listAll(any())).thenReturn(new PageImpl<>(List.of(hackathon())));

		mvc.perform(get("/api/v1/hackathons").with(MockAuthHelper.asParticipant(USER_ID))).andExpect(status().isOk())
				.andExpect(jsonPath("$.content[0].title").value("Hack 2026"));
	}

	@Test
	void list_filtered_by_status() throws Exception {
		when(getUseCase.listByStatus(any(), any())).thenReturn(new PageImpl<>(List.of(hackathon())));

		mvc.perform(get("/api/v1/hackathons?status=open").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.content[0].title").value("Hack 2026"));
	}

	@Test
	void list_unauthenticated_returns_401() throws Exception {
		mvc.perform(get("/api/v1/hackathons")).andExpect(status().isUnauthorized());
	}

	// ── get by id ─────────────────────────────────────────────────────────────

	@Test
	void get_by_id_returns_200() throws Exception {
		UUID id = UUID.randomUUID();
		when(getUseCase.getById(id)).thenReturn(hackathon());

		mvc.perform(get("/api/v1/hackathons/" + id).with(MockAuthHelper.asManager(USER_ID))).andExpect(status().isOk())
				.andExpect(jsonPath("$.title").value("Hack 2026"));
	}

	@Test
	void get_by_id_not_found_returns_404() throws Exception {
		UUID id = UUID.randomUUID();
		when(getUseCase.getById(id)).thenThrow(new GetHackathonsUseCase.HackathonNotFoundException(id));

		mvc.perform(get("/api/v1/hackathons/" + id).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNotFound()).andExpect(jsonPath("$.title").value("Not Found"));
	}

	// ── create ────────────────────────────────────────────────────────────────

	@Test
	void create_valid_returns_201() throws Exception {
		when(createUseCase.execute(any())).thenReturn(hackathon());

		mvc.perform(post("/api/v1/hackathons").with(MockAuthHelper.asManager(USER_ID))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"H\",\"description\":\"D\"," + "\"startDate\":\"2026-06-01T00:00:00Z\","
						+ "\"endDate\":\"2026-06-03T00:00:00Z\"," + "\"maxTeamSize\":4,\"allowedParticipants\":100}"))
				.andExpect(status().isCreated());
	}

	@Test
	void create_unauthenticated_returns_401() throws Exception {
		mvc.perform(post("/api/v1/hackathons").contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"H\",\"description\":\"D\"," + "\"startDate\":\"2026-06-01T00:00:00Z\","
						+ "\"endDate\":\"2026-06-03T00:00:00Z\"," + "\"maxTeamSize\":4,\"allowedParticipants\":100}"))
				.andExpect(status().isUnauthorized());
	}

	// ── update ────────────────────────────────────────────────────────────────

	@Test
	void update_returns_200() throws Exception {
		UUID id = UUID.randomUUID();
		when(updateUseCase.execute(any())).thenReturn(hackathon());

		mvc.perform(put("/api/v1/hackathons/" + id).with(MockAuthHelper.asManager(USER_ID))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"Updated\",\"description\":\"D\"," + "\"startDate\":\"2026-06-01T00:00:00Z\","
						+ "\"endDate\":\"2026-06-03T00:00:00Z\"," + "\"maxTeamSize\":4,\"allowedParticipants\":100}"))
				.andExpect(status().isOk());
	}

	@Test
	void update_not_found_returns_404() throws Exception {
		UUID id = UUID.randomUUID();
		when(updateUseCase.execute(any())).thenThrow(new GetHackathonsUseCase.HackathonNotFoundException(id));

		mvc.perform(put("/api/v1/hackathons/" + id).with(MockAuthHelper.asManager(USER_ID))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"T\",\"description\":\"D\"," + "\"startDate\":\"2026-06-01T00:00:00Z\","
						+ "\"endDate\":\"2026-06-03T00:00:00Z\"," + "\"maxTeamSize\":4,\"allowedParticipants\":100}"))
				.andExpect(status().isNotFound());
	}

	// ── status transition ─────────────────────────────────────────────────────

	@Test
	void transition_status_returns_200() throws Exception {
		UUID id = UUID.randomUUID();
		Hackathon h = hackathon();
		h.open();
		when(updateUseCase.transitionStatus(any(), any())).thenReturn(h);

		mvc.perform(patch("/api/v1/hackathons/" + id + "/status").with(MockAuthHelper.asAdmin(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"open\"}")).andExpect(status().isOk());
	}

	@Test
	void transition_invalid_returns_409() throws Exception {
		UUID id = UUID.randomUUID();
		when(updateUseCase.transitionStatus(any(), any())).thenThrow(
				new Hackathon.InvalidTransitionException(Hackathon.Status.DRAFT, Hackathon.Status.COMPLETED));

		mvc.perform(patch("/api/v1/hackathons/" + id + "/status").with(MockAuthHelper.asAdmin(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"completed\"}"))
				.andExpect(status().isConflict());
	}

	// ── join ──────────────────────────────────────────────────────────────────

	@Test
	void join_valid_key_returns_200() throws Exception {
		Hackathon h = hackathon();
		h.open();
		when(joinUseCase.execute("KEY123")).thenReturn(h);

		mvc.perform(post("/api/v1/hackathons/join").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"registrationKey\":\"KEY123\"}"))
				.andExpect(status().isOk());
	}

	@Test
	void join_invalid_key_returns_400() throws Exception {
		when(joinUseCase.execute(any())).thenThrow(new JoinHackathonUseCase.InvalidRegistrationKeyException("BADKEY"));

		mvc.perform(post("/api/v1/hackathons/join").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"registrationKey\":\"BADKEY\"}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void join_hackathon_not_open_returns_409() throws Exception {
		when(joinUseCase.execute(any())).thenThrow(
				new JoinHackathonUseCase.HackathonNotOpenException(UUID.randomUUID(), Hackathon.Status.DRAFT));

		mvc.perform(post("/api/v1/hackathons/join").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"registrationKey\":\"DRAFTKEY\"}"))
				.andExpect(status().isConflict());
	}
}
