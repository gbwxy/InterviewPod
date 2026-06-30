package interview.modules.resume.service;

import interview.common.exception.BusinessException;
import interview.common.exception.ErrorCode;
import interview.infrastructure.file.FileStorageService;
import interview.modules.interview.service.InterviewPersistenceService;
import interview.modules.resume.model.ResumeEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * 简历删除服务
 * 处理简历删除的业务逻辑
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ResumeDeleteService {
    
    private final ResumePersistenceService persistenceService;
    private final InterviewPersistenceService interviewPersistenceService;
    private final FileStorageService storageService;
    
    /**
     * 删除简历（带用户归属校验）
     *
     * @param id     简历ID
     * @param userId 当前用户 ID（归属校验，不属于该用户则 404）
     * @throws interview.common.exception.BusinessException 如果简历不存在或不属于当前用户
     */
    public void deleteResume(Long id, Long userId) {
        log.info("收到删除简历请求: id={}, userId={}", id, userId);
        
        // 获取简历信息（用于删除存储文件），同时校验归属
        ResumeEntity resume = persistenceService.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.RESUME_NOT_FOUND));
        
        // 1. 删除存储的文件（FileStorageService 已内置存在性检查）
        try {
            storageService.deleteResume(resume.getStorageKey());
        } catch (Exception e) {
            log.warn("删除存储文件失败，继续删除数据库记录: {}", e.getMessage());
        }
        
        // 2. 删除面试会话（会自动删除面试答案）
        interviewPersistenceService.deleteSessionsByResumeId(id);
        
        // 3. 删除数据库记录（包括分析记录）
        persistenceService.deleteResume(id);
        
        log.info("简历删除完成: id={}", id);
    }
}

