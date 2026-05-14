package wtf.hackhub.presentation.auth;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import wtf.hackhub.application.auth.LoginUseCase;
import wtf.hackhub.application.auth.LogoutUseCase;
import wtf.hackhub.application.auth.RefreshTokenUseCase;
import wtf.hackhub.application.auth.RegisterUseCase;
import wtf.hackhub.domain.Profile;

import java.util.Arrays;
import java.util.UUID;

@Tag(name = "Auth", description = "Registration, login, token refresh, and logout")
@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

	private static final String REFRESH_COOKIE = "refresh_token";
	private static final int REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

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
	@ResponseStatus(HttpStatus.CREATED)
	public AuthResponse register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
		Profile profile = registerUseCase.execute(request.email(), request.name(), request.password());
		LoginUseCase.TokenPair tokens = loginUseCase.execute(request.email(), request.password());
		setRefreshCookie(response, tokens.refreshToken());
		return AuthResponse.from(tokens.accessToken(), profile);
	}

	@Operation(summary = "Authenticate with email and password")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Login successful"),
			@ApiResponse(responseCode = "400", description = "Validation failed"),
			@ApiResponse(responseCode = "401", description = "Invalid credentials")})
	@PostMapping("/login")
	public AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
		LoginUseCase.TokenPair tokens = loginUseCase.execute(request.email(), request.password());
		setRefreshCookie(response, tokens.refreshToken());
		return AuthResponse.from(tokens.accessToken(), tokens.profile());
	}

	@Operation(summary = "Exchange a refresh token for a new access token")
	@ApiResponses({@ApiResponse(responseCode = "200", description = "Token refreshed"),
			@ApiResponse(responseCode = "401", description = "Refresh token missing or invalid")})
	@PostMapping("/refresh")
	public AuthResponse refresh(HttpServletRequest request, HttpServletResponse response) {
		String rawToken = extractRefreshCookie(request);
		if (rawToken == null) {
			throw new RefreshTokenUseCase.InvalidRefreshTokenException();
		}
		LoginUseCase.TokenPair tokens = refreshTokenUseCase.execute(rawToken);
		setRefreshCookie(response, tokens.refreshToken());
		return AuthResponse.from(tokens.accessToken(), tokens.profile());
	}

	@Operation(summary = "Revoke the current session and clear the refresh cookie")
	@ApiResponses({@ApiResponse(responseCode = "204", description = "Logged out"),
			@ApiResponse(responseCode = "401", description = "Not authenticated")})
	@PostMapping("/logout")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void logout(@AuthenticationPrincipal UUID userId, HttpServletResponse response) {
		logoutUseCase.execute(userId);
		clearRefreshCookie(response);
	}

	// ── helpers ───────────────────────────────────────────────────────────────

	private void setRefreshCookie(HttpServletResponse response, String token) {
		Cookie cookie = new Cookie(REFRESH_COOKIE, token);
		cookie.setHttpOnly(true);
		cookie.setSecure(false); // set true in production (HTTPS)
		cookie.setPath("/api/v1/auth");
		cookie.setMaxAge(REFRESH_COOKIE_MAX_AGE);
		response.addCookie(cookie);
	}

	private void clearRefreshCookie(HttpServletResponse response) {
		Cookie cookie = new Cookie(REFRESH_COOKIE, "");
		cookie.setHttpOnly(true);
		cookie.setPath("/api/v1/auth");
		cookie.setMaxAge(0);
		response.addCookie(cookie);
	}

	private String extractRefreshCookie(HttpServletRequest request) {
		if (request.getCookies() == null)
			return null;
		return Arrays.stream(request.getCookies()).filter(c -> REFRESH_COOKIE.equals(c.getName())).map(Cookie::getValue)
				.findFirst().orElse(null);
	}
}
