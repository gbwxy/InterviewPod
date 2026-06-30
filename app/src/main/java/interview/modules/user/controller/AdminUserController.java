package interview.modules.user.controller;

import interview.common.result.Result;
import interview.modules.user.model.User;
import interview.modules.user.model.UserRole;
import interview.modules.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 管理后台 - 用户管理控制器
 * <p>仅 ADMIN 角色可访问。
 */
@Tag(name = "Admin - User", description = "管理后台用户管理接口")
@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;

    @Operation(summary = "分页查询用户列表")
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Page<User>> listUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) UserRole role) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<User> result;
        if (keyword != null && !keyword.isBlank() && role != null) {
            result = userRepository.findByRoleAndPhoneContainingOrUsernameContaining(
                    role, keyword, keyword, pageable);
        } else if (keyword != null && !keyword.isBlank()) {
            result = userRepository.findByPhoneContainingOrUsernameContaining(
                    keyword, keyword, pageable);
        } else if (role != null) {
            result = userRepository.findByRole(role, pageable);
        } else {
            result = userRepository.findAll(pageable);
        }

        return Result.success(result);
    }

    @Operation(summary = "获取用户详情")
    @GetMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<User> getUser(@PathVariable Long userId) {
        return Result.success(userRepository.findById(userId).orElse(null));
    }

    @Operation(summary = "修改用户角色")
    @PutMapping("/{userId}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateRole(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        UserRole newRole = UserRole.valueOf(request.get("role"));
        User user = userRepository.findById(userId).orElseThrow();
        user.setRole(newRole);
        // 如果降级为 LITE，清除到期时间
        if (newRole == UserRole.LITE) {
            user.setSubscriptionExpiredAt(null);
        }
        userRepository.save(user);
        return Result.success();
    }

    @Operation(summary = "修改用户订阅到期时间")
    @PutMapping("/{userId}/expiry")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> updateExpiry(
            @PathVariable Long userId,
            @RequestBody Map<String, String> request) {
        String expiredAt = request.get("expiredAt");
        User user = userRepository.findById(userId).orElseThrow();
        if (expiredAt != null && !expiredAt.isBlank()) {
            user.setSubscriptionExpiredAt(LocalDateTime.parse(expiredAt));
        } else {
            user.setSubscriptionExpiredAt(null);
        }
        userRepository.save(user);
        return Result.success();
    }

    @Operation(summary = "删除用户")
    @DeleteMapping("/{userId}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteUser(@PathVariable Long userId) {
        userRepository.deleteById(userId);
        return Result.success();
    }

    @Operation(summary = "获取用户统计信息")
    @GetMapping("/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Map<String, Long>> getStats() {
        long total = userRepository.count();
        long liteCount = userRepository.countByRole(UserRole.LITE);
        long proCount = userRepository.countByRole(UserRole.PRO);
        long maxCount = userRepository.countByRole(UserRole.MAX_PLUS);
        long adminCount = userRepository.countByRole(UserRole.ADMIN);
        return Result.success(Map.of(
                "total", total,
                "lite", liteCount,
                "pro", proCount,
                "maxPlus", maxCount,
                "admin", adminCount
        ));
    }
}
