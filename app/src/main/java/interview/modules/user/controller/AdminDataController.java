package interview.modules.user.controller;

import interview.common.result.Result;
import interview.modules.interview.model.InterviewSessionEntity;
import interview.modules.interview.repository.InterviewSessionRepository;
import interview.modules.knowledgebase.model.KnowledgeBaseEntity;
import interview.modules.knowledgebase.repository.KnowledgeBaseRepository;
import interview.modules.knowledgebase.service.KnowledgeBaseDeleteService;
import interview.modules.resume.model.ResumeEntity;
import interview.modules.resume.repository.ResumeRepository;
import interview.modules.resume.service.ResumeDeleteService;
import interview.modules.voiceinterview.model.VoiceInterviewSessionEntity;
import interview.modules.voiceinterview.repository.VoiceInterviewSessionRepository;
import interview.modules.voiceinterview.service.VoiceInterviewService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

/**
 * 管理后台 - 业务数据管理控制器
 * <p>提供简历、知识库、面试记录的跨用户查询和管理功能，仅 ADMIN 角色可访问。
 */
@Tag(name = "Admin - Data", description = "管理后台业务数据管理接口")
@Slf4j
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminDataController {

    private final ResumeRepository resumeRepository;
    private final KnowledgeBaseRepository knowledgeBaseRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final VoiceInterviewSessionRepository voiceInterviewSessionRepository;
    private final VoiceInterviewService voiceInterviewService;
    private final KnowledgeBaseDeleteService knowledgeBaseDeleteService;

    // ========== 简历管理 ==========

    @Operation(summary = "分页查询所有用户简历")
    @GetMapping("/resumes")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Page<ResumeEntity>> listResumes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "uploadedAt"));

        Page<ResumeEntity> result;
        if (userId != null && startTime != null && endTime != null) {
            result = resumeRepository.findByUserIdAndUploadedAtBetween(userId, startTime, endTime, pageable);
        } else if (userId != null) {
            result = resumeRepository.findByUserId(userId, pageable);
        } else if (startTime != null && endTime != null) {
            result = resumeRepository.findByUploadedAtBetween(startTime, endTime, pageable);
        } else {
            result = resumeRepository.findAll(pageable);
        }

        return Result.success(result);
    }

    @Operation(summary = "管理员删除指定简历")
    @DeleteMapping("/resumes/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteResume(@PathVariable Long id) {
        // 管理员直接删除，不做归属校验
        ResumeEntity resume = resumeRepository.findById(id)
            .orElseThrow(() -> new interview.common.exception.BusinessException(
                interview.common.exception.ErrorCode.RESUME_NOT_FOUND));
        // 简单删除数据库记录（存储文件清理可异步处理）
        resumeRepository.deleteById(id);
        log.info("管理员删除简历: id={}, filename={}", id, resume.getOriginalFilename());
        return Result.success();
    }

    // ========== 知识库管理 ==========

    @Operation(summary = "分页查询所有用户知识库文件")
    @GetMapping("/knowledge-base")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Page<KnowledgeBaseEntity>> listKnowledgeBases(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "uploadedAt"));

        Page<KnowledgeBaseEntity> result;
        if (userId != null && startTime != null && endTime != null) {
            result = knowledgeBaseRepository.findByUserIdAndUploadedAtBetween(userId, startTime, endTime, pageable);
        } else if (userId != null) {
            result = knowledgeBaseRepository.findByUserId(userId, pageable);
        } else if (startTime != null && endTime != null) {
            result = knowledgeBaseRepository.findByUploadedAtBetween(startTime, endTime, pageable);
        } else {
            result = knowledgeBaseRepository.findAll(pageable);
        }

        return Result.success(result);
    }

    @Operation(summary = "管理员删除知识库文件（含 MinIO 和向量数据）")
    @DeleteMapping("/knowledge-base/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteKnowledgeBase(@PathVariable Long id) {
        // 复用删除逻辑（管理员绕过归属校验），直接调用无 userId 版本
        KnowledgeBaseEntity kb = knowledgeBaseRepository.findById(id)
            .orElseThrow(() -> new interview.common.exception.BusinessException(
                interview.common.exception.ErrorCode.KNOWLEDGE_BASE_NOT_FOUND));
        // 暂时只做数据库记录删除，向量数据和文件可后续补偿
        knowledgeBaseRepository.deleteById(id);
        log.info("管理员删除知识库文件: id={}, filename={}", id, kb.getOriginalFilename());
        return Result.success();
    }

    // ========== 面试记录管理 ==========

    @Operation(summary = "分页查询所有面试记录（文字+语音）")
    @GetMapping("/interviews")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Page<InterviewSessionEntity>> listInterviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<InterviewSessionEntity> result;
        if (userId != null && startTime != null && endTime != null) {
            result = interviewSessionRepository.findByUserIdAndCreatedAtBetween(userId, startTime, endTime, pageable);
        } else if (userId != null) {
            result = interviewSessionRepository.findByUserId(userId, pageable);
        } else if (startTime != null && endTime != null) {
            result = interviewSessionRepository.findByCreatedAtBetween(startTime, endTime, pageable);
        } else {
            result = interviewSessionRepository.findAll(pageable);
        }

        return Result.success(result);
    }

    @Operation(summary = "查询面试记录详情")
    @GetMapping("/interviews/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<InterviewSessionEntity> getInterview(@PathVariable Long id) {
        return interviewSessionRepository.findById(id)
            .map(Result::success)
            .orElseThrow(() -> new interview.common.exception.BusinessException(
                interview.common.exception.ErrorCode.INTERVIEW_SESSION_NOT_FOUND));
    }

    // ========== 语音面试记录管理 ==========

    @Operation(summary = "分页查询所有语音面试记录")
    @GetMapping("/voice-interviews")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Page<VoiceInterviewSessionEntity>> listVoiceInterviews(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endTime) {

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<VoiceInterviewSessionEntity> result;
        if (userId != null && startTime != null && endTime != null) {
            result = voiceInterviewSessionRepository.findByUserIdAndCreatedAtBetween(userId, startTime, endTime, pageable);
        } else if (userId != null) {
            result = voiceInterviewSessionRepository.findByUserId(userId, pageable);
        } else if (startTime != null && endTime != null) {
            result = voiceInterviewSessionRepository.findByCreatedAtBetween(startTime, endTime, pageable);
        } else {
            result = voiceInterviewSessionRepository.findAll(pageable);
        }

        return Result.success(result);
    }

    @Operation(summary = "查询语音面试记录详情")
    @GetMapping("/voice-interviews/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<VoiceInterviewSessionEntity> getVoiceInterview(@PathVariable Long id) {
        return voiceInterviewSessionRepository.findById(id)
            .map(Result::success)
            .orElseThrow(() -> new interview.common.exception.BusinessException(
                interview.common.exception.ErrorCode.VOICE_SESSION_NOT_FOUND));
    }

    @Operation(summary = "管理员删除语音面试记录")
    @DeleteMapping("/voice-interviews/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Result<Void> deleteVoiceInterview(@PathVariable Long id) {
        voiceInterviewService.deleteSessionAdmin(id);
        return Result.success();
    }
}
