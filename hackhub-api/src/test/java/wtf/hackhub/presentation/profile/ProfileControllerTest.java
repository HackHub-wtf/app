package wtf.hackhub.presentation.profile;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import wtf.hackhub.application.profile.UpdateProfileUseCase;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.config.SecurityConfig;
import wtf.hackhub.infrastructure.security.JwtAuthFilter;
import wtf.hackhub.infrastructure.security.JwtProvider;
import wtf.hackhub.presentation.common.GlobalExceptionHandler;
import wtf.hackhub.support.MockAuthHelper;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ProfileController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
		"app.jwt.private-key=-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBg=====\\n-----END PRIVATE KEY-----",
		"app.jwt.public-key=-----BEGIN PUBLIC KEY-----\\nMIIBIjANBg=====\\n-----END PUBLIC KEY-----",
		"app.cors.allowed-origins=http://localhost:5173", "app.minio.endpoint=http://localhost:9000",
		"app.minio.access-key=test", "app.minio.secret-key=test"})
class ProfileControllerTest {

	@Autowired
	MockMvc mvc;
	@MockBean
	UpdateProfileUseCase useCase;
	@MockBean
	JwtProvider jwtProvider;

	static final UUID USER_ID = UUID.randomUUID();

	@Test
	void get_me_returns_profile() throws Exception {
		when(useCase.getById(USER_ID)).thenReturn(new Profile("me@test.com", "Alice", "h"));

		mvc.perform(get("/api/v1/profiles/me").with(MockAuthHelper.asParticipant(USER_ID))).andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("me@test.com")).andExpect(jsonPath("$.role").value("participant"));
	}

	@Test
	void get_me_unauthenticated_returns_401() throws Exception {
		mvc.perform(get("/api/v1/profiles/me")).andExpect(status().isUnauthorized());
	}

	@Test
	void patch_me_updates_profile() throws Exception {
		Profile updated = new Profile("me@test.com", "New Name", "h");
		when(useCase.update(eq(USER_ID), eq("New Name"), any(), any())).thenReturn(updated);

		mvc.perform(patch("/api/v1/profiles/me").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"New Name\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("New Name"));
	}

	@Test
	void get_profile_not_found_returns_404() throws Exception {
		UUID other = UUID.randomUUID();
		when(useCase.getById(other)).thenThrow(new UpdateProfileUseCase.ProfileNotFoundException(other));

		mvc.perform(get("/api/v1/profiles/" + other).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNotFound());
	}
}
