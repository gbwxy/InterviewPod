package interview.modules.user.model;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 支付配置属性根类
 */
@Data
@Component
@ConfigurationProperties(prefix = "app")
public class PaymentProperties {

    private WechatPay wechatPay = new WechatPay();
    private Alipay alipay = new Alipay();

    @Data
    public static class WechatPay {
        private String mchId;
        private String apiV3Key;
        private String appId;
        private String serialNo;
        private String privateKeyPath;
        private String notifyUrl;
    }

    @Data
    public static class Alipay {
        private boolean sandbox = true;
        private String appId;
        private String privateKey;
        private String publicKey;
        private String notifyUrl;
        private String gatewayUrl = "https://openapi-sandbox.dl.alipaydev.com/gateway.do";
    }
}
