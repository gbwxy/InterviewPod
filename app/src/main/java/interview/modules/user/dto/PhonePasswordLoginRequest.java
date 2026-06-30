package interview.modules.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.Data;

@Data
public class PhonePasswordLoginRequest {
    @NotBlank(message = "手机号不能为空")
    @Pattern(regexp = "^1[3-9]\\d{9}$", message = "仅支持中国大陆手机号")
    private String phone;

    @NotBlank(message = "密码不能为空")
    private String password;
}
