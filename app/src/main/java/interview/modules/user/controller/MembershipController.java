package interview.modules.user.controller;

import interview.common.result.Result;
import interview.modules.user.model.User;
import interview.modules.user.service.MembershipService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 会员订阅控制器
 */
@Tag(name = "Membership", description = "会员订阅相关接口")
@RestController
@RequestMapping("/api/membership")
@RequiredArgsConstructor
public class MembershipController {

    private final MembershipService membershipService;

    @Operation(summary = "获取可购买的套餐列表（无需登录）")
    @GetMapping("/plans")
    public Result<Map<String, ?>> getPlans() {
        return Result.success(membershipService.getPlans());
    }

    @Operation(summary = "获取当前订阅状态")
    @GetMapping("/status")
    public Result<MembershipService.SubscriptionStatus> getStatus(
            @AuthenticationPrincipal User currentUser) {
        return Result.success(membershipService.getStatus(currentUser));
    }
}
