package interview.modules.user.service;

import com.alipay.api.AlipayClient;
import com.alipay.api.DefaultAlipayClient;
import com.alipay.api.request.AlipayTradePrecreateRequest;
import com.alipay.api.response.AlipayTradePrecreateResponse;
import com.wechat.pay.java.core.RSAAutoCertificateConfig;
import com.wechat.pay.java.service.payments.nativepay.NativePayService;
import com.wechat.pay.java.service.payments.nativepay.model.Amount;
import com.wechat.pay.java.service.payments.nativepay.model.PrepayRequest;
import com.wechat.pay.java.service.payments.nativepay.model.PrepayResponse;
import interview.common.exception.BusinessException;
import interview.common.exception.ErrorCode;
import interview.modules.user.model.PaymentOrder;
import interview.modules.user.model.PaymentProperties;
import interview.modules.user.model.User;
import interview.modules.user.repository.PaymentOrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * 支付服务
 * <p>集成微信 Native 支付和支付宝扫码支付。
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentOrderRepository paymentOrderRepository;
    private final MembershipService membershipService;
    private final PaymentProperties paymentProperties;

    /**
     * 创建支付订单
     *
     * @param user          当前用户
     * @param planId        套餐 ID
     * @param paymentMethod 支付方式（WECHAT / ALIPAY）
     * @return 订单 ID 和支付二维码内容
     */
    @Transactional
    public Map<String, Object> createOrder(User user, String planId, String paymentMethod) {
        MembershipService.PlanInfo plan = membershipService.getPlans().get(planId);
        if (plan == null) {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "无效的套餐 ID");
        }

        // 生成唯一商户订单号
        String outTradeNo = "IP" + System.currentTimeMillis() + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();

        // 创建 PENDING 订单
        PaymentOrder order = PaymentOrder.builder()
                .userId(user.getId())
                .outTradeNo(outTradeNo)
                .planId(planId)
                .paymentMethod(paymentMethod)
                .amount(plan.amount())
                .status("PENDING")
                .build();
        order = paymentOrderRepository.save(order);

        String qrCodeUrl;
        if ("WECHAT".equalsIgnoreCase(paymentMethod)) {
            qrCodeUrl = createWechatOrder(order, plan);
        } else if ("ALIPAY".equalsIgnoreCase(paymentMethod)) {
            qrCodeUrl = createAlipayOrder(order, plan);
        } else {
            throw new BusinessException(ErrorCode.BAD_REQUEST, "不支持的支付方式");
        }

        // 更新二维码 URL
        order.setQrCodeUrl(qrCodeUrl);
        paymentOrderRepository.save(order);

        return Map.of(
                "orderId", order.getId(),
                "outTradeNo", outTradeNo,
                "qrCodeUrl", qrCodeUrl,
                "amount", plan.amount(),
                "paymentMethod", paymentMethod
        );
    }

    /**
     * 查询订单状态
     */
    public Map<String, String> getOrderStatus(Long orderId, Long userId) {
        PaymentOrder order = paymentOrderRepository.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_ORDER_NOT_FOUND));

        return Map.of(
                "status", order.getStatus(),
                "message", switch (order.getStatus()) {
                    case "PENDING" -> "等待支付";
                    case "PAID" -> "支付成功";
                    case "EXPIRED" -> "订单已过期";
                    case "FAILED" -> "支付失败";
                    default -> order.getStatus();
                }
        );
    }

    /**
     * 处理微信支付回调（Webhook）
     */
    @Transactional
    public void handleWechatNotify(String outTradeNo, String transactionId) {
        PaymentOrder order = paymentOrderRepository.findByOutTradeNo(outTradeNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_ORDER_NOT_FOUND));

        // 幂等处理
        if ("PAID".equals(order.getStatus())) {
            log.info("[Payment] Wechat notify duplicate, orderId={}", order.getId());
            return;
        }

        order.setStatus("PAID");
        order.setTransactionId(transactionId);
        order.setPaidAt(LocalDateTime.now());
        paymentOrderRepository.save(order);

        // 触发会员升级
        membershipService.activateSubscription(order.getUserId(), order.getId(), order.getPlanId());
    }

    /**
     * 处理支付宝回调（Webhook）
     */
    @Transactional
    public void handleAlipayNotify(String outTradeNo, String tradeNo) {
        PaymentOrder order = paymentOrderRepository.findByOutTradeNo(outTradeNo)
                .orElseThrow(() -> new BusinessException(ErrorCode.PAYMENT_ORDER_NOT_FOUND));

        // 幂等处理
        if ("PAID".equals(order.getStatus())) {
            log.info("[Payment] Alipay notify duplicate, orderId={}", order.getId());
            return;
        }

        order.setStatus("PAID");
        order.setTransactionId(tradeNo);
        order.setPaidAt(LocalDateTime.now());
        paymentOrderRepository.save(order);

        // 触发会员升级
        membershipService.activateSubscription(order.getUserId(), order.getId(), order.getPlanId());
    }

    /**
     * 每小时检查超时未支付订单（30分钟后自动关闭 PENDING 订单）
     */
    @Scheduled(fixedDelay = 3_600_000)
    @Transactional
    public void expireOrders() {
        LocalDateTime expireTime = LocalDateTime.now().minusMinutes(30);
        paymentOrderRepository.findByStatusAndCreatedAtBefore("PENDING", expireTime)
                .forEach(order -> {
                    order.setStatus("EXPIRED");
                    paymentOrderRepository.save(order);
                    log.info("[Payment] Order expired: outTradeNo={}", order.getOutTradeNo());
                    // 生产环境：调用微信关单 API
                });
    }

    // ===== 私有方法：具体支付调用 =====

    private String createWechatOrder(PaymentOrder order, MembershipService.PlanInfo plan) {
        try {
            PaymentProperties.WechatPay cfg = paymentProperties.getWechatPay();

            // 微信支付 v3 配置
            RSAAutoCertificateConfig config = new RSAAutoCertificateConfig.Builder()
                    .merchantId(cfg.getMchId())
                    .privateKeyFromPath(cfg.getPrivateKeyPath())
                    .merchantSerialNumber(cfg.getSerialNo())
                    .apiV3Key(cfg.getApiV3Key())
                    .build();

            NativePayService nativePayService = new NativePayService.Builder().config(config).build();

            PrepayRequest request = new PrepayRequest();
            request.setAppid(cfg.getAppId());
            request.setMchid(cfg.getMchId());
            request.setDescription("InterviewPod 会员订阅 - " + order.getPlanId());
            request.setOutTradeNo(order.getOutTradeNo());
            request.setNotifyUrl(cfg.getNotifyUrl());

            Amount amount = new Amount();
            // 微信支付金额单位为分
            amount.setTotal(plan.amount().multiply(BigDecimal.valueOf(100)).intValue());
            request.setAmount(amount);

            PrepayResponse response = nativePayService.prepay(request);
            return response.getCodeUrl();

        } catch (Exception e) {
            log.error("[Payment] Wechat create order failed", e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "微信支付下单失败，请稍后重试");
        }
    }

    private String createAlipayOrder(PaymentOrder order, MembershipService.PlanInfo plan) {
        try {
            PaymentProperties.Alipay cfg = paymentProperties.getAlipay();

            AlipayClient alipayClient = new DefaultAlipayClient(
                    cfg.getGatewayUrl(),
                    cfg.getAppId(),
                    cfg.getPrivateKey(),
                    "json",
                    "UTF-8",
                    cfg.getPublicKey(),
                    "RSA2"
            );

            AlipayTradePrecreateRequest request = new AlipayTradePrecreateRequest();
            request.setNotifyUrl(cfg.getNotifyUrl());

            String bizContent = """
                    {
                        "out_trade_no": "%s",
                        "total_amount": "%s",
                        "subject": "InterviewPod 会员订阅",
                        "body": "%s"
                    }
                    """.formatted(
                    order.getOutTradeNo(),
                    plan.amount().toPlainString(),
                    order.getPlanId()
            );
            request.setBizContent(bizContent);

            AlipayTradePrecreateResponse response = alipayClient.execute(request);
            if (response.isSuccess()) {
                return response.getQrCode();
            } else {
                log.error("[Payment] Alipay create order failed: code={} msg={}", response.getCode(), response.getMsg());
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "支付宝下单失败，请稍后重试");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[Payment] Alipay create order failed", e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "支付宝下单失败，请稍后重试");
        }
    }
}
