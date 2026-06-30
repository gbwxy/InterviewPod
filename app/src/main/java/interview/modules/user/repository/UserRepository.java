package interview.modules.user.repository;

import interview.modules.user.model.User;
import interview.modules.user.model.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhone(String phone);

    Optional<User> findByUsername(String username);

    boolean existsByPhone(String phone);

    boolean existsByUsername(String username);

    /** 查找订阅已到期且角色仍为 PRO 或 MAX_PLUS 的用户（用于定时降级任务） */
    @Query("SELECT u FROM User u WHERE u.subscriptionExpiredAt < :now AND u.role IN :roles")
    List<User> findExpiredSubscriptions(LocalDateTime now, List<UserRole> roles);

    // ===== Admin 查询方法 =====

    Page<User> findByRole(UserRole role, Pageable pageable);

    Page<User> findByPhoneContainingOrUsernameContaining(String phone, String username, Pageable pageable);

    Page<User> findByRoleAndPhoneContainingOrUsernameContaining(UserRole role, String phone, String username, Pageable pageable);

    long countByRole(UserRole role);
}
