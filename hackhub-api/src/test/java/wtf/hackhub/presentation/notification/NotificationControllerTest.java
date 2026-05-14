package wtf.hackhub.presentation.notification;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import wtf.hackhub.application.notification.NotificationService;
import wtf.hackhub.domain.Notification;
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

@WebMvcTest(NotificationController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
		"app.jwt.private-key=-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBg=====\\n-----END PRIVATE KEY-----",
		"app.jwt.public-key=-----BEGIN PUBLIC KEY-----\\nMIIBIjANBg=====\\n-----END PUBLIC KEY-----",
		"app.cors.allowed-origins=http://localhost:5173", "app.minio.endpoint=http://localhost:9000",
		"app.minio.access-key=test", "app.minio.secret-key=test"})
class NotificationControllerTest {

	@Autowired
	MockMvc mvc;

	@MockBean
	NotificationService notificationService;
	@MockBean
	JwtProvider jwtProvider;

	static final UUID USER_ID = UUID.randomUUID();

	private Notification sampleNotification() {
		return new Notification(USER_ID, "Test Title", "Test message", Notification.Type.INFO, null);
	}

	@Test
	void list_notifications_returns_page() throws Exception {
		when(notificationService.listForUser(eq(USER_ID), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(sampleNotification())));

		mvc.perform(get("/api/v1/notifications").with(MockAuthHelper.asParticipant(USER_ID))).andExpect(status().isOk())
				.andExpect(jsonPath("$.content[0].title").value("Test Title"))
				.andExpect(jsonPath("$.content[0].type").value("info"));
	}

	@Test
	void list_notifications_unauthenticated_returns_401() throws Exception {
		mvc.perform(get("/api/v1/notifications")).andExpect(status().isUnauthorized());
	}

	@Test
	void unread_count_returns_count() throws Exception {
		when(notificationService.countUnread(USER_ID)).thenReturn(7L);

		mvc.perform(get("/api/v1/notifications/unread-count").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.count").value(7));
	}

	@Test
	void mark_read_returns_updated_notification() throws Exception {
		UUID notifId = UUID.randomUUID();
		Notification n = sampleNotification();
		n.markRead();
		when(notificationService.markRead(eq(notifId), eq(USER_ID))).thenReturn(n);

		mvc.perform(patch("/api/v1/notifications/" + notifId + "/read").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.read").value(true));
	}

	@Test
	void mark_read_not_found_returns_404() throws Exception {
		UUID notifId = UUID.randomUUID();
		when(notificationService.markRead(any(), any()))
				.thenThrow(new NotificationService.NotificationNotFoundException(notifId));

		mvc.perform(patch("/api/v1/notifications/" + notifId + "/read").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNotFound());
	}

	@Test
	void mark_read_access_denied_returns_403() throws Exception {
		UUID notifId = UUID.randomUUID();
		when(notificationService.markRead(any(), any()))
				.thenThrow(new NotificationService.NotificationAccessDeniedException(notifId, USER_ID));

		mvc.perform(patch("/api/v1/notifications/" + notifId + "/read").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isForbidden());
	}

	@Test
	void delete_notification_returns_204() throws Exception {
		UUID notifId = UUID.randomUUID();

		mvc.perform(delete("/api/v1/notifications/" + notifId).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNoContent());
	}

	@Test
	void mark_all_read_returns_updated_count() throws Exception {
		when(notificationService.markAllRead(USER_ID)).thenReturn(5);

		mvc.perform(post("/api/v1/notifications/read-all").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.updated").value(5));
	}
}
