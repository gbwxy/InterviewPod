package interview.modules.user.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付订单实体（Hibernate 自动建表 {@code payment_orders}）
 */
@Entity
@Table(name = "payment_orders", indexes = {
        @Index(name = "idx_payment_orders_user_id", columnList = "user_id"),
        @Index(name = "idx_payment_orders_out_trade_no", columnList = "out_trade_no", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    /** 商户自生成的唯一订单号 */
    @Column(name = "out_trade_no", length = 64, nullable = false, unique = true)
    private String outTradeNo;

    /** 套餐 ID */
    @Column(name = "plan_id", length = 50)
    private String planId;

    /** 支付方式：WECHAT / ALIPAY */
    @Column(name = "payment_method", length = 20)
    private String paymentMethod;

    /** 订单金额 */
    @Column(precision = 10, scale = 2)
    private BigDecimal amount;

    /** 订单状态：PENDING / PAID / EXPIRED / FAILED */
    @Column(length = 20, nullable = false)
    @Builder.Default
    private String status = "PENDING";

    /** 支付平台返回的交易号 */
    @Column(name = "transaction_id", length = 64)
    private String transactionId;

    /** 微信返回的 code_url 或支付宝返回的 qr_code */
    @Column(name = "qr_code_url", length = 512)
    private String qrCodeUrl;

    /** 支付成功时间 */
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
