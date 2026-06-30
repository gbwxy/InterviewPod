package interview.modules.user.repository;

import interview.modules.user.model.Subscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SubscriptionRepository extends JpaRepository<Subscription, Long> {

    /** 查询指定用户最新的订阅记录 */
    Optional<Subscription> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    /** 查询指定用户未过期的订阅 */
    Optional<Subscription> findTopByUserIdAndExpiredFalseOrderByExpiredAtDesc(Long userId);
}
