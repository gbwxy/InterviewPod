package interview.modules.user.controller;

import interview.common.result.Result;
import interview.modules.user.model.User;
import interview.modules.user.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 支付控制器
 */
@Slf4j
@Tag(name = "Payment", description = "支付相关接口")
@RestController
@RequestMapping
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @Operation(summary = "创建订阅订单并获取支付二维码")
    @PostMapping("/api/membership/subscribe")
    public Result<Map<String, Object>> subscribe(
            @AuthenticationPrincipal User currentUser,
            @RequestBody Map<String, String> request) {
        String planId = request.get("planId");
        String paymentMethod = request.getOrDefault("paymentMethod", "WECHAT");
        Map<String, Object> result = paymentService.createOrder(currentUser, planId, paymentMethod);
        return Result.success(result);
    }

    @Operation(summary = "查询支付订单状态")
    @GetMapping("/api/payment/status/{orderId}")
    public Result<Map<String, String>> getStatus(
            @AuthenticationPrincipal User currentUser,
            @PathVariable Long orderId) {
        Map<String, String> status = paymentService.getOrderStatus(orderId, currentUser.getId());
        return Result.success(status);
    }

    // ===== 支付回调（Webhook）=====

    @Operation(summary = "微信支付回调（由微信服务器调用）")
    @PostMapping("/api/payment/notify/wechat")
    public Map<String, String> wechatNotify(HttpServletRequest httpRequest,
                                             @RequestBody String body) {
        try {
            // 从请求头获取微信签名信息
            String timestamp = httpRequest.getHeader("Wechatpay-Timestamp");
            String nonce = httpRequest.getHeader("Wechatpay-Nonce");
            String signature = httpRequest.getHeader("Wechatpay-Signature");
            String serial = httpRequest.getHeader("Wechatpay-Serial");

            // TODO: 使用微信 SDK 验证签名
            // 这里简化处理，生产环境必须实现签名验证
            log.info("[Wechat] Received notify, timestamp={} nonce={}", timestamp, nonce);

            // 解析回调数据（实际需要 AES-GCM 解密）
            // 此处提供接口框架，具体签名验证和解密逻辑在微信支付 SDK 中实现
            // paymentService.handleWechatNotify(outTradeNo, transactionId);

            return Map.of("code", "SUCCESS", "message", "成功");
        } catch (Exception e) {
            log.error("[Wechat] Notify handling failed", e);
            return Map.of("code", "FAIL", "message", "处理失败");
        }
    }

    @Operation(summary = "支付宝支付回调（由支付宝服务器调用）")
    @PostMapping("/api/payment/notify/alipay")
    public String alipayNotify(HttpServletRequest httpRequest) {
        try {
            String outTradeNo = httpRequest.getParameter("out_trade_no");
            String tradeNo = httpRequest.getParameter("trade_no");
            String tradeStatus = httpRequest.getParameter("trade_status");

            log.info("[Alipay] Received notify, outTradeNo={} tradeStatus={}", outTradeNo, tradeStatus);

            // TODO: 使用支付宝 SDK 验证签名
            // 验证签名后处理支付成功
            if ("TRADE_SUCCESS".equals(tradeStatus) || "TRADE_FINISHED".equals(tradeStatus)) {
                paymentService.handleAlipayNotify(outTradeNo, tradeNo);
            }

            return "success";
        } catch (Exception e) {
            log.error("[Alipay] Notify handling failed", e);
            return "fail";
        }
    }
}
