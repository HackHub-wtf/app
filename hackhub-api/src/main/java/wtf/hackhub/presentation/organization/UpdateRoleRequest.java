package wtf.hackhub.presentation.organization;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdateRoleRequest(@NotBlank @Pattern(regexp = "owner|manager|member") String role) {
}
