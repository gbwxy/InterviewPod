package interview.modules.interviewschedule.repository;

import interview.modules.interviewschedule.model.InterviewScheduleEntity;
import interview.modules.interviewschedule.model.InterviewStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface InterviewScheduleRepository extends JpaRepository<InterviewScheduleEntity, Long> {
    List<InterviewScheduleEntity> findByStatusAndInterviewTimeBefore(InterviewStatus status, LocalDateTime time);

    List<InterviewScheduleEntity> findByStatus(InterviewStatus status);

    List<InterviewScheduleEntity> findByInterviewTimeBetween(LocalDateTime start, LocalDateTime end);

    @Modifying
    @Query("UPDATE InterviewScheduleEntity e SET e.status = :newStatus WHERE e.status = :oldStatus AND e.interviewTime < :cutoff")
    int updateStatusByStatusAndInterviewTimeBefore(
        @Param("newStatus") InterviewStatus newStatus,
        @Param("oldStatus") InterviewStatus oldStatus,
        @Param("cutoff") LocalDateTime cutoff);

    // ========== 用户隔离查询 ==========

    /**
     * 查找属于指定用户的所有日程（按面试时间升序）
     */
    List<InterviewScheduleEntity> findByUserIdOrderByInterviewTimeAsc(Long userId);

    /**
     * 根据 ID 和用户 ID 查找（归属校验）
     */
    Optional<InterviewScheduleEntity> findByIdAndUserId(Long id, Long userId);
}
