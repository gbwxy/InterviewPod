package interview.common.config;

import interview.common.exception.BusinessException;
import interview.common.exception.ErrorCode;
import interview.modules.user.model.User;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Spring Security Context 工具类
 * <p>提供从 Security Context 中安全获取当前登录用户信息的便捷方法，供 Service 层调用。
 */
@Component
public class SecurityContextHelper {

    /**
     * 获取当前登录用户（User 实体）
     *
     * @return 当前用户
     * @throws BusinessException 未认证时抛出
     */
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof User user) {
            return user;
        }
        throw new BusinessException(ErrorCode.UNAUTHORIZED);
    }

    /**
     * 获取当前登录用户 ID
     *
     * @return 当前用户 ID
     * @throws BusinessException 未认证时抛出
     */
    public Long getCurrentUserId() {
        return getCurrentUser().getId();
    }

    /**
     * 尝试获取当前登录用户 ID（未登录时返回 null，不抛异常）
     *
     * @return 用户 ID，未登录则为 null
     */
    public Long getCurrentUserIdOrNull() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication == null || !authentication.isAuthenticated()) {
                return null;
            }
            Object principal = authentication.getPrincipal();
            if (principal instanceof User user) {
                return user.getId();
            }
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    /**
     * 判断当前用户是否为管理员
     *
     * @return true 表示 ADMIN
     */
    public boolean isAdmin() {
        try {
            User user = getCurrentUser();
            return interview.modules.user.model.UserRole.ADMIN.equals(user.getRole());
        } catch (Exception e) {
            return false;
        }
    }
}
