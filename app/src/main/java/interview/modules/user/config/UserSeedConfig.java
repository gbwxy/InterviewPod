package interview.modules.user.config;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import interview.modules.user.model.User;
import interview.modules.user.model.UserRole;
import interview.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * 预置用户种子数据初始化。
 * <p>
 * 解决 Docker init.sql 仅在数据库首次创建时执行、且执行时 Hibernate 可能尚未建表的问题。
 * 应用每次启动时都会检查并补齐预置账号，确保开发/测试账号可用。
 * <p>
 * 预置用户通过环境变量 {@code APP_PRESET_USERS_JSON} 配置，避免硬编码敏感信息。
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class UserSeedConfig {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final ObjectMapper objectMapper;

    @Value("${app.preset-users.json:[]}")
    private String presetUsersJson;

    @Bean
    public CommandLineRunner seedPresetUsers() {
        return args -> {
            List<PresetUser> presetUsers = parsePresetUsers();
            for (PresetUser preset : presetUsers) {
                ensurePresetUser(preset.getUsername(), preset.getPassword(),
                        UserRole.valueOf(preset.getRole()));
            }
        };
    }

    private List<PresetUser> parsePresetUsers() {
        if (presetUsersJson == null || presetUsersJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(presetUsersJson, new TypeReference<>() {});
        } catch (Exception e) {
            log.warn("解析 APP_PRESET_USERS_JSON 失败，跳过预置用户初始化: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public void ensurePresetUser(String username, String rawPassword, UserRole role) {
        if (username == null || username.isBlank() || rawPassword == null || rawPassword.isBlank()) {
            log.warn("预置用户信息不完整，跳过: username={}", username);
            return;
        }

        User user = userRepository.findByUsername(username).orElse(null);

        if (user == null) {
            user = User.builder()
                    .username(username)
                    .passwordHash(passwordEncoder.encode(rawPassword))
                    .role(role)
                    .subscriptionExpiredAt(LocalDateTime.of(2099, 12, 31, 23, 59, 59))
                    .build();
            userRepository.save(user);
            log.info("预置用户已创建: username={}, role={}", username, role);
        } else if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(rawPassword));
            user.setRole(role);
            user.setSubscriptionExpiredAt(LocalDateTime.of(2099, 12, 31, 23, 59, 59));
            userRepository.save(user);
            log.info("预置用户已补齐密码: username={}", username);
        }
    }

    /**
     * 预置用户 DTO，与 APP_PRESET_USERS_JSON 的 JSON 结构对应。
     */
    public static class PresetUser {
        private String username;
        private String password;
        private String role;

        public String getUsername() {
            return username;
        }

        public void setUsername(String username) {
            this.username = username;
        }

        public String getPassword() {
            return password;
        }

        public void setPassword(String password) {
            this.password = password;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }
    }
}
