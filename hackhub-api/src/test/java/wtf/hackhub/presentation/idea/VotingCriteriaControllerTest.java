package wtf.hackhub.presentation.idea;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import wtf.hackhub.application.idea.ManageVotingCriteriaUseCase;
import wtf.hackhub.domain.VotingCriteria;
import wtf.hackhub.infrastructure.config.SecurityConfig;
import wtf.hackhub.infrastructure.security.JwtAuthFilter;
import wtf.hackhub.infrastructure.security.JwtProvider;
import wtf.hackhub.presentation.common.GlobalExceptionHandler;
import wtf.hackhub.support.MockAuthHelper;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(VotingCriteriaController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
		"app.jwt.private-key=-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBg=====\\n-----END PRIVATE KEY-----",
		"app.jwt.public-key=-----BEGIN PUBLIC KEY-----\\nMIIBIjANBg=====\\n-----END PUBLIC KEY-----",
		"app.cors.allowed-origins=http://localhost:5173", "app.minio.endpoint=http://localhost:9000",
		"app.minio.access-key=test", "app.minio.secret-key=test"})
class VotingCriteriaControllerTest {

	@Autowired
	MockMvc mvc;
	@MockBean
	ManageVotingCriteriaUseCase useCase;
	@MockBean
	JwtProvider jwtProvider;

	static final UUID USER_ID = UUID.randomUUID();
	static final UUID HACKATHON_ID = UUID.randomUUID();
	static final UUID CRITERIA_ID = UUID.randomUUID();

	static VotingCriteria criteria() {
		return new VotingCriteria(HACKATHON_ID, "Code Quality", "How clean is the code", 40, 1);
	}

	@Test
	void list_returns_criteria() throws Exception {
		when(useCase.listForHackathon(HACKATHON_ID)).thenReturn(List.of(criteria()));

		mvc.perform(
				get("/api/v1/hackathons/" + HACKATHON_ID + "/voting-criteria").with(MockAuthHelper.asManager(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].name").value("Code Quality"))
				.andExpect(jsonPath("$[0].weight").value(40));
	}

	@Test
	void list_unauthenticated_returns_401() throws Exception {
		mvc.perform(get("/api/v1/hackathons/" + HACKATHON_ID + "/voting-criteria"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void create_valid_returns_201() throws Exception {
		when(useCase.create(any(), anyString(), anyString(), anyInt(), anyInt())).thenReturn(criteria());

		mvc.perform(post("/api/v1/hackathons/" + HACKATHON_ID + "/voting-criteria")
				.with(MockAuthHelper.asManager(USER_ID)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Code Quality\",\"description\":\"Clean code\",\"weight\":40,\"displayOrder\":1}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.name").value("Code Quality"));
	}

	@Test
	void create_weight_over_100_returns_400() throws Exception {
		mvc.perform(post("/api/v1/hackathons/" + HACKATHON_ID + "/voting-criteria")
				.with(MockAuthHelper.asManager(USER_ID)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Q\",\"weight\":150,\"displayOrder\":1}")).andExpect(status().isBadRequest());
	}

	@Test
	void create_weight_exceeds_hackathon_limit_returns_400() throws Exception {
		when(useCase.create(any(), anyString(), any(), anyInt(), anyInt()))
				.thenThrow(new ManageVotingCriteriaUseCase.WeightExceedsLimitException(40, 100));

		mvc.perform(post("/api/v1/hackathons/" + HACKATHON_ID + "/voting-criteria")
				.with(MockAuthHelper.asManager(USER_ID)).contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"Q\",\"weight\":40,\"displayOrder\":1}")).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.title").value("Weight Limit Exceeded"));
	}

	@Test
	void delete_returns_204() throws Exception {
		mvc.perform(delete("/api/v1/hackathons/" + HACKATHON_ID + "/voting-criteria/" + CRITERIA_ID)
				.with(MockAuthHelper.asManager(USER_ID))).andExpect(status().isNoContent());

		verify(useCase).delete(HACKATHON_ID, CRITERIA_ID);
	}

	@Test
	void delete_unauthenticated_returns_401() throws Exception {
		mvc.perform(delete("/api/v1/hackathons/" + HACKATHON_ID + "/voting-criteria/" + CRITERIA_ID))
				.andExpect(status().isUnauthorized());
	}
}
