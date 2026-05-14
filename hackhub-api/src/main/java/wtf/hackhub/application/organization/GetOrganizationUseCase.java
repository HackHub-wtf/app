package wtf.hackhub.application.organization;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import wtf.hackhub.domain.Organization;
import wtf.hackhub.domain.OrganizationMember;
import wtf.hackhub.domain.Profile;
import wtf.hackhub.infrastructure.persistence.auth.ProfileRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationMemberRepository;
import wtf.hackhub.infrastructure.persistence.organization.OrganizationRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class GetOrganizationUseCase {

	private final OrganizationRepository organizationRepository;
	private final OrganizationMemberRepository memberRepository;
	private final ProfileRepository profileRepository;

	public GetOrganizationUseCase(OrganizationRepository organizationRepository,
			OrganizationMemberRepository memberRepository, ProfileRepository profileRepository) {
		this.organizationRepository = organizationRepository;
		this.memberRepository = memberRepository;
		this.profileRepository = profileRepository;
	}

	@Transactional(readOnly = true)
	public Organization getById(UUID id) {
		return organizationRepository.findById(id)
				.orElseThrow(() -> new JoinOrganizationUseCase.OrganizationNotFoundException(id.toString()));
	}

	public record EnrichedMember(OrganizationMember member, Profile profile) {}

	@Transactional(readOnly = true)
	public List<EnrichedMember> getMembers(UUID organizationId) {
		List<OrganizationMember> members = memberRepository.findAllByOrganizationId(organizationId);
		List<UUID> userIds = members.stream().map(OrganizationMember::getUserId).toList();
		Map<UUID, Profile> profiles = profileRepository.findAllById(userIds).stream()
				.collect(Collectors.toMap(Profile::getId, p -> p));
		return members.stream()
				.map(m -> new EnrichedMember(m, profiles.get(m.getUserId())))
				.toList();
	}

	@Transactional(readOnly = true)
	public OrganizationMember getUserMembership(UUID userId) {
		return memberRepository.findFirstByUserId(userId).orElseThrow(() -> new NotAMemberException(userId));
	}

	@Transactional(readOnly = true)
	public List<Organization> getMyOrganizations(UUID userId) {
		return memberRepository.findAllByUserId(userId).stream()
				.map(m -> organizationRepository.findById(m.getOrganizationId()).orElse(null))
				.filter(o -> o != null)
				.toList();
	}

	public static class NotAMemberException extends RuntimeException {
		public NotAMemberException(UUID userId) {
			super("User " + userId + " is not a member of any organization");
		}
	}
}
