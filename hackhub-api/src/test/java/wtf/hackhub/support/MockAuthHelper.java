package wtf.hackhub.support;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;
import java.util.UUID;

/**
 * Provides pre-built authentication post-processors for @WebMvcTest slices.
 * Uses authentication() not jwt() — avoids needing the OAuth2 resource server
 * dependency.
 */
public final class MockAuthHelper {

	private MockAuthHelper() {
	}

	public static RequestPostProcessor asParticipant(UUID userId) {
		return SecurityMockMvcRequestPostProcessors.authentication(new UsernamePasswordAuthenticationToken(userId, null,
				List.of(new SimpleGrantedAuthority("ROLE_PARTICIPANT"))));
	}

	public static RequestPostProcessor asManager(UUID userId) {
		return SecurityMockMvcRequestPostProcessors.authentication(new UsernamePasswordAuthenticationToken(userId, null,
				List.of(new SimpleGrantedAuthority("ROLE_MANAGER"))));
	}

	public static RequestPostProcessor asAdmin(UUID userId) {
		return SecurityMockMvcRequestPostProcessors.authentication(new UsernamePasswordAuthenticationToken(userId, null,
				List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
	}
}
