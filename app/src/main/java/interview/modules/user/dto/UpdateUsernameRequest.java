package interview.modules.user.dto;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 更新用户名请求 DTO（PATCH /api/auth/me）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUsernameRequest {

    @Pattern(regexp = "^[a-zA-Z0-9_]{4,20}$", message = "用户名须为 4-20 字符，仅支持字母、数字和下划线")
    private String username;
}
