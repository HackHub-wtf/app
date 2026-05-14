package wtf.hackhub.presentation.auth;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import wtf.hackhub.application.auth.LoginUseCase;
import wtf.hackhub.application.auth.LogoutUseCase;
import wtf.hackhub.application.auth.RefreshTokenUseCase;
import wtf.hackhub.application.auth.RegisterUseCase;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.config.SecurityConfig;
import wtf.hackhub.infrastructure.security.JwtAuthFilter;
import wtf.hackhub.infrastructure.security.JwtProvider;
import wtf.hackhub.presentation.common.GlobalExceptionHandler;
import wtf.hackhub.support.MockAuthHelper;

import jakarta.servlet.http.Cookie;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
		"app.jwt.private-key=-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBg=====\\n-----END PRIVATE KEY-----",
		"app.jwt.public-key=-----BEGIN PUBLIC KEY-----\\nMIIBIjANBg=====\\n-----END PUBLIC KEY-----",
		"app.cors.allowed-origins=http://localhost:5173", "app.minio.endpoint=http://localhost:9000",
		"app.minio.access-key=test", "app.minio.secret-key=test"})
class AuthControllerTest {

	@Autowired
	MockMvc mvc;
	@MockBean
	RegisterUseCase registerUseCase;
	@MockBean
	LoginUseCase loginUseCase;
	@MockBean
	RefreshTokenUseCase refreshTokenUseCase;
	@MockBean
	LogoutUseCase logoutUseCase;
	@MockBean
	JwtProvider jwtProvider;

	static final UUID USER_ID = UUID.randomUUID();

	static Profile profile() {
		return new Profile("a@b.com", "Alice", "hashed");
	}

	// ── register ──────────────────────────────────────────────────────────────

	@Test
	void register_valid_returns_201() throws Exception {
		Profile p = profile();
		when(registerUseCase.execute(any(), any(), any())).thenReturn(p);
		when(loginUseCase.execute(any(), any())).thenReturn(new LoginUseCase.TokenPair("access.tok", "raw.refresh", p));

		mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"a@b.com\",\"name\":\"Alice\",\"password\":\"password123\"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.accessToken").value("access.tok"))
				.andExpect(jsonPath("$.user.email").value("a@b.com")).andExpect(cookie().exists("refresh_token"));
	}

	@Test
	void register_missing_fields_returns_400() throws Exception {
		mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.title").value("Validation Failed"));
	}

	@Test
	void register_duplicate_email_returns_409() throws Exception {
		when(registerUseCase.execute(any(), any(), any()))
				.thenThrow(new RegisterUseCase.EmailAlreadyRegisteredException("a@b.com"));

		mvc.perform(post("/api/v1/auth/register").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"a@b.com\",\"name\":\"Alice\",\"password\":\"password123\"}"))
				.andExpect(status().isConflict()).andExpect(jsonPath("$.title").value("Email Already Registered"));
	}

	// ── login ─────────────────────────────────────────────────────────────────

	@Test
	void login_valid_returns_200_with_cookie() throws Exception {
		Profile p = profile();
		when(loginUseCase.execute(any(), any())).thenReturn(new LoginUseCase.TokenPair("access.tok", "raw.refresh", p));

		mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"a@b.com\",\"password\":\"secret\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").value("access.tok")).andExpect(cookie().exists("refresh_token"));
	}

	@Test
	void login_invalid_credentials_returns_401() throws Exception {
		when(loginUseCase.execute(any(), any())).thenThrow(new LoginUseCase.InvalidCredentialsException());

		mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"email\":\"a@b.com\",\"password\":\"wrong\"}")).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.title").value("Invalid Credentials"));
	}

	// ── refresh ───────────────────────────────────────────────────────────────

	@Test
	void refresh_with_valid_cookie_returns_new_token() throws Exception {
		Profile p = profile();
		when(refreshTokenUseCase.execute("raw.refresh"))
				.thenReturn(new LoginUseCase.TokenPair("new.access", "new.refresh", p));

		mvc.perform(post("/api/v1/auth/refresh").cookie(new Cookie("refresh_token", "raw.refresh")))
				.andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").value("new.access"))
				.andExpect(cookie().exists("refresh_token"));
	}

	@Test
	void refresh_without_cookie_returns_401() throws Exception {
		mvc.perform(post("/api/v1/auth/refresh")).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.title").value("Invalid Refresh Token"));
	}

	@Test
	void refresh_with_expired_token_returns_401() throws Exception {
		when(refreshTokenUseCase.execute(any())).thenThrow(new RefreshTokenUseCase.InvalidRefreshTokenException());

		mvc.perform(post("/api/v1/auth/refresh").cookie(new Cookie("refresh_token", "expired.token")))
				.andExpect(status().isUnauthorized());
	}

	// ── logout ────────────────────────────────────────────────────────────────

	@Test
	void logout_authenticated_returns_204() throws Exception {
		mvc.perform(post("/api/v1/auth/logout").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNoContent());

		verify(logoutUseCase).execute(USER_ID);
	}

	@Test
	void logout_unauthenticated_returns_401() throws Exception {
		mvc.perform(post("/api/v1/auth/logout")).andExpect(status().isUnauthorized());
	}
}
