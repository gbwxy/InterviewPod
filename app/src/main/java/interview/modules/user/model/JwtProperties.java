package interview.modules.user.model;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * JWT 配置属性，绑定 application.yml 中的 app.jwt.*
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.jwt")
public class JwtProperties {

    /** JWT 签名密钥（至少32字符） */
    private String secret;

    /** Access Token 有效期（毫秒），默认 2小时 */
    private long accessExpirationMs = 7_200_000L;

    /** Refresh Token 有效期（毫秒），默认 7天 */
    private long refreshExpirationMs = 604_800_000L;
}
