package interview.common.annotation;

import java.lang.annotation.*;

/**
 * 配额检查注解
 * <p>添加到 Service 方法上，由 {@link interview.common.aspect.QuotaAspect} 拦截。
 *
 * <pre>
 * {@code
 * @QuotaCheck(resource = "TEXT_INTERVIEW", quotaType = QuotaCheck.QuotaType.COUNT_PER_DAY)
 * public void startInterview(...) { ... }
 * }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface QuotaCheck {

    /** 资源名称，使用 {@link interview.modules.user.model.RoleQuotaConfig} 中的常量 */
    String resource();

    /** 配额类型 */
    QuotaType quotaType() default QuotaType.COUNT_PER_DAY;

    enum QuotaType {
        /** 每日次数限制（计数器，日结重置） */
        COUNT_PER_DAY,
        /** 总量限制（需在切面中通过调用方法获取当前总量） */
        MAX_TOTAL
    }
}
