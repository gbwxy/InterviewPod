package interview.modules.resume.repository;

import interview.modules.resume.model.ResumeEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 简历Repository
 */
@Repository
public interface ResumeRepository extends JpaRepository<ResumeEntity, Long> {
    
    /**
     * 根据文件哈希查找简历（用于去重）
     */
    Optional<ResumeEntity> findByFileHash(String fileHash);
    
    /**
     * 检查文件哈希是否存在
     */
    boolean existsByFileHash(String fileHash);

    // ========== 用户隔离查询 ==========

    /**
     * 查找属于指定用户的所有简历（按上传时间倒序）
     */
    List<ResumeEntity> findByUserIdOrderByUploadedAtDesc(Long userId);

    /**
     * 根据 ID 和用户 ID 查找简历（用于归属校验）
     */
    Optional<ResumeEntity> findByIdAndUserId(Long id, Long userId);

    /**
     * 统计用户的简历数量
     */
    long countByUserId(Long userId);

    // ========== 管理员全量查询 ==========

    /**
     * 按用户 ID 分页查询（管理员接口）
     */
    Page<ResumeEntity> findByUserId(Long userId, Pageable pageable);

    /**
     * 按上传时间范围分页查询（管理员接口）
     */
    Page<ResumeEntity> findByUploadedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * 按用户 ID + 时间范围分页查询（管理员接口）
     */
    Page<ResumeEntity> findByUserIdAndUploadedAtBetween(Long userId, LocalDateTime start, LocalDateTime end, Pageable pageable);
}
