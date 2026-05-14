package wtf.hackhub.support;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base class for integration tests that need a real PostgreSQL database. Single
 * container shared across all subclasses (reuse=true in Testcontainers). Each
 * test method gets a clean slate via truncate in @BeforeEach.
 *
 * Activates the "integrationtest" profile which loads
 * application-integrationtest.yml — contains real RSA keys for JwtProvider.
 */
@Tag("integration")
@SpringBootTest
@Testcontainers
@ActiveProfiles("integrationtest")
public abstract class PostgresIntegrationTest {

	@Container
	static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
			.withDatabaseName("hackhub_test").withUsername("hackhub").withPassword("hackhub").withReuse(true);

	@DynamicPropertySource
	static void configureDataSource(DynamicPropertyRegistry registry) {
		registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
		registry.add("spring.datasource.username", POSTGRES::getUsername);
		registry.add("spring.datasource.password", POSTGRES::getPassword);
	}

	@Autowired
	protected JdbcTemplate jdbc;

	@BeforeEach
	void truncateTables() {
		jdbc.execute("""
				TRUNCATE TABLE
				    idea_scores, idea_votes, comments, ideas,
				    voting_criteria, chat_messages, notifications,
				    team_members, teams,
				    hackathons, organization_members, organizations,
				    refresh_tokens, profiles
				RESTART IDENTITY CASCADE
				""");
	}

	/** Inserts a profile with a dummy bcrypt hash. Convenience for test setup. */
	protected String insertProfile(String email, String name, String role) {
		return jdbc.queryForObject(
				"INSERT INTO profiles (email, name, password_hash, role) VALUES (?,?,?,?) RETURNING id::text",
				String.class, email, name, "$2a$12$testhashedpassword", role);
	}

	/** Inserts a profile with a real bcrypt hash for password 'Test1234!'. */
	protected String insertProfileWithPassword(String email, String name, String role) {
		// bcrypt of "Test1234!" with cost 12
		String hash = "$2a$12$K9P2F5VK8Y4qL3N1mX7uZOdYxWrA6bCe0fHiJkMnPqStUvWxYzABC";
		return jdbc.queryForObject(
				"INSERT INTO profiles (email, name, password_hash, role) VALUES (?,?,?,?) RETURNING id::text",
				String.class, email, name, hash, role);
	}
}
