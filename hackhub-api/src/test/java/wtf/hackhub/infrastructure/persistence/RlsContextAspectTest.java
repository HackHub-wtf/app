package wtf.hackhub.infrastructure.persistence;

import org.aspectj.lang.ProceedingJoinPoint;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RlsContextAspectTest {

	@Mock
	JdbcTemplate jdbc;
	@Mock
	ProceedingJoinPoint pjp;
	@InjectMocks
	RlsContextAspect aspect;

	@AfterEach
	void clearContext() {
		SecurityContextHolder.clearContext();
	}

	@Test
	void sets_user_id_and_role_when_authenticated() throws Throwable {
		UUID userId = UUID.randomUUID();
		var auth = new UsernamePasswordAuthenticationToken(userId, null,
				List.of(new SimpleGrantedAuthority("ROLE_PARTICIPANT")));
		SecurityContextHolder.getContext().setAuthentication(auth);
		when(pjp.proceed()).thenReturn(null);

		aspect.setRlsContext(pjp);

		verify(jdbc).execute(contains(userId.toString()));
		verify(jdbc).execute(contains("participant"));
		verify(pjp).proceed();
	}

	@Test
	void skips_set_when_not_authenticated() throws Throwable {
		SecurityContextHolder.clearContext();
		when(pjp.proceed()).thenReturn(null);

		aspect.setRlsContext(pjp);

		verifyNoInteractions(jdbc);
		verify(pjp).proceed();
	}

	@Test
	void admin_role_set_correctly() throws Throwable {
		UUID userId = UUID.randomUUID();
		var auth = new UsernamePasswordAuthenticationToken(userId, null,
				List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
		SecurityContextHolder.getContext().setAuthentication(auth);
		when(pjp.proceed()).thenReturn(null);

		aspect.setRlsContext(pjp);

		verify(jdbc).execute(contains("admin"));
	}

	@Test
	void rethrows_exception_from_join_point() throws Throwable {
		UUID userId = UUID.randomUUID();
		var auth = new UsernamePasswordAuthenticationToken(userId, null,
				List.of(new SimpleGrantedAuthority("ROLE_MANAGER")));
		SecurityContextHolder.getContext().setAuthentication(auth);
		when(pjp.proceed()).thenThrow(new RuntimeException("db error"));

		org.assertj.core.api.Assertions.assertThatThrownBy(() -> aspect.setRlsContext(pjp))
				.isInstanceOf(RuntimeException.class).hasMessage("db error");
	}
}
