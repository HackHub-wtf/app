package wtf.hackhub.infrastructure.persistence.organization;

import org.springframework.data.jpa.repository.JpaRepository;
import wtf.hackhub.domain.OrgInvitation;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrgInvitationRepository extends JpaRepository<OrgInvitation, UUID> {

	Optional<OrgInvitation> findByToken(String token);

	boolean existsByToken(String token);

	List<OrgInvitation> findAllByOrganizationIdAndUsedAtIsNullAndRevokedAtIsNull(UUID organizationId);
}
