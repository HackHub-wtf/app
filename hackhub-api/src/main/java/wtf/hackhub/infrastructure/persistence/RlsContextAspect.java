package wtf.hackhub.infrastructure.persistence;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Sets PostgreSQL session variables for RLS policies at the start of each
 *
 * @Transactional application service call.
 *
 *                Variables consumed by V003 RLS: app_current_user_id() →
 *                current_setting('app.current_user_id', true)::UUID
 *                app_current_user_role() →
 *                current_setting('app.current_user_role', true)
 *
 *                SET LOCAL scopes the variable to the current transaction.
 *                Since Spring starts the transaction before this aspect fires
 *                (via @Transactional), the variable is visible for the duration
 *                of that transaction.
 *
 *                Primary enforcement: Spring Security @PreAuthorize. This
 *                aspect is defense-in-depth: direct psql access without the app
 *                will be blocked.
 */
@Aspect
@Component
public class RlsContextAspect {

	private final JdbcTemplate jdbc;

	public RlsContextAspect(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Around("within(wtf.hackhub.application..*) && "
			+ "@annotation(org.springframework.transaction.annotation.Transactional)")
	public Object setRlsContext(ProceedingJoinPoint pjp) throws Throwable {
		Authentication auth = SecurityContextHolder.getContext().getAuthentication();

		if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UUID userId) {
			String role = auth.getAuthorities().stream().map(a -> a.getAuthority().replace("ROLE_", "").toLowerCase())
					.findFirst().orElse("participant");

			jdbc.execute("SET LOCAL app.current_user_id = '" + userId + "'");
			jdbc.execute("SET LOCAL app.current_user_role = '" + role + "'");
		}

		return pjp.proceed();
	}
}
