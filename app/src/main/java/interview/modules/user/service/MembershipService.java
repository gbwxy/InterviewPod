package interview.modules.user.service;

import interview.modules.user.model.Subscription;
import interview.modules.user.model.User;
import interview.modules.user.model.UserRole;
import interview.modules.user.repository.SubscriptionRepository;
import interview.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 会员订阅服务
 * <p>处理角色升级、延长有效期、降级等逻辑。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MembershipService {

    /** 套餐定义：planId -> {role, period, amount, days} */
    public static final Map<String, PlanInfo> PLANS = Map.of(
            "pro-weekly",      new PlanInfo(UserRole.PRO,      "WEEKLY",  new BigDecimal("19.9"),  7),
            "pro-monthly",     new PlanInfo(UserRole.PRO,      "MONTHLY", new BigDecimal("68.9"),  30),
            "max-weekly",      new PlanInfo(UserRole.MAX_PLUS, "WEEKLY",  new BigDecimal("59.9"),  7),
            "max-monthly",     new PlanInfo(UserRole.MAX_PLUS, "MONTHLY", new BigDecimal("198.9"), 30)
    );

    private final UserRepository userRepository;
    private final SubscriptionRepository subscriptionRepository;

    /**
     * 获取所有可购买的套餐信息
     */
    public Map<String, PlanInfo> getPlans() {
        return PLANS;
    }

    /**
     * 获取用户当前订阅状态
     */
    public SubscriptionStatus getStatus(User user) {
        Optional<Subscription> latest = subscriptionRepository
                .findTopByUserIdOrderByCreatedAtDesc(user.getId());
        Optional<Subscription> active = subscriptionRepository
                .findTopByUserIdAndExpiredFalseOrderByExpiredAtDesc(user.getId());

        return SubscriptionStatus.builder()
                .role(user.getRole())
                .expiredAt(user.getSubscriptionExpiredAt())
                .latestSubscription(latest.orElse(null))
                .activeSubscription(active.orElse(null))
                .build();
    }

    /**
     * 支付成功后升级角色并创建订阅记录
     *
     * @param userId  用户 ID
     * @param orderId 支付订单 ID
     * @param planId  套餐 ID
     */
    @Transactional
    public void activateSubscription(Long userId, Long orderId, String planId) {
        PlanInfo plan = PLANS.get(planId);
        if (plan == null) {
            log.error("[Membership] Unknown planId: {}", planId);
            return;
        }

        User user = userRepository.findById(userId).orElseThrow();
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime expiredAt;

        // 延长有效期逻辑
        if (user.getRole() == plan.role() &&
                user.getSubscriptionExpiredAt() != null &&
                user.getSubscriptionExpiredAt().isAfter(now)) {
            // 同级且还未过期：顺延叠加
            expiredAt = user.getSubscriptionExpiredAt().plusDays(plan.days());
        } else {
            // 升级或全新订阅：从现在起计算
            expiredAt = now.plusDays(plan.days());
        }

        // 更新用户角色和到期时间
        user.setRole(plan.role());
        user.setSubscriptionExpiredAt(expiredAt);
        userRepository.save(user);

        // 插入订阅记录
        Subscription subscription = Subscription.builder()
                .userId(userId)
                .role(plan.role())
                .planId(planId)
                .period(plan.period())
                .amount(plan.amount())
                .orderId(orderId)
                .startedAt(now)
                .expiredAt(expiredAt)
                .build();
        subscriptionRepository.save(subscription);

        log.info("[Membership] User {} upgraded to {} until {}", userId, plan.role(), expiredAt);
    }

    /**
     * 每日 00:05（北京时间）检查过期订阅，将角色降回 LITE
     */
    @Scheduled(cron = "0 5 0 * * ?", zone = "Asia/Shanghai")
    @Transactional
    public void expireSubscriptions() {
        log.info("[Membership] Running subscription expiry check...");
        LocalDateTime now = LocalDateTime.now();

        List<User> expiredUsers = userRepository.findExpiredSubscriptions(
                now, List.of(UserRole.PRO, UserRole.MAX_PLUS));

        for (User user : expiredUsers) {
            log.info("[Membership] Downgrading user {} from {} to LITE", user.getId(), user.getRole());
            user.setRole(UserRole.LITE);
            user.setSubscriptionExpiredAt(null);
            userRepository.save(user);

            // 标记订阅为已到期
            subscriptionRepository.findTopByUserIdAndExpiredFalseOrderByExpiredAtDesc(user.getId())
                    .ifPresent(sub -> {
                        sub.setExpired(true);
                        subscriptionRepository.save(sub);
                    });
        }

        log.info("[Membership] Expiry check done, downgraded {} users", expiredUsers.size());
    }

    // ===== 内部数据结构 =====

    public record PlanInfo(UserRole role, String period, BigDecimal amount, int days) {}

    @lombok.Builder
    @lombok.Data
    public static class SubscriptionStatus {
        private UserRole role;
        private LocalDateTime expiredAt;
        private Subscription latestSubscription;
        private Subscription activeSubscription;
    }
}
