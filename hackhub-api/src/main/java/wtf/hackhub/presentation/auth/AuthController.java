package wtf.hackhub.presentation.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.auth.LoginUseCase;
import wtf.hackhub.application.auth.LogoutUseCase;
import wtf.hackhub.application.auth.RefreshTokenUseCase;
import wtf.hackhub.application.auth.RegisterUseCase;
import wtf.hackhub.domain.Profile;

import java.time.Duration;
import java.util.Arrays;
import java.util.UUID;

@Tag(name = "Auth", description = "Registration, login, token refresh, and logout")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private static final String REFRESH_COOKIE = "refresh_token";
	private static final Duration REFRESH_COOKIE_TTL = Duration.ofDays(7);

	private final RegisterUseCase registerUseCase;
	private final LoginUseCase loginUseCase;
	private final RefreshTokenUseCase refreshTokenUseCase;
	private final LogoutUseCase logoutUseCase;

	public AuthController(RegisterUseCase registerUseCase, LoginUseCase loginUseCase,
			RefreshTokenUseCase refreshTokenUseCase, LogoutUseCase logoutUseCase) {
		this.registerUseCase = registerUseCase;
		this.loginUseCase = loginUseCase;
		this.refreshTokenUseCase = refreshTokenUseCase;
		this.logoutUseCase = logoutUseCase;
	}

	@Operation(summary = "Register a new user account")
	@ApiResponses({@ApiResponse(responseCode = "201", description = "Account created"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "409", description = "Email already in use")})
	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
		Profile profile = registerUseCase.execute(request.email(), request.name(), request.password());
		LoginUseCase.TokenPair tokens = loginUseCase.execute(request.email(), request.password());
		return ResponseEntity.status(HttpStatus.CREATED)
				.header(HttpHeaders.SET_COOKIE, refreshCookie(tokens.refreshToken()).toString())
				.body(AuthResponse.from(tokens.accessToken(), profile));
	}

	@Operation(summary = "Authenticate with email and password")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Login successful"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Invalid credentials")})
	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
		LoginUseCase.TokenPair tokens = loginUseCase.execute(request.email(), request.password());
		return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, refreshCookie(tokens.refreshToken()).toString())
				.body(AuthResponse.from(tokens.accessToken(), tokens.profile()));
	}

	@Operation(summary = "Exchange a refresh token for a new access token")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Token refreshed"),
			@ApiResponse(responseCode = "401", description = "Refresh token missing or invalid")})
	@PostMapping("/refresh")
	public ResponseEntity<AuthResponse> refresh(HttpServletRequest request) {
		String rawToken = extractRefreshCookie(request);
		if (rawToken == null) {
			throw new RefreshTokenUseCase.InvalidRefreshTokenException();
		}
		LoginUseCase.TokenPair tokens = refreshTokenUseCase.execute(rawToken);
		return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, refreshCookie(tokens.refreshToken()).toString())
				.body(AuthResponse.from(tokens.accessToken(), tokens.profile()));
	}

	@Operation(summary = "Revoke the current session and clear the refresh cookie")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Logged out"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@PostMapping("/logout")
	public ResponseEntity<Void> logout(@AuthenticationPrincipal UUID userId) {
		logoutUseCase.execute(userId);
		return ResponseEntity.noContent().header(HttpHeaders.SET_COOKIE, clearCookie().toString()).build();
	}

	// ── helpers ───────────────────────────────────────────────────────────────

	private ResponseCookie refreshCookie(String token) {
		return ResponseCookie.from(REFRESH_COOKIE, token).httpOnly(true).secure(true).path("/api/v1/auth")
				.maxAge(REFRESH_COOKIE_TTL).sameSite("Strict").build();
	}

	private ResponseCookie clearCookie() {
		return ResponseCookie.from(REFRESH_COOKIE, "").httpOnly(true).secure(true).path("/api/v1/auth").maxAge(0)
				.sameSite("Strict").build();
	}

	private String extractRefreshCookie(HttpServletRequest request) {
		if (request.getCookies() == null)
			return null;
		return Arrays.stream(request.getCookies()).filter(c -> REFRESH_COOKIE.equals(c.getName()))
				.map(c -> c.getValue()).findFirst().orElse(null);
	}
}
