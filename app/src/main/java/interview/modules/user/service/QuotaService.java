package interview.modules.user.service;

import interview.common.exception.BusinessException;
import interview.common.exception.ErrorCode;
import interview.modules.user.model.RoleQuotaConfig;
import interview.modules.user.model.User;
import interview.modules.user.model.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * 配额服务
 * <p>
 * 封装 Redis {@code INCR} 操作，Key 格式：{@code quota:{userId}:{resource}:{yyyyMMdd}}，TTL 25 小时。
 * Redis 故障时降级放通（不阻断业务）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuotaService {

    private static final String QUOTA_KEY_PREFIX = "quota:";
    private static final Duration QUOTA_TTL = Duration.ofHours(25);

    private final RedissonClient redissonClient;

    /**
     * 检查并消耗一次每日配额（COUNT_PER_DAY 类型）。
     * <p>超限抛 {@link BusinessException}（HTTP 429）。
     *
     * @param user     当前用户
     * @param resource 资源名称（使用 {@link RoleQuotaConfig} 中的常量）
     */
    public void checkAndConsumeDailyQuota(User user, String resource) {
        // ADMIN 绕过所有配额检查
        if (user.getRole() == UserRole.ADMIN) return;

        int limit = RoleQuotaConfig.getLimit(user.getRole(), resource);
        if (limit == -1) return;   // 无限制
        if (limit == 0) {
            // 功能禁止（例如 LITE 用户的 VOICE_INTERVIEW）
            throw new BusinessException(ErrorCode.FEATURE_FORBIDDEN);
        }

        try {
            String key = buildKey(user.getId(), resource);
            RAtomicLong counter = redissonClient.getAtomicLong(key);
            long current = counter.get();

            if (current >= limit) {
                throw new BusinessException(ErrorCode.QUOTA_EXCEEDED,
                        "今日次数已达上限（" + limit + "次/天），请明日再试或升级会员");
            }

            // 消耗配额
            long newVal = counter.incrementAndGet();
            // 首次写入时设置 TTL
            if (newVal == 1) {
                counter.expire(QUOTA_TTL);
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            // Redis 故障：降级放通，记录警告
            log.warn("[Quota] Redis unavailable, allowing request for user={} resource={}", user.getId(), resource, e);
        }
    }

    /**
     * 检查总量限制（MAX_TOTAL 类型），不消耗计数器。
     * <p>业务层查询当前总量并调用此方法，用于简历总数、知识库文件总数等。
     *
     * @param user     当前用户
     * @param resource 资源名称
     * @param current  当前已有数量
     */
    public void checkTotalQuota(User user, String resource, int current) {
        if (user.getRole() == UserRole.ADMIN) return;

        int limit = RoleQuotaConfig.getLimit(user.getRole(), resource);
        if (limit == -1) return;

        if (current >= limit) {
            throw new BusinessException(ErrorCode.QUOTA_EXCEEDED,
                    "数量已达上限（" + limit + " 个），请删除后再试或升级会员");
        }
    }

    /**
     * 获取今日剩余配额（用于 GET /api/auth/me 返回配额信息）
     *
     * @param user     当前用户
     * @param resource 资源名称
     * @return 剩余次数；-1 = 无限制；-2 = 功能禁止
     */
    public int getRemainingDailyQuota(User user, String resource) {
        if (user.getRole() == UserRole.ADMIN) return -1;

        int limit = RoleQuotaConfig.getLimit(user.getRole(), resource);
        if (limit == -1) return -1;
        if (limit == 0) return -2; // 功能禁止

        try {
            String key = buildKey(user.getId(), resource);
            RAtomicLong counter = redissonClient.getAtomicLong(key);
            long used = counter.get();
            return Math.max(0, (int) (limit - used));
        } catch (Exception e) {
            log.warn("[Quota] Redis unavailable, returning limit for user={} resource={}", user.getId(), resource);
            return limit; // 故障时返回最大值
        }
    }

    private String buildKey(Long userId, String resource) {
        String today = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        return QUOTA_KEY_PREFIX + userId + ":" + resource + ":" + today;
    }
}
