package wtf.hackhub.infrastructure.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import wtf.hackhub.infrastructure.security.JwtAuthFilter;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@EnableConfigurationProperties(AppProperties.class)
public class SecurityConfig {

	private final JwtAuthFilter jwtAuthFilter;
	private final AppProperties properties;

	public SecurityConfig(JwtAuthFilter jwtAuthFilter, AppProperties properties) {
		this.jwtAuthFilter = jwtAuthFilter;
		this.properties = properties;
	}

	@Bean
	public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
		return http.csrf(AbstractHttpConfigurer::disable)
				.cors(cors -> cors.configurationSource(corsConfigurationSource()))
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth.requestMatchers(HttpMethod.POST, "/api/v1/auth/register")
						.permitAll().requestMatchers(HttpMethod.POST, "/api/v1/auth/login").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/v1/auth/refresh").permitAll().requestMatchers("/ws/**")
						.permitAll() // STOMP handshake
						.requestMatchers("/actuator/health").permitAll() // Load balancer probe
						.requestMatchers("/swagger-ui/**", "/swagger-ui.html").permitAll() // API docs UI
						.requestMatchers("/v3/api-docs/**").permitAll() // OpenAPI spec
						.requestMatchers(HttpMethod.GET, "/api/v1/hackathons/*/leaderboard").permitAll() // public
																											// leaderboard
						.requestMatchers(HttpMethod.GET, "/api/v1/invitations/**").permitAll() // public invitation
																								// preview
						.anyRequest().authenticated())
				.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
				// Return 401 (not 403) for unauthenticated requests
				.exceptionHandling(
						ex -> ex.authenticationEntryPoint((request, response, authException) -> response.sendError(
								jakarta.servlet.http.HttpServletResponse.SC_UNAUTHORIZED, "Authentication required")))
				.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder(12);
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource() {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(properties.cors().allowedOriginsList());
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
		config.setAllowedHeaders(List.of("*"));
		config.setAllowCredentials(true); // needed for httpOnly cookie (refresh token)
		config.setMaxAge(3600L);

		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/**", config);
		return source;
	}
}
