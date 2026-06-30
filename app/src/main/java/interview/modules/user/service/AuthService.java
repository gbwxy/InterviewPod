package interview.modules.user.service;

import interview.common.exception.BusinessException;
import interview.common.exception.ErrorCode;
import interview.modules.knowledgebase.repository.KnowledgeBaseRepository;
import interview.modules.resume.repository.ResumeRepository;
import interview.modules.user.dto.AuthResponse;
import interview.modules.user.dto.UserInfoResponse;
import interview.modules.user.model.RoleQuotaConfig;
import interview.modules.user.model.User;
import interview.modules.user.model.UserRole;
import interview.modules.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

/**
 * 用户认证服务
 * <p>提供三种登录方式、注册、Token 刷新、登出、设置密码等功能。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final SmsService smsService;
    private final PasswordEncoder passwordEncoder;
    private final QuotaService quotaService;
    private final ResumeRepository resumeRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;

    // ===== 短信验证码登录/注册 =====

    @Transactional
    public AuthResponse loginBySms(String phone, String code) {
        // 验证验证码
        if (!smsService.verifyCode(phone, code)) {
            throw new BusinessException(ErrorCode.SMS_CODE_INVALID);
        }

        // 查询用户，不存在则自动注册
        User user = userRepository.findByPhone(phone)
                .orElseGet(() -> registerNewUser(phone));

        return buildAuthResponse(user);
    }

    // ===== 手机号 + 密码登录 =====

    public AuthResponse loginByPhonePassword(String phone, String password) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_PASSWORD_WRONG));

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new BusinessException(ErrorCode.USER_NO_PASSWORD);
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.USER_PASSWORD_WRONG);
        }

        return buildAuthResponse(user);
    }

    // ===== 用户名 + 密码登录 =====

    public AuthResponse loginByUsernamePassword(String username, String password) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_USERNAME_PASSWORD_WRONG));

        if (user.getPasswordHash() == null || user.getPasswordHash().isBlank()) {
            throw new BusinessException(ErrorCode.USER_USERNAME_PASSWORD_WRONG);
        }

        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new BusinessException(ErrorCode.USER_USERNAME_PASSWORD_WRONG);
        }

        return buildAuthResponse(user);
    }

    // ===== Refresh Token 换新 Access Token =====

    public String refreshAccessToken(String refreshToken) {
        Long userId = jwtTokenProvider.validateRefreshToken(refreshToken);
        if (userId == null) {
            throw new BusinessException(ErrorCode.TOKEN_INVALID);
        }
        return jwtTokenProvider.generateAccessToken(userId);
    }

    // ===== 登出 =====

    public void logout(String refreshToken) {
        if (refreshToken != null && !refreshToken.isBlank()) {
            jwtTokenProvider.revokeRefreshToken(refreshToken);
        }
    }

    // ===== 获取当前用户信息 =====

    public UserInfoResponse getUserInfo(User currentUser) {
        Map<String, Integer> quotaRemaining = new HashMap<>();

        if (currentUser.getRole() == UserRole.ADMIN) {
            // ADMIN 无限制，全部返回 -1
            quotaRemaining.put("RESUME_UPLOAD", -1);
            quotaRemaining.put("RESUME_TOTAL", -1);
            quotaRemaining.put("TEXT_INTERVIEW", -1);
            quotaRemaining.put("VOICE_INTERVIEW", -1);
            quotaRemaining.put("KB_FILE_TOTAL", -1);
            quotaRemaining.put("QA_ASSISTANT", -1);
        } else {
            // 计算各维度剩余配额
            quotaRemaining.put("RESUME_UPLOAD",
                    quotaService.getRemainingDailyQuota(currentUser, "RESUME_UPLOAD"));
            quotaRemaining.put("RESUME_TOTAL",
                    getRemainingTotalQuota(currentUser, RoleQuotaConfig.RESUME_TOTAL,
                            (int) resumeRepository.countByUserId(currentUser.getId())));
            quotaRemaining.put("TEXT_INTERVIEW",
                    quotaService.getRemainingDailyQuota(currentUser, "TEXT_INTERVIEW"));
            quotaRemaining.put("VOICE_INTERVIEW",
                    currentUser.getRole() == UserRole.LITE ? 0 :
                            quotaService.getRemainingDailyQuota(currentUser, "VOICE_INTERVIEW"));
            quotaRemaining.put("KB_FILE_TOTAL",
                    getRemainingTotalQuota(currentUser, RoleQuotaConfig.KB_FILE_TOTAL,
                            (int) knowledgeBaseRepository.countByUserId(currentUser.getId())));
            quotaRemaining.put("QA_ASSISTANT",
                    quotaService.getRemainingDailyQuota(currentUser, "QA_ASSISTANT"));
        }

        return UserInfoResponse.builder()
                .userId(currentUser.getId())
                .phone(maskPhone(currentUser.getPhone()))
                .username(currentUser.getUsername())
                .role(currentUser.getRole())
                .subscriptionExpiredAt(currentUser.getSubscriptionExpiredAt())
                .quotaRemaining(quotaRemaining)
                .build();
    }

    // ===== 设置/修改密码 =====

    @Transactional
    public void setPassword(String phone, String code, String newPassword) {
        if (!smsService.verifyCode(phone, code)) {
            throw new BusinessException(ErrorCode.SMS_CODE_INVALID);
        }

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);
    }

    // ===== 更新用户名 =====

    @Transactional
    public UserInfoResponse updateUsername(User currentUser, String newUsername) {
        // 如果用户名没有变化，直接返回
        if (newUsername != null && newUsername.equals(currentUser.getUsername())) {
            return getUserInfo(currentUser);
        }

        // 检查用户名是否已被占用
        if (newUsername != null && !newUsername.isBlank()
                && userRepository.existsByUsername(newUsername)) {
            throw new BusinessException(ErrorCode.USER_USERNAME_EXISTS);
        }

        currentUser.setUsername(newUsername);
        userRepository.save(currentUser);
        return getUserInfo(currentUser);
    }

    // ===== 私有工具方法 =====

    private User registerNewUser(String phone) {
        User user = User.builder()
                .phone(phone)
                .role(UserRole.LITE)
                .build();
        return userRepository.save(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String accessToken = jwtTokenProvider.generateAccessToken(user.getId());
        String refreshToken = jwtTokenProvider.generateAndStoreRefreshToken(user.getId());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .role(user.getRole())
                .phone(maskPhone(user.getPhone()))
                .username(user.getUsername())
                .build();
    }

    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 7) return phone;
        return phone.substring(0, 3) + "****" + phone.substring(7);
    }

    /**
     * 计算总量配额剩余数量。
     *
     * @param user     当前用户
     * @param resource 资源名称
     * @param current  当前已用数量
     * @return 剩余数量；-1 表示无限制
     */
    private int getRemainingTotalQuota(User user, String resource, int current) {
        if (user.getRole() == UserRole.ADMIN) return -1;
        int limit = RoleQuotaConfig.getLimit(user.getRole(), resource);
        if (limit == -1) return -1;
        return Math.max(0, limit - current);
    }
}
