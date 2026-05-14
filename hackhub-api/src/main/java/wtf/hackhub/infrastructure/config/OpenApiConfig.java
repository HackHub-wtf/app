package wtf.hackhub.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springdoc.core.models.GroupedOpenApi;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

	private static final String BEARER_AUTH = "bearerAuth";

	@Bean
	public OpenAPI hackHubOpenApi() {
		return new OpenAPI()
				.info(new Info().title("HackHub API").version("0.1.0")
						.description("Hackathon management platform — REST API")
						.contact(new Contact().name("HackHub").url("https://hackhub.wtf")))
				.addSecurityItem(new SecurityRequirement().addList(BEARER_AUTH))
				.components(new Components().addSecuritySchemes(BEARER_AUTH, new SecurityScheme().name(BEARER_AUTH)
						.type(SecurityScheme.Type.HTTP).scheme("bearer").bearerFormat("JWT")));
	}

	@Bean
	public GroupedOpenApi publicApi() {
		return GroupedOpenApi.builder().group("public").pathsToMatch("/api/v1/auth/**").build();
	}

	@Bean
	public GroupedOpenApi protectedApi() {
		return GroupedOpenApi.builder().group("protected").pathsToExclude("/api/v1/auth/**").build();
	}
}
