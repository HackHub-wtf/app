package wtf.hackhub.presentation.admin;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import wtf.hackhub.application.admin.ListUsersUseCase;
import wtf.hackhub.application.admin.UpdateUserRoleUseCase;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.config.SecurityConfig;
import wtf.hackhub.infrastructure.persistence.hackathon.HackathonRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;
import wtf.hackhub.infrastructure.security.JwtAuthFilter;
import wtf.hackhub.infrastructure.security.JwtProvider;
import wtf.hackhub.presentation.common.GlobalExceptionHandler;
import wtf.hackhub.support.MockAuthHelper;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
		"app.jwt.private-key=-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBg=====\\n-----END PRIVATE KEY-----",
		"app.jwt.public-key=-----BEGIN PUBLIC KEY-----\\nMIIBIjANBg=====\\n-----END PUBLIC KEY-----",
		"app.cors.allowed-origins=http://localhost:5173", "app.minio.endpoint=http://localhost:9000",
		"app.minio.access-key=test", "app.minio.secret-key=test"})
class AdminControllerTest {

	@Autowired
	MockMvc mvc;

	@MockBean
	ListUsersUseCase listUsersUseCase;
	@MockBean
	UpdateUserRoleUseCase updateUserRoleUseCase;
	@MockBean
	OrganizationRepository organizationRepository;
	@MockBean
	OrganizationMemberRepository memberRepository;
	@MockBean
	HackathonRepository hackathonRepository;
	@MockBean
	JwtProvider jwtProvider;

	static final UUID ADMIN_ID = UUID.randomUUID();

	@Test
	void list_users_as_admin_returns_200() throws Exception {
		Profile p = new Profile("a@test.com", "Alice", "hash");
		when(listUsersUseCase.execute(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(p)));

		mvc.perform(get("/api/v1/admin/users").with(MockAuthHelper.asAdmin(ADMIN_ID))).andExpect(status().isOk())
				.andExpect(jsonPath("$.content[0].email").value("a@test.com"));
	}

	@Test
	void list_users_unauthenticated_returns_401() throws Exception {
		mvc.perform(get("/api/v1/admin/users")).andExpect(status().isUnauthorized());
	}

	@Test
	void update_role_returns_updated_user() throws Exception {
		UUID targetId = UUID.randomUUID();
		Profile updated = new Profile("b@test.com", "Bob", "hash");
		when(updateUserRoleUseCase.execute(eq(targetId), eq(Profile.Role.MANAGER))).thenReturn(updated);

		mvc.perform(patch("/api/v1/admin/users/" + targetId + "/role").with(MockAuthHelper.asAdmin(ADMIN_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"manager\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("b@test.com"));
	}

	@Test
	void update_role_invalid_value_returns_400() throws Exception {
		UUID targetId = UUID.randomUUID();

		mvc.perform(patch("/api/v1/admin/users/" + targetId + "/role").with(MockAuthHelper.asAdmin(ADMIN_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"superuser\"}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void list_organizations_returns_page() throws Exception {
		UUID createdBy = UUID.randomUUID();
		Organization org = new Organization("Acme", "acme", createdBy);
		when(organizationRepository.findAll(any(Pageable.class))).thenReturn(new PageImpl<>(List.of(org)));
		when(memberRepository.countByOrganizationId(any())).thenReturn(3L);
		when(hackathonRepository.countByOrganizationId(any())).thenReturn(1L);

		mvc.perform(get("/api/v1/admin/organizations").with(MockAuthHelper.asAdmin(ADMIN_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.content[0].name").value("Acme"))
				.andExpect(jsonPath("$.content[0].memberCount").value(3));
	}

	@Test
	void delete_organization_not_found_returns_404() throws Exception {
		UUID orgId = UUID.randomUUID();
		when(organizationRepository.existsById(orgId)).thenReturn(false);

		mvc.perform(delete("/api/v1/admin/organizations/" + orgId).with(MockAuthHelper.asAdmin(ADMIN_ID)))
				.andExpect(status().isNotFound());
	}

	@Test
	void delete_organization_returns_204() throws Exception {
		UUID orgId = UUID.randomUUID();
		when(organizationRepository.existsById(orgId)).thenReturn(true);

		mvc.perform(delete("/api/v1/admin/organizations/" + orgId).with(MockAuthHelper.asAdmin(ADMIN_ID)))
				.andExpect(status().isNoContent());
	}

	@Test
	void patch_organization_not_found_returns_404() throws Exception {
		UUID orgId = UUID.randomUUID();
		when(organizationRepository.findById(orgId)).thenReturn(Optional.empty());

		mvc.perform(patch("/api/v1/admin/organizations/" + orgId).with(MockAuthHelper.asAdmin(ADMIN_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"New Name\"}"))
				.andExpect(status().isNotFound());
	}
}
