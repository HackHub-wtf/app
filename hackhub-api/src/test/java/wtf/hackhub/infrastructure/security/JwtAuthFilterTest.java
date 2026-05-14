package wtf.hackhub.infrastructure.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class JwtAuthFilterTest {

	@Mock
	private JwtProvider jwtProvider;

	@Mock
	private HttpServletRequest request;

	@Mock
	private HttpServletResponse response;

	@Mock
	private FilterChain filterChain;

	@Mock
	private Claims claims;

	private JwtAuthFilter filter;

	@BeforeEach
	void setUp() {
		filter = new JwtAuthFilter(jwtProvider);
		SecurityContextHolder.clearContext();
	}

	@AfterEach
	void tearDown() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void no_authorization_header_passes_through_without_auth() throws Exception {
		when(request.getHeader("Authorization")).thenReturn(null);

		filter.doFilterInternal(request, response, filterChain);

		verify(filterChain).doFilter(request, response);
		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
		verifyNoInteractions(jwtProvider);
	}

	@Test
	void non_bearer_header_passes_through_without_auth() throws Exception {
		when(request.getHeader("Authorization")).thenReturn("Basic dXNlcjpwYXNz");

		filter.doFilterInternal(request, response, filterChain);

		verify(filterChain).doFilter(request, response);
		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
		verifyNoInteractions(jwtProvider);
	}

	@Test
	void valid_token_populates_security_context() throws Exception {
		UUID userId = UUID.randomUUID();
		when(request.getHeader("Authorization")).thenReturn("Bearer valid.jwt.token");
		when(jwtProvider.validateAndExtract("valid.jwt.token")).thenReturn(claims);
		when(jwtProvider.extractUserId(claims)).thenReturn(userId);
		when(jwtProvider.extractRole(claims)).thenReturn("PARTICIPANT");

		filter.doFilterInternal(request, response, filterChain);

		verify(filterChain).doFilter(request, response);
		var auth = SecurityContextHolder.getContext().getAuthentication();
		assertThat(auth).isNotNull();
		assertThat(auth.getPrincipal()).isEqualTo(userId);
		assertThat(auth.getAuthorities()).extracting("authority").containsExactly("ROLE_PARTICIPANT");
	}

	@Test
	void valid_admin_token_sets_admin_role() throws Exception {
		UUID userId = UUID.randomUUID();
		when(request.getHeader("Authorization")).thenReturn("Bearer admin.jwt.token");
		when(jwtProvider.validateAndExtract("admin.jwt.token")).thenReturn(claims);
		when(jwtProvider.extractUserId(claims)).thenReturn(userId);
		when(jwtProvider.extractRole(claims)).thenReturn("ADMIN");

		filter.doFilterInternal(request, response, filterChain);

		var auth = SecurityContextHolder.getContext().getAuthentication();
		assertThat(auth.getAuthorities()).extracting("authority").containsExactly("ROLE_ADMIN");
	}

	@Test
	void invalid_token_does_not_populate_security_context() throws Exception {
		when(request.getHeader("Authorization")).thenReturn("Bearer bad.token");
		when(jwtProvider.validateAndExtract("bad.token")).thenThrow(new JwtException("invalid"));

		filter.doFilterInternal(request, response, filterChain);

		verify(filterChain).doFilter(request, response);
		assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
	}

	@Test
	void lowercase_role_is_uppercased_for_authority() throws Exception {
		UUID userId = UUID.randomUUID();
		when(request.getHeader("Authorization")).thenReturn("Bearer tok");
		when(jwtProvider.validateAndExtract("tok")).thenReturn(claims);
		when(jwtProvider.extractUserId(claims)).thenReturn(userId);
		when(jwtProvider.extractRole(claims)).thenReturn("manager");

		filter.doFilterInternal(request, response, filterChain);

		var auth = SecurityContextHolder.getContext().getAuthentication();
		assertThat(auth.getAuthorities()).extracting("authority").containsExactly("ROLE_MANAGER");
	}
}
