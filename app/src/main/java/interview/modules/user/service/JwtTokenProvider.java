package interview.modules.user.service;

import interview.modules.user.model.JwtProperties;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Date;
import java.util.UUID;

/**
 * JWT Token 提供者
 * <p>负责生成/验证 Access Token 与 Refresh Token。
 * Refresh Token 存储于 Redis，支持强制下线（Token 吊销）。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class JwtTokenProvider {

    private static final String REFRESH_TOKEN_PREFIX = "refresh:token:";
    private static final String TOKEN_TYPE_CLAIM = "type";
    private static final String USER_ID_CLAIM = "userId";
    private static final String ACCESS = "access";
    private static final String REFRESH = "refresh";

    private final JwtProperties jwtProperties;
    private final RedissonClient redissonClient;

    private SecretKey signingKey() {
        byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ===== Access Token =====

    /**
     * 生成 Access Token（有效期默认2小时）
     *
     * @param userId 用户 ID
     * @return signed JWT string
     */
    public String generateAccessToken(Long userId) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + jwtProperties.getAccessExpirationMs());
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim(TOKEN_TYPE_CLAIM, ACCESS)
                .claim(USER_ID_CLAIM, userId)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(signingKey())
                .compact();
    }

    /**
     * 验证并解析 Access Token
     *
     * @param token JWT string
     * @return Claims（包含 userId 等）
     * @throws JwtException 验证失败
     */
    public Claims parseAccessToken(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();

        if (!ACCESS.equals(claims.get(TOKEN_TYPE_CLAIM, String.class))) {
            throw new JwtException("Not an access token");
        }
        return claims;
    }

    /**
     * 从 Access Token 中提取 userId（不抛异常，返回 null 表示无效）
     */
    public Long getUserIdFromAccessToken(String token) {
        try {
            Claims claims = parseAccessToken(token);
            return claims.get(USER_ID_CLAIM, Long.class);
        } catch (Exception e) {
            return null;
        }
    }

    // ===== Refresh Token =====

    /**
     * 生成 Refresh Token 并存储到 Redis（有效期默认7天）
     *
     * @param userId 用户 ID
     * @return Refresh Token string（UUID）
     */
    public String generateAndStoreRefreshToken(Long userId) {
        String refreshToken = UUID.randomUUID().toString().replace("-", "");
        String redisKey = REFRESH_TOKEN_PREFIX + refreshToken;
        Duration ttl = Duration.ofMillis(jwtProperties.getRefreshExpirationMs());

        RBucket<String> bucket = redissonClient.getBucket(redisKey);
        bucket.set(String.valueOf(userId), ttl);

        return refreshToken;
    }

    /**
     * 验证 Refresh Token，返回关联的 userId（返回 null 表示无效/已过期/已吊销）
     */
    public Long validateRefreshToken(String refreshToken) {
        try {
            String redisKey = REFRESH_TOKEN_PREFIX + refreshToken;
            RBucket<String> bucket = redissonClient.getBucket(redisKey);
            String userId = bucket.get();
            if (userId == null) {
                return null;
            }
            return Long.parseLong(userId);
        } catch (Exception e) {
            log.warn("Failed to validate refresh token: {}", e.getMessage());
            return null;
        }
    }

    /**
     * 删除 Refresh Token（登出或Token轮换时调用）
     */
    public void revokeRefreshToken(String refreshToken) {
        String redisKey = REFRESH_TOKEN_PREFIX + refreshToken;
        redissonClient.getBucket(redisKey).delete();
    }

    /**
     * 删除指定用户的所有 Refresh Token（强制下线）
     * 注意：此方法通过 key pattern 扫描，成本较高，谨慎使用
     */
    public void revokeAllUserTokens(Long userId) {
        // 简单实现：遍历扫描（生产建议用 userId -> [token list] 的反向索引）
        String pattern = REFRESH_TOKEN_PREFIX + "*";
        redissonClient.getKeys().getKeysByPattern(pattern).forEach(key -> {
            RBucket<String> bucket = redissonClient.getBucket(key);
            String storedUserId = bucket.get();
            if (String.valueOf(userId).equals(storedUserId)) {
                bucket.delete();
            }
        });
    }
}
