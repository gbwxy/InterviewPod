package interview.modules.interviewschedule.service;

import interview.common.exception.BusinessException;
import interview.common.exception.ErrorCode;
import interview.modules.interviewschedule.model.CreateInterviewRequest;
import interview.modules.interviewschedule.model.InterviewScheduleDTO;
import interview.modules.interviewschedule.model.InterviewScheduleEntity;
import interview.modules.interviewschedule.model.InterviewStatus;
import interview.modules.interviewschedule.repository.InterviewScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InterviewScheduleService {

    private final InterviewScheduleRepository repository;

    private static final String[] COPYABLE_FIELDS = {
        "companyName", "position", "interviewTime", "interviewType",
        "meetingLink", "roundNumber", "interviewer", "notes"
    };

    /**
     * 创建面试日程（绑定用户）
     */
    @Transactional
    public InterviewScheduleDTO create(CreateInterviewRequest request, Long userId) {
        InterviewScheduleEntity entity = new InterviewScheduleEntity();
        BeanUtils.copyProperties(request, entity);
        entity.setStatus(InterviewStatus.PENDING);
        entity.setUserId(userId);

        return toDTO(repository.save(entity));
    }

    /**
     * 更新面试日程（带归属校验）
     */
    @Transactional
    public InterviewScheduleDTO update(Long id, CreateInterviewRequest request, Long userId) {
        InterviewScheduleEntity entity = getByIdAndUserIdOrThrow(id, userId);
        BeanUtils.copyProperties(request, entity, "id", "status", "userId");
        return toDTO(repository.save(entity));
    }

    /**
     * 删除面试日程（带归属校验）
     */
    @Transactional
    public void delete(Long id, Long userId) {
        // 归属校验
        getByIdAndUserIdOrThrow(id, userId);
        repository.deleteById(id);
    }

    /**
     * 更新面试状态（带归属校验）
     */
    @Transactional
    public InterviewScheduleDTO updateStatus(Long id, InterviewStatus status, Long userId) {
        InterviewScheduleEntity entity = getByIdAndUserIdOrThrow(id, userId);
        entity.setStatus(status);
        return toDTO(repository.save(entity));
    }

    /**
     * 获取当前用户的面试日程列表（支持状态/时间过滤）
     */
    public List<InterviewScheduleDTO> getAll(String status, LocalDateTime start, LocalDateTime end, Long userId) {
        List<InterviewScheduleEntity> entities;

        // 先按用户过滤，再做时间/状态二次过滤
        List<InterviewScheduleEntity> userEntities = repository.findByUserIdOrderByInterviewTimeAsc(userId);

        if (start != null && end != null) {
            LocalDateTime finalStart = start;
            LocalDateTime finalEnd = end;
            entities = userEntities.stream()
                .filter(e -> !e.getInterviewTime().isBefore(finalStart) && !e.getInterviewTime().isAfter(finalEnd))
                .toList();
        } else if (status != null) {
            InterviewStatus statusEnum = InterviewStatus.valueOf(status);
            entities = userEntities.stream()
                .filter(e -> statusEnum.equals(e.getStatus()))
                .toList();
        } else {
            entities = userEntities;
        }

        return entities.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    /**
     * 根据 ID 获取面试日程（带归属校验）
     */
    public InterviewScheduleDTO getById(Long id, Long userId) {
        return toDTO(getByIdAndUserIdOrThrow(id, userId));
    }

    private InterviewScheduleEntity getByIdAndUserIdOrThrow(Long id, Long userId) {
        return repository.findByIdAndUserId(id, userId)
            .orElseThrow(() -> new BusinessException(ErrorCode.INTERVIEW_SCHEDULE_NOT_FOUND, "面试日程不存在: " + id));
    }

    private InterviewScheduleDTO toDTO(InterviewScheduleEntity entity) {
        InterviewScheduleDTO dto = new InterviewScheduleDTO();
        BeanUtils.copyProperties(entity, dto);
        return dto;
    }
}
