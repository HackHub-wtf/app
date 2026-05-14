package wtf.hackhub.presentation.idea;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import wtf.hackhub.application.idea.*;
import wtf.hackhub.domain.Comment;
import wtf.hackhub.domain.Idea;
import wtf.hackhub.domain.IdeaScore;
import wtf.hackhub.infrastructure.config.SecurityConfig;
import wtf.hackhub.infrastructure.security.JwtAuthFilter;
import wtf.hackhub.infrastructure.security.JwtProvider;
import wtf.hackhub.presentation.common.GlobalExceptionHandler;
import wtf.hackhub.support.MockAuthHelper;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(IdeaController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
		"app.jwt.private-key=-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBg=====\\n-----END PRIVATE KEY-----",
		"app.jwt.public-key=-----BEGIN PUBLIC KEY-----\\nMIIBIjANBg=====\\n-----END PUBLIC KEY-----",
		"app.cors.allowed-origins=http://localhost:5173", "app.minio.endpoint=http://localhost:9000",
		"app.minio.access-key=test", "app.minio.secret-key=test"})
class IdeaControllerTest {

	@Autowired
	MockMvc mvc;
	@MockBean
	SubmitIdeaUseCase submitIdeaUseCase;
	@MockBean
	GetIdeasUseCase getIdeasUseCase;
	@MockBean
	VoteIdeaUseCase voteIdeaUseCase;
	@MockBean
	CommentUseCase commentUseCase;
	@MockBean
	ScoreIdeaUseCase scoreIdeaUseCase;
	@MockBean
	JwtProvider jwtProvider;

	static final UUID USER_ID = UUID.randomUUID();
	static final UUID HACKATHON_ID = UUID.randomUUID();
	static final UUID IDEA_ID = UUID.randomUUID();

	static Idea idea() {
		return new Idea("My Idea", "Desc", HACKATHON_ID, null, USER_ID, "tech");
	}

	@Test
	void list_ideas_returns_page() throws Exception {
		when(getIdeasUseCase.listByHackathon(any(), any())).thenReturn(new PageImpl<>(List.of(idea())));
		mvc.perform(get("/api/v1/hackathons/" + HACKATHON_ID + "/ideas").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.content[0].title").value("My Idea"));
	}

	@Test
	void list_ideas_unauthenticated_returns_401() throws Exception {
		mvc.perform(get("/api/v1/hackathons/" + HACKATHON_ID + "/ideas")).andExpect(status().isUnauthorized());
	}

	@Test
	void get_by_id_found() throws Exception {
		when(getIdeasUseCase.getById(IDEA_ID)).thenReturn(idea());
		mvc.perform(get("/api/v1/ideas/" + IDEA_ID).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.title").value("My Idea"));
	}

	@Test
	void get_by_id_not_found_returns_404() throws Exception {
		when(getIdeasUseCase.getById(IDEA_ID)).thenThrow(new VoteIdeaUseCase.IdeaNotFoundException(IDEA_ID));
		mvc.perform(get("/api/v1/ideas/" + IDEA_ID).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNotFound());
	}

	@Test
	void create_idea_valid_returns_201() throws Exception {
		when(submitIdeaUseCase.execute(any(), any(), any(), any(), any(), any(), any())).thenReturn(idea());
		mvc.perform(post("/api/v1/hackathons/" + HACKATHON_ID + "/ideas").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"title\":\"My Idea\",\"description\":\"Desc\",\"category\":\"tech\"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.title").value("My Idea"));
	}

	@Test
	void create_idea_missing_title_returns_400() throws Exception {
		mvc.perform(post("/api/v1/hackathons/" + HACKATHON_ID + "/ideas").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"description\":\"d\",\"category\":\"tech\"}"))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.title").value("Validation Failed"));
	}

	@Test
	void delete_idea_returns_204() throws Exception {
		mvc.perform(delete("/api/v1/ideas/" + IDEA_ID).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNoContent());
		verify(submitIdeaUseCase).delete(IDEA_ID, USER_ID);
	}

	@Test
	void delete_by_non_owner_returns_403() throws Exception {
		doThrow(new SubmitIdeaUseCase.IdeaAccessDeniedException(IDEA_ID, USER_ID)).when(submitIdeaUseCase).delete(any(),
				any());
		mvc.perform(delete("/api/v1/ideas/" + IDEA_ID).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isForbidden());
	}

	@Test
	void vote_returns_toggle_state() throws Exception {
		when(voteIdeaUseCase.execute(IDEA_ID, USER_ID)).thenReturn(new VoteIdeaUseCase.Result(true, 5L));
		mvc.perform(post("/api/v1/ideas/" + IDEA_ID + "/votes").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.voted").value(true))
				.andExpect(jsonPath("$.voteCount").value(5));
	}

	@Test
	void vote_unknown_idea_returns_404() throws Exception {
		when(voteIdeaUseCase.execute(any(), any())).thenThrow(new VoteIdeaUseCase.IdeaNotFoundException(IDEA_ID));
		mvc.perform(post("/api/v1/ideas/" + IDEA_ID + "/votes").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNotFound());
	}

	@Test
	void list_comments_returns_array() throws Exception {
		when(commentUseCase.listForIdea(IDEA_ID)).thenReturn(List.of(new Comment(IDEA_ID, USER_ID, "nice!")));
		mvc.perform(get("/api/v1/ideas/" + IDEA_ID + "/comments").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].content").value("nice!"));
	}

	@Test
	void add_comment_returns_201() throws Exception {
		when(commentUseCase.add(any(), any(), any())).thenReturn(new Comment(IDEA_ID, USER_ID, "great"));
		mvc.perform(post("/api/v1/ideas/" + IDEA_ID + "/comments").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"great\"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.content").value("great"));
	}

	@Test
	void add_comment_missing_content_returns_400() throws Exception {
		mvc.perform(post("/api/v1/ideas/" + IDEA_ID + "/comments").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"\"}"))
				.andExpect(status().isBadRequest());
	}

	// ── score ─────────────────────────────────────────────────────────────────

	@Test
	void score_idea_returns_200() throws Exception {
		UUID criteriaId = UUID.randomUUID();
		IdeaScore score = new IdeaScore(IDEA_ID, USER_ID, criteriaId, 8);
		when(scoreIdeaUseCase.execute(any(), any(), any(), anyInt())).thenReturn(score);

		mvc.perform(post("/api/v1/ideas/" + IDEA_ID + "/scores").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"criteriaId\":\"" + criteriaId + "\",\"score\":8}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.score").value(8));
	}

	@Test
	void score_unknown_criteria_returns_400() throws Exception {
		UUID criteriaId = UUID.randomUUID();
		when(scoreIdeaUseCase.execute(any(), any(), any(), anyInt()))
				.thenThrow(new ScoreIdeaUseCase.CriteriaNotFoundException(criteriaId));

		mvc.perform(post("/api/v1/ideas/" + IDEA_ID + "/scores").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"criteriaId\":\"" + criteriaId + "\",\"score\":8}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void score_criteria_mismatch_returns_400() throws Exception {
		UUID criteriaId = UUID.randomUUID();
		when(scoreIdeaUseCase.execute(any(), any(), any(), anyInt()))
				.thenThrow(new ScoreIdeaUseCase.CriteriaMismatchException(criteriaId, HACKATHON_ID));

		mvc.perform(post("/api/v1/ideas/" + IDEA_ID + "/scores").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"criteriaId\":\"" + criteriaId + "\",\"score\":8}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void score_invalid_score_value_returns_400() throws Exception {
		UUID criteriaId = UUID.randomUUID();
		when(scoreIdeaUseCase.execute(any(), any(), any(), anyInt()))
				.thenThrow(new wtf.hackhub.domain.IdeaScore.InvalidScoreException(150));

		mvc.perform(post("/api/v1/ideas/" + IDEA_ID + "/scores").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON)
				.content("{\"criteriaId\":\"" + criteriaId + "\",\"score\":150}")).andExpect(status().isBadRequest());
	}
}
