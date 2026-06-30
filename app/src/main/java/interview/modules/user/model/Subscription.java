package interview.modules.user.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订阅记录实体（Hibernate 自动建表 {@code subscriptions}）
 */
@Entity
@Table(name = "subscriptions", indexes = {
        @Index(name = "idx_subscriptions_user_id", columnList = "user_id"),
        @Index(name = "idx_subscriptions_order_id", columnList = "order_id")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Subscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 订阅的会员角色（PRO / MAX_PLUS） */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private UserRole role;

    /** 套餐 ID，例如 "pro-weekly", "pro-monthly" */
    @Column(name = "plan_id", length = 50)
    private String planId;

    /** 套餐周期（WEEKLY / MONTHLY） */
    @Column(name = "period", length = 20)
    private String period;

    /** 订阅金额 */
    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    /** 关联的支付订单 ID */
    @Column(name = "order_id")
    private Long orderId;

    /** 订阅开始时间 */
    @Column(name = "started_at")
    private LocalDateTime startedAt;

    /** 订阅到期时间 */
    @Column(name = "expired_at")
    private LocalDateTime expiredAt;

    /** 是否已到期（由定时任务标记） */
    @Column(name = "is_expired")
    @Builder.Default
    private boolean expired = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
