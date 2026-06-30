package interview.modules.user.service;

import com.aliyun.dysmsapi20170525.Client;
import com.aliyun.dysmsapi20170525.models.SendSmsRequest;
import com.aliyun.dysmsapi20170525.models.SendSmsResponse;
import com.aliyun.teaopenapi.models.Config;
import interview.common.exception.BusinessException;
import interview.common.exception.ErrorCode;
import interview.modules.user.model.SmsProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.redisson.api.RAtomicLong;
import org.redisson.api.RBucket;
import org.redisson.api.RedissonClient;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

/**
 * 短信验证码服务
 * <p>
 * - 验证码 6 位随机数字，存 Redis，TTL 5 分钟<br>
 * - 同一手机号：60s 内限 1 次，每日限 10 次<br>
 * - Mock 模式（{@code app.sms.mock=true}）：固定验证码 {@code 888888}，不调用阿里云 API<br>
 * - 错误 3 次后自动删除验证码（防枚举）
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SmsService {

    private static final String MOCK_CODE = "888888";
    private static final String CODE_PREFIX = "sms:code:";
    private static final String CODE_ATTEMPTS_PREFIX = "sms:attempts:";
    private static final String RATE_LIMIT_60S_PREFIX = "sms:limit60s:";
    private static final String RATE_LIMIT_DAILY_PREFIX = "sms:limitday:";
    private static final int MAX_DAILY_SENDS = 10;
    private static final int MAX_VERIFY_ATTEMPTS = 3;

    private final SmsProperties smsProperties;
    private final RedissonClient redissonClient;

    /**
     * 发送短信验证码
     *
     * @param phone 手机号（已校验格式）
     */
    public void sendCode(String phone) {
        // 1. 60 秒内限频检查
        String rate60sKey = RATE_LIMIT_60S_PREFIX + phone;
        RBucket<String> rate60sBucket = redissonClient.getBucket(rate60sKey);
        if (rate60sBucket.isExists()) {
            long ttl = rate60sBucket.remainTimeToLive() / 1000;
            throw new BusinessException(ErrorCode.RATE_LIMIT_EXCEEDED,
                    "发送太频繁，请 " + ttl + " 秒后重试");
        }

        // 2. 每日发送次数限制
        String today = LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE);
        String dailyKey = RATE_LIMIT_DAILY_PREFIX + phone + ":" + today;
        RAtomicLong dailyCount = redissonClient.getAtomicLong(dailyKey);
        // 设置 TTL（首次设置）
        if (!redissonClient.getBucket(dailyKey).isExists()) {
            dailyCount.set(0);
            redissonClient.getBucket(dailyKey).expireIfNotSet(Duration.ofHours(25));
        }
        if (dailyCount.get() >= MAX_DAILY_SENDS) {
            throw new BusinessException(ErrorCode.RATE_LIMIT_EXCEEDED, "今日发送次数已达上限，请明日再试");
        }

        // 3. 生成验证码
        String code = smsProperties.isMock() ? MOCK_CODE : generateCode();

        // 4. 存储验证码到 Redis（TTL 5分钟）
        String codeKey = CODE_PREFIX + phone;
        redissonClient.getBucket(codeKey).set(code, Duration.ofMinutes(5));
        // 重置错误次数
        redissonClient.getBucket(CODE_ATTEMPTS_PREFIX + phone).delete();

        // 5. 设置 60 秒限频 key
        rate60sBucket.set("1", Duration.ofSeconds(60));

        // 6. 递增每日发送计数
        dailyCount.incrementAndGet();
        redissonClient.getBucket(dailyKey).expire(Duration.ofHours(25));

        // 7. 实际发送（Mock 模式跳过）
        if (smsProperties.isMock()) {
            log.info("[SMS Mock] phone={} code={}", phone, code);
        } else {
            doSendAliyunSms(phone, code);
        }
    }

    /**
     * 校验短信验证码
     *
     * @param phone 手机号
     * @param code  用户输入的验证码
     * @return true = 验证通过；false = 验证失败
     */
    public boolean verifyCode(String phone, String code) {
        // Mock 模式：固定验证码直接通过
        if (smsProperties.isMock() && MOCK_CODE.equals(code)) {
            return true;
        }

        String codeKey = CODE_PREFIX + phone;
        RBucket<String> codeBucket = redissonClient.getBucket(codeKey);
        String stored = codeBucket.get();

        if (stored == null) {
            return false; // 验证码不存在或已过期
        }

        String attemptsKey = CODE_ATTEMPTS_PREFIX + phone;
        RAtomicLong attempts = redissonClient.getAtomicLong(attemptsKey);

        if (stored.equals(code)) {
            // 验证成功，删除验证码
            codeBucket.delete();
            redissonClient.getBucket(attemptsKey).delete();
            return true;
        } else {
            // 验证失败，递增错误次数
            long current = attempts.incrementAndGet();
            if (current >= MAX_VERIFY_ATTEMPTS) {
                // 错误 3 次，删除验证码
                codeBucket.delete();
                redissonClient.getBucket(attemptsKey).delete();
                log.warn("[SMS] Code attempts exceeded for phone={}", phone);
            }
            return false;
        }
    }

    private String generateCode() {
        SecureRandom random = new SecureRandom();
        return String.format("%06d", random.nextInt(1_000_000));
    }

    private void doSendAliyunSms(String phone, String code) {
        try {
            Config config = new Config()
                    .setAccessKeyId(smsProperties.getAccessKeyId())
                    .setAccessKeySecret(smsProperties.getAccessKeySecret())
                    .setEndpoint(smsProperties.getEndpoint());

            Client client = new Client(config);

            SendSmsRequest request = new SendSmsRequest()
                    .setPhoneNumbers(phone)
                    .setSignName(smsProperties.getSignName())
                    .setTemplateCode(smsProperties.getTemplateCode())
                    .setTemplateParam("{\"code\":\"" + code + "\"}");

            SendSmsResponse response = client.sendSms(request);
            if (response == null || response.getBody() == null) {
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "短信发送失败");
            }
            String resultCode = response.getBody().getCode();
            if (!"OK".equals(resultCode)) {
                log.error("[SMS] Aliyun send failed: code={} message={}",
                        resultCode, response.getBody().getMessage());
                throw new BusinessException(ErrorCode.INTERNAL_ERROR, "短信发送失败，请稍后重试");
            }
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("[SMS] Aliyun SMS error", e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "短信发送失败，请稍后重试");
        }
    }
}
