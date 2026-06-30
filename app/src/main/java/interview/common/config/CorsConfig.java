package interview.common.config;

import org.springframework.context.annotation.Configuration;

/**
 * CORS跨域配置
 * <p>
 * 注意：引入 Spring Security 后，CORS 由 {@link interview.modules.user.service.SecurityConfig}
 * 中的 {@code corsConfigurationSource()} 统一管理，不再使用独立的 {@code CorsFilter} Bean
 * （避免双重 CORS 处理导致请求头冲突）。
 * </p>
 * 此类保留以维持包结构，实际 CORS 配置已迁移到 SecurityConfig。
 */
@Configuration
public class CorsConfig {
    // CORS 配置已迁移到 SecurityConfig.corsConfigurationSource()
}
