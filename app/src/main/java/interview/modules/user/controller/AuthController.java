package interview.modules.user.controller;

import interview.common.result.Result;
import interview.modules.user.dto.*;
import interview.modules.user.model.User;
import interview.modules.user.service.AuthService;
import interview.modules.user.service.SmsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 用户认证控制器
 */
@Tag(name = "Auth", description = "用户认证相关接口")
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final SmsService smsService;

    @Operation(summary = "发送短信验证码")
    @PostMapping("/send-sms")
    public Result<Void> sendSms(@Valid @RequestBody SendSmsRequest request) {
        smsService.sendCode(request.getPhone());
        return Result.success();
    }

    @Operation(summary = "手机号+验证码登录/注册")
    @PostMapping("/login/sms")
    public Result<AuthResponse> loginBySms(@Valid @RequestBody SmsLoginRequest request) {
        AuthResponse response = authService.loginBySms(request.getPhone(), request.getCode());
        return Result.success(response);
    }

    @Operation(summary = "手机号+密码登录")
    @PostMapping("/login/phone-password")
    public Result<AuthResponse> loginByPhonePassword(
            @Valid @RequestBody PhonePasswordLoginRequest request) {
        AuthResponse response = authService.loginByPhonePassword(request.getPhone(), request.getPassword());
        return Result.success(response);
    }

    @Operation(summary = "用户名+密码登录")
    @PostMapping("/login/username-password")
    public Result<AuthResponse> loginByUsernamePassword(
            @Valid @RequestBody UsernamePasswordLoginRequest request) {
        AuthResponse response = authService.loginByUsernamePassword(
                request.getUsername(), request.getPassword());
        return Result.success(response);
    }

    @Operation(summary = "刷新 Access Token")
    @PostMapping("/refresh")
    public Result<Map<String, String>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        String newAccessToken = authService.refreshAccessToken(request.getRefreshToken());
        return Result.success(Map.of("accessToken", newAccessToken));
    }

    @Operation(summary = "登出")
    @PostMapping("/logout")
    public Result<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return Result.success();
    }

    @Operation(summary = "获取当前用户信息")
    @GetMapping("/me")
    public Result<UserInfoResponse> getMe(@AuthenticationPrincipal User currentUser) {
        UserInfoResponse info = authService.getUserInfo(currentUser);
        return Result.success(info);
    }

    @Operation(summary = "更新用户信息（用户名）")
    @PatchMapping("/me")
    public Result<UserInfoResponse> updateMe(
            @AuthenticationPrincipal User currentUser,
            @Valid @RequestBody UpdateUsernameRequest request) {
        UserInfoResponse updated = authService.updateUsername(currentUser, request.getUsername());
        return Result.success(updated);
    }

    @Operation(summary = "设置/修改密码")
    @PostMapping("/set-password")
    public Result<Void> setPassword(@Valid @RequestBody SetPasswordRequest request) {
        authService.setPassword(request.getPhone(), request.getCode(), request.getNewPassword());
        return Result.success();
    }
}
