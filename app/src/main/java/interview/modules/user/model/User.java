package interview.modules.user.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

/**
 * 用户实体
 * <p>Hibernate 自动创建/更新 {@code users} 表（ddl-auto: update）。
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_phone", columnList = "phone", unique = true),
        @Index(name = "idx_users_username", columnList = "username", unique = true)
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 中国大陆手机号（11位），唯一；可为空（纯用户名密码注册的场景未来可扩展） */
    @Column(length = 20, unique = true)
    private String phone;

    /** 用户名（4-20字符），唯一；可为空（手机号注册默认不填用户名） */
    @Column(length = 50, unique = true)
    private String username;

    /** BCrypt 加密后的密码；SMS 验证码登录用户可无密码 */
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    /** 当前角色（枚举，以字符串存储） */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private UserRole role = UserRole.LITE;

    /** 会员订阅到期时间；LITE 用户为 null */
    @Column(name = "subscription_expired_at")
    private LocalDateTime subscriptionExpiredAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
