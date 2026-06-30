package interview.modules.user.model;

import java.util.Map;

/**
 * 各角色每日配额常量配置类
 * <p>-1 表示无限制
 */
public final class RoleQuotaConfig {

    private RoleQuotaConfig() {}

    // ===== 资源名称常量 =====
    public static final String RESUME_UPLOAD     = "RESUME_UPLOAD";     // 每日简历上传次数
    public static final String RESUME_TOTAL      = "RESUME_TOTAL";      // 简历总数（总量限制）
    public static final String TEXT_INTERVIEW    = "TEXT_INTERVIEW";    // 每日文字面试次数
    public static final String VOICE_INTERVIEW   = "VOICE_INTERVIEW";   // 每日语音面试次数
    public static final String KB_FILE_TOTAL     = "KB_FILE_TOTAL";     // 知识库文件总数（总量限制）
    public static final String QA_ASSISTANT      = "QA_ASSISTANT";      // 每日问答助手次数

    // ===== 各角色配额映射 =====

    /** ADMIN 配额：所有维度无限制 */
    public static final Map<String, Integer> ADMIN_QUOTA = Map.of(
            RESUME_UPLOAD,   -1,
            RESUME_TOTAL,    -1,
            TEXT_INTERVIEW,  -1,
            VOICE_INTERVIEW, -1,
            KB_FILE_TOTAL,   -1,
            QA_ASSISTANT,    -1
    );

    /** LITE 配额 */
    public static final Map<String, Integer> LITE_QUOTA = Map.of(
            RESUME_UPLOAD,   1,
            RESUME_TOTAL,    2,
            TEXT_INTERVIEW,  1,
            VOICE_INTERVIEW, 0,   // 0 = 不支持（功能禁止）
            KB_FILE_TOTAL,   5,
            QA_ASSISTANT,    1
    );

    /** PRO 配额 */
    public static final Map<String, Integer> PRO_QUOTA = Map.of(
            RESUME_UPLOAD,   5,
            RESUME_TOTAL,    10,
            TEXT_INTERVIEW,  5,
            VOICE_INTERVIEW, 5,
            KB_FILE_TOTAL,   100,
            QA_ASSISTANT,    5
    );

    /** MAX_PLUS 配额 */
    public static final Map<String, Integer> MAX_PLUS_QUOTA = Map.of(
            RESUME_UPLOAD,   -1,
            RESUME_TOTAL,    20,
            TEXT_INTERVIEW,  20,
            VOICE_INTERVIEW, 20,
            KB_FILE_TOTAL,   1000,
            QA_ASSISTANT,    20
    );

    /**
     * 获取指定角色的配额上限
     *
     * @param role     用户角色
     * @param resource 资源名称
     * @return 配额上限；-1 表示无限制
     */
    public static int getLimit(UserRole role, String resource) {
        Map<String, Integer> quota = switch (role) {
            case ADMIN   -> ADMIN_QUOTA;
            case LITE    -> LITE_QUOTA;
            case PRO     -> PRO_QUOTA;
            case MAX_PLUS -> MAX_PLUS_QUOTA;
        };
        return quota.getOrDefault(resource, -1);
    }
}
