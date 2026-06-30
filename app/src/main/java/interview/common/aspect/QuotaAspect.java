package interview.common.aspect;

import interview.common.annotation.QuotaCheck;
import interview.common.exception.BusinessException;
import interview.common.exception.ErrorCode;
import interview.modules.user.model.User;
import interview.modules.user.service.QuotaService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * 配额检查 AOP 切面
 * <p>拦截带有 {@link QuotaCheck} 注解的方法，在执行前检查配额。
 * ADMIN 用户直接放行，不检查配额。
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class QuotaAspect {

    private final QuotaService quotaService;

    @Around("@annotation(quotaCheck)")
    public Object aroundQuotaCheck(ProceedingJoinPoint joinPoint, QuotaCheck quotaCheck) throws Throwable {
        User currentUser = getCurrentUser();
        if (currentUser == null) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED);
        }

        String resource = quotaCheck.resource();
        QuotaCheck.QuotaType quotaType = quotaCheck.quotaType();

        if (quotaType == QuotaCheck.QuotaType.COUNT_PER_DAY) {
            // 每日计数配额：在执行前检查并扣减
            quotaService.checkAndConsumeDailyQuota(currentUser, resource);
        }
        // MAX_TOTAL 类型需要业务层提供当前数量，不在此处扣减

        return joinPoint.proceed();
    }

    private User getCurrentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.getPrincipal() instanceof User user) {
                return user;
            }
        } catch (Exception e) {
            log.debug("Failed to get current user from SecurityContext", e);
        }
        return null;
    }
}
