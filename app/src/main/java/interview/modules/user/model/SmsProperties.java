package interview.modules.user.model;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 短信（阿里云）配置属性，绑定 application.yml 中 app.sms.*
 */
@Data
@Component
@ConfigurationProperties(prefix = "app.sms")
public class SmsProperties {

    /** true = 开发Mock模式（固定验证码888888），false = 调用真实阿里云短信 */
    private boolean mock = true;

    private String accessKeyId;
    private String accessKeySecret;
    private String signName;
    private String templateCode;
    private String endpoint = "dysmsapi.aliyuncs.com";
}
