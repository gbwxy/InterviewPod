package interview.modules.knowledgebase.repository;

import interview.modules.knowledgebase.model.KnowledgeBaseEntity;
import interview.modules.knowledgebase.model.VectorStatus;
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

/**
 * 知识库Repository
 */
@Repository
public interface KnowledgeBaseRepository extends JpaRepository<KnowledgeBaseEntity, Long> {

    /**
     * 根据文件哈希查找知识库（用于去重）
     */
    Optional<KnowledgeBaseEntity> findByFileHash(String fileHash);

    /**
     * 检查文件哈希是否存在
     */
    boolean existsByFileHash(String fileHash);

    /**
     * 按上传时间倒序查找所有知识库
     */
    List<KnowledgeBaseEntity> findAllByOrderByUploadedAtDesc();

    /**
     * 获取所有不同的分类
     */
    @Query("SELECT DISTINCT k.category FROM KnowledgeBaseEntity k WHERE k.category IS NOT NULL ORDER BY k.category")
    List<String> findAllCategories();

    /**
     * 根据分类查找知识库
     */
    List<KnowledgeBaseEntity> findByCategoryOrderByUploadedAtDesc(String category);

    /**
     * 查找未分类的知识库
     */
    List<KnowledgeBaseEntity> findByCategoryIsNullOrderByUploadedAtDesc();

    /**
     * 按名称或文件名模糊搜索（不区分大小写）
     */
    @Query("SELECT k FROM KnowledgeBaseEntity k WHERE LOWER(k.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR LOWER(k.originalFilename) LIKE LOWER(CONCAT('%', :keyword, '%')) ORDER BY k.uploadedAt DESC")
    List<KnowledgeBaseEntity> searchByKeyword(@Param("keyword") String keyword);

    /**
     * 按文件大小排序
     */
    List<KnowledgeBaseEntity> findAllByOrderByFileSizeDesc();

    /**
     * 按访问次数排序
     */
    List<KnowledgeBaseEntity> findAllByOrderByAccessCountDesc();

    /**
     * 按提问次数排序
     */
    List<KnowledgeBaseEntity> findAllByOrderByQuestionCountDesc();

    // ==================== 批量更新 ====================

    /**
     * 批量增加知识库提问计数
     * @param ids 知识库ID列表
     * @return 更新的行数
     */
    @Modifying
    @Query("UPDATE KnowledgeBaseEntity k SET k.questionCount = k.questionCount + 1 WHERE k.id IN :ids")
    int incrementQuestionCountBatch(@Param("ids") List<Long> ids);

    // ==================== 统计查询 ====================

    /**
     * 统计总提问次数
     */
    @Query("SELECT COALESCE(SUM(k.questionCount), 0) FROM KnowledgeBaseEntity k")
    long sumQuestionCount();

    /**
     * 统计总访问次数
     */
    @Query("SELECT COALESCE(SUM(k.accessCount), 0) FROM KnowledgeBaseEntity k")
    long sumAccessCount();

    /**
     * 按向量化状态统计数量
     */
    long countByVectorStatus(VectorStatus vectorStatus);

    /**
     * 按向量化状态查找知识库（按上传时间倒序）
     */
    List<KnowledgeBaseEntity> findByVectorStatusOrderByUploadedAtDesc(VectorStatus vectorStatus);

    // ========== 用户隔离查询 ==========

    /**
     * 查找属于指定用户的所有知识库（按上传时间倒序）
     */
    List<KnowledgeBaseEntity> findByUserIdOrderByUploadedAtDesc(Long userId);

    /**
     * 根据 ID 和用户 ID 查找（用于归属校验）
     */
    Optional<KnowledgeBaseEntity> findByIdAndUserId(Long id, Long userId);

    /**
     * 根据文件哈希和用户 ID 查找（用于用户级去重）
     */
    Optional<KnowledgeBaseEntity> findByFileHashAndUserId(String fileHash, Long userId);

    /**
     * 统计用户的知识库文件数量
     */
    long countByUserId(Long userId);

    // ========== 管理员全量查询 ==========

    /**
     * 按用户 ID 分页查询（管理员接口）
     */
    Page<KnowledgeBaseEntity> findByUserId(Long userId, Pageable pageable);

    /**
     * 按上传时间范围分页查询（管理员接口）
     */
    Page<KnowledgeBaseEntity> findByUploadedAtBetween(LocalDateTime start, LocalDateTime end, Pageable pageable);

    /**
     * 按用户 ID + 时间范围分页查询（管理员接口）
     */
    Page<KnowledgeBaseEntity> findByUserIdAndUploadedAtBetween(Long userId, LocalDateTime start, LocalDateTime end, Pageable pageable);
}

