package wtf.hackhub.presentation.organization;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import wtf.hackhub.application.organization.*;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.infrastructure.config.SecurityConfig;
import wtf.hackhub.infrastructure.security.JwtAuthFilter;
import wtf.hackhub.infrastructure.security.JwtProvider;
import wtf.hackhub.presentation.common.GlobalExceptionHandler;
import wtf.hackhub.support.MockAuthHelper;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(OrganizationController.class)
@Import({SecurityConfig.class, JwtAuthFilter.class, GlobalExceptionHandler.class})
@TestPropertySource(properties = {
		"app.jwt.private-key=-----BEGIN PRIVATE KEY-----\\nMIIEvAIBADANBg=====\\n-----END PRIVATE KEY-----",
		"app.jwt.public-key=-----BEGIN PUBLIC KEY-----\\nMIIBIjANBg=====\\n-----END PUBLIC KEY-----",
		"app.cors.allowed-origins=http://localhost:5173", "app.minio.endpoint=http://localhost:9000",
		"app.minio.access-key=test", "app.minio.secret-key=test"})
class OrganizationControllerTest {

	@Autowired
	MockMvc mvc;

	@MockBean
	CreateOrganizationUseCase createOrganizationUseCase;
	@MockBean
	JoinOrganizationUseCase joinOrganizationUseCase;
	@MockBean
	GetOrganizationUseCase getOrganizationUseCase;
	@MockBean
	UpdateMemberRoleUseCase updateMemberRoleUseCase;
	@MockBean
	JwtProvider jwtProvider;

	static final UUID USER_ID = UUID.randomUUID();

	@Test
	void create_organization_returns_201() throws Exception {
		Organization org = new Organization("Acme Corp", "acme-corp", USER_ID);
		when(createOrganizationUseCase.execute(eq("Acme Corp"), eq("acme-corp"), eq(USER_ID))).thenReturn(org);

		mvc.perform(post("/api/v1/organizations").with(MockAuthHelper.asManager(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Acme Corp\",\"slug\":\"acme-corp\"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.name").value("Acme Corp"))
				.andExpect(jsonPath("$.slug").value("acme-corp"));
	}

	@Test
	void create_organization_unauthenticated_returns_401() throws Exception {
		mvc.perform(post("/api/v1/organizations").contentType(MediaType.APPLICATION_JSON)
				.content("{\"name\":\"X\",\"slug\":\"x\"}")).andExpect(status().isUnauthorized());
	}

	@Test
	void create_organization_duplicate_slug_returns_409() throws Exception {
		when(createOrganizationUseCase.execute(any(), any(), any()))
				.thenThrow(new CreateOrganizationUseCase.SlugAlreadyTakenException("taken"));

		mvc.perform(post("/api/v1/organizations").with(MockAuthHelper.asManager(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Dup\",\"slug\":\"taken\"}"))
				.andExpect(status().isConflict()).andExpect(jsonPath("$.title").value("Slug Already Taken"));
	}

	@Test
	void get_organization_by_id_returns_200() throws Exception {
		UUID orgId = UUID.randomUUID();
		Organization org = new Organization("HackOrg", "hack-org", USER_ID);
		when(getOrganizationUseCase.getById(orgId)).thenReturn(org);

		mvc.perform(get("/api/v1/organizations/" + orgId).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$.name").value("HackOrg"));
	}

	@Test
	void get_organization_not_found_returns_404() throws Exception {
		UUID orgId = UUID.randomUUID();
		when(getOrganizationUseCase.getById(orgId))
				.thenThrow(new JoinOrganizationUseCase.OrganizationNotFoundException(orgId.toString()));

		mvc.perform(get("/api/v1/organizations/" + orgId).with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isNotFound()).andExpect(jsonPath("$.title").value("Not Found"));
	}

	@Test
	void get_members_returns_list() throws Exception {
		UUID orgId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, USER_ID, OrganizationMember.Role.MEMBER);
		GetOrganizationUseCase.EnrichedMember enriched = new GetOrganizationUseCase.EnrichedMember(member, null);
		when(getOrganizationUseCase.getMembers(orgId)).thenReturn(List.of(enriched));

		mvc.perform(get("/api/v1/organizations/" + orgId + "/members").with(MockAuthHelper.asParticipant(USER_ID)))
				.andExpect(status().isOk()).andExpect(jsonPath("$[0].role").value("member"));
	}

	@Test
	void join_organization_returns_201() throws Exception {
		UUID orgId = UUID.randomUUID();
		OrganizationMember member = new OrganizationMember(orgId, USER_ID, OrganizationMember.Role.MEMBER);
		when(joinOrganizationUseCase.execute(eq("acme"), eq(USER_ID))).thenReturn(member);

		mvc.perform(post("/api/v1/organizations/join").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"slug\":\"acme\"}")).andExpect(status().isCreated())
				.andExpect(jsonPath("$.role").value("member"));
	}

	@Test
	void join_organization_already_member_returns_409() throws Exception {
		UUID orgId = UUID.randomUUID();
		when(joinOrganizationUseCase.execute(any(), any()))
				.thenThrow(new JoinOrganizationUseCase.AlreadyMemberException(USER_ID, orgId));

		mvc.perform(post("/api/v1/organizations/join").with(MockAuthHelper.asParticipant(USER_ID))
				.contentType(MediaType.APPLICATION_JSON).content("{\"slug\":\"acme\"}"))
				.andExpect(status().isConflict());
	}
}
