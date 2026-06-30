package interview.modules.voiceinterview.repository;

import interview.common.model.AsyncTaskStatus;
import interview.modules.voiceinterview.model.VoiceInterviewSessionEntity;
import interview.modules.voiceinterview.model.VoiceInterviewSessionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 语音面试会话Repository
 */
@Repository
public interface VoiceInterviewSessionRepository extends JpaRepository<VoiceInterviewSessionEntity, Long> {

    /**
     * 根据用户ID查找所有会话，按开始时间倒序
     */
    List<VoiceInterviewSessionEntity> findByUserIdOrderByStartTimeDesc(Long userId);

    /**
     * Find all sessions for a user, ordered by update time
     */
    List<VoiceInterviewSessionEntity> findByUserIdOrderByUpdatedAtDesc(Long userId);

    /**
     * Find sessions by user and status, ordered by update time
     */
    List<VoiceInterviewSessionEntity> findByUserIdAndStatusOrderByUpdatedAtDesc(
        Long userId,
        VoiceInterviewSessionStatus status
    );

    /**
     * 根据 sessionId 和 userId 查找（用于归属校验）
     */
    Optional<VoiceInterviewSessionEntity> findByIdAndUserId(Long id, Long userId);

    /**
     * 查找指定状态且开始时间早于给定时间的会话（清理过期会话用）
     */
    List<VoiceInterviewSessionEntity> findByStatusAndStartTimeBefore(
        VoiceInterviewSessionStatus status,
        LocalDateTime time
    );

    /**
     * 查找评估状态卡在 PROCESSING 的会话
     */
    List<VoiceInterviewSessionEntity> findByEvaluateStatusAndUpdatedAtBefore(
        AsyncTaskStatus evaluateStatus,
        LocalDateTime time
    );

    /**
     * 管理员分页查询（按 userId 过滤）
     */
    Page<VoiceInterviewSessionEntity> findByUserId(Long userId, Pageable pageable);

    /**
     * 管理员分页查询（按时间范围过滤）
     */
    Page<VoiceInterviewSessionEntity> findByCreatedAtBetween(LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);

    /**
     * 管理员分页查询（按 userId + 时间范围过滤）
     */
    Page<VoiceInterviewSessionEntity> findByUserIdAndCreatedAtBetween(Long userId, LocalDateTime startTime, LocalDateTime endTime, Pageable pageable);
}
