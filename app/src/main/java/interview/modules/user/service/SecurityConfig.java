package interview.modules.user.service;

import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Spring Security 配置
 * <p>JWT 无状态模式，白名单放行认证相关接口和支付回调。
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Value("${app.security.enabled:true}")
    private boolean securityEnabled;

    @Value("${app.cors.allowed-origins:http://localhost:5173}")
    private String allowedOriginsStr;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // 禁用 CSRF（前后端分离，JWT 无状态）
                .csrf(AbstractHttpConfigurer::disable)
                // CORS 使用统一配置
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // 无状态 Session（JWT 模式）
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // 授权规则
                .authorizeHttpRequests(auth -> {
                    if (!securityEnabled) {
                        // 紧急回滚：关闭认证
                        auth.anyRequest().permitAll();
                    } else {
                        auth
                                // 认证接口白名单
                                .requestMatchers("/api/auth/**").permitAll()
                                // 套餐查询白名单（未登录可查看）
                                .requestMatchers(HttpMethod.GET, "/api/membership/plans").permitAll()
                                // 支付回调白名单（由支付平台发起，无 JWT）
                                .requestMatchers("/api/payment/notify/**").permitAll()
                                // Actuator 健康检查白名单
                                .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                                // Swagger 白名单
                                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**").permitAll()
                                // WebSocket 握手（语音面试）
                                .requestMatchers("/ws/**").permitAll()
                                // 管理员后台接口：仅 ADMIN 角色可访问
                                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                                // 其他所有接口需要认证
                                .anyRequest().authenticated();
                    }
                })
                // 添加 JWT 过滤器（在用户名密码过滤器之前）
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> allowedOrigins = Arrays.asList(allowedOriginsStr.split(","));
        config.setAllowedOrigins(allowedOrigins.stream().map(String::trim).toList());
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("Authorization", "X-Quota-Remaining"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
