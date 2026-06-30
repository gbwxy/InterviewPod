package interview.modules.user.repository;

import interview.modules.user.model.PaymentOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentOrderRepository extends JpaRepository<PaymentOrder, Long> {

    Optional<PaymentOrder> findByOutTradeNo(String outTradeNo);

    Optional<PaymentOrder> findByIdAndUserId(Long id, Long userId);

    /** 查找超时的 PENDING 订单（用于定时关单） */
    List<PaymentOrder> findByStatusAndCreatedAtBefore(String status, LocalDateTime before);
}
