package interview.modules.user.model;

/**
 * 用户角色枚举
 * <p>四种互斥角色，每个用户同一时刻仅拥有一种角色。
 */
public enum UserRole {
    /**
     * 管理员：拥有所有功能无限制访问权，可修改系统配置
     */
    ADMIN,
    /**
     * Lite 会员（默认）：功能受限，有每日配额限制，不支持语音面试
     */
    LITE,
    /**
     * Pro 会员：每周¥19.9 / 每月¥68.9，配额更高，支持语音面试
     */
    PRO,
    /**
     * Max+ 会员：每周¥59.9 / 每月¥198.9，最高配额
     */
    MAX_PLUS
}
