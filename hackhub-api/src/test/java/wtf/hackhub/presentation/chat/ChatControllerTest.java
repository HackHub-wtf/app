package wtf.hackhub.presentation.chat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import wtf.hackhub.domain.ChatMessage;
import wtf.hackhub.infrastructure.config.SecurityConfig;
import wtf.hackhub.infrastructure.persistence.chat.ChatMessageRepository;
import wtf.hackhub.infrastructure.persistence.team.TeamMemberRepository;
import wtf.hackhub.infrastructure.security.JwtAuthFilter;
import wtf.hackhub.infrastructure.security.JwtProvider;
import wtf.hackhub.presentation.common.GlobalExceptionHandler;
import wtf.hackhub.support.MockAuthHelper;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ChatController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
		"app.jwt.private-key=-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBg=====\\n-----END PRIVATE KEY-----",
		"app.jwt.public-key=-----BEGIN PUBLIC KEY-----\\nMIIBIjANBg=====\\n-----END PUBLIC KEY-----",
		"app.cors.allowed-origins=http://localhost:5173", "app.minio.endpoint=http://localhost:9000",
		"app.minio.access-key=test", "app.minio.secret-key=test"})
class ChatControllerTest {

	@Autowired
	MockMvc mvc;

	@MockBean
	ChatMessageRepository chatMessageRepository;
	@MockBean
	TeamMemberRepository teamMemberRepository;
	@MockBean
	JwtProvider jwtProvider;

	static final UUID USER_ID = UUID.randomUUID();
	static final UUID TEAM_ID = UUID.randomUUID();

	@Test
	void list_messages_returns_200() throws Exception {
		ChatMessage msg = new ChatMessage(TEAM_ID, USER_ID, "Hello team!", "text", null, null);
		when(chatMessageRepository.findByTeamIdOrderByCreatedAtAsc(eq(TEAM_ID), any(Pageable.class)))
				.thenReturn(List.of(msg));

		mvc.perform(get("/api/v1/teams/" + TEAM_ID + "/messages").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].content").value("Hello team!"))
				.andExpect(jsonPath("$[0].messageType").value("text"));
	}

	@Test
	void list_messages_unauthenticated_returns_401() throws Exception {
		mvc.perform(get("/api/v1/teams/" + TEAM_ID + "/messages")).andExpect(status().isUnauthorized());
	}

	@Test
	void list_messages_empty_team_returns_empty_list() throws Exception {
		when(chatMessageRepository.findByTeamIdOrderByCreatedAtAsc(any(), any(Pageable.class))).thenReturn(List.of());

		mvc.perform(get("/api/v1/teams/" + TEAM_ID + "/messages").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$").isEmpty());
	}

	@Test
	void list_messages_with_page_params_returns_200() throws Exception {
		ChatMessage msg = new ChatMessage(TEAM_ID, USER_ID, "Paginated msg", "text", null, null);
		when(chatMessageRepository.findByTeamIdOrderByCreatedAtAsc(eq(TEAM_ID), any(Pageable.class)))
				.thenReturn(List.of(msg));

		mvc.perform(get("/api/v1/teams/" + TEAM_ID + "/messages?page=0&size=10")
				.with(MockAuthHelper.asParticipant(USER_ID))).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].content").value("Paginated msg"));
	}
}
