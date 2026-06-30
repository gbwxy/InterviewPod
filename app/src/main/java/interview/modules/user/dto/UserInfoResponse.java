package interview.modules.user.dto;

import interview.modules.user.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 用户信息响应 DTO（GET /api/auth/me）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserInfoResponse {
    private Long userId;
    private String phone;        // 脱敏，中间4位 ****
    private String username;
    private UserRole role;
    private LocalDateTime subscriptionExpiredAt;
    /** 各业务维度今日剩余配额；-1 表示无限制 */
    private Map<String, Integer> quotaRemaining;
}
