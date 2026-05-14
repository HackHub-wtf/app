package wtf.hackhub.presentation.organization;

import jakarta.validation.constraints.NotBlank;

public record JoinOrgRequest(@NotBlank String slug) {
}
