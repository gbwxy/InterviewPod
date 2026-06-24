<div align="center">

# InterviewPod

**基于大语言模型的智能面试练习平台**

简历分析 · 文字面试 · 语音面试 · RAG 知识库 · 面试日程管理

[![Java](https://img.shields.io/badge/Java-21-orange?logo=openjdk)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1-green?logo=springboot)](https://spring.io/projects/spring-boot)
[![Spring AI](https://img.shields.io/badge/Spring%20AI-2.0-green?logo=spring)](https://spring.io/projects/spring-ai)
[![React](https://img.shields.io/badge/React-18.3-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-pgvector-336791?logo=postgresql)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-AGPL--3.0-red)](LICENSE)

</div>

---

## 项目介绍

InterviewPod 是一个面向求职者的 AI 面试练习平台。上传简历后，AI 自动分析并给出改进建议；选择面试方向，即可与 AI 进行多轮问答或实时语音对话模拟面试；面试结束后自动生成评估报告，并可导出为 PDF。此外，平台还提供知识库管理（RAG 问答）和面试日程安排功能。

系统采用 Spring Boot 4.1 + Java 21 虚拟线程 + Spring AI 构建后端，React 18 + TypeScript 构建前端，PostgreSQL + pgvector 作为向量数据库，Redis Stream 驱动异步任务，WebSocket 实现语音面试实时通信。

## 功能模块

### 简历管理

- 支持 PDF、DOCX、DOC、TXT 等多种格式上传
- 基于 Redis Stream 的异步分析流水线，实时展示处理进度
- AI 自动评分、能力点分析、改进建议
- 分析结果一键导出为 PDF 报告
- 分析失败自动重试（最多 3 次）+ 内容哈希去重

### 模拟面试（文字）

- **10 个内置面试方向**：Java 后端、阿里专项、字节专项、腾讯专项、前端、Python 后端、算法、系统设计、测试开发、AI Agent 开发
- 每个方向由 `SKILL.md` 定义考察范围、难度分布、参考知识库，支持自定义 JD 解析生成方向
- 历史题目自动去重，支持基于简历内容定制化出题
- AI 智能追问（默认每题 1 条追问），模拟真实多轮面试
- 面试结束后自动触发评估（分批评估 + 结构化输出 + 整体汇总），生成详细评估报告
- 报告支持异步生成并导出 PDF

### 语音面试

实时 WebSocket 语音对话，接入千问3 语音模型（ASR/TTS/LLM 三合一）：

- 流式 TTS 句子级并发合成，首包延迟约 200ms
- 服务端 VAD 自动断句，实时字幕（含中间识别结果）
- 回声防护 + 手动提交，避免 AI 语音被误录
- 多轮上下文记忆，支持暂停/恢复，超时自动暂停
- 文字与语音面试共用同一套评估引擎，评估结果可横向对比

> **已知限制**：端到端延迟偏高（音频走服务端中转）、无耳机时存在回声泄漏、TTS 音色较单一。

### 知识库（RAG 问答）

- 支持 PDF、DOCX、Markdown 文档上传，自动分块与异步向量化（pgvector）
- 查询改写 + 相似度阈值 + TopK 策略，提升检索准确率
- SSE 流式响应，打字机效果
- 支持会话管理、置顶、多知识库关联、Markdown 渲染、虚拟列表
- 知识库运维：分类管理、下载、重新向量化、搜索、统计

### 面试日程

- 粘贴面试邀请文本，规则 + AI 双引擎自动提取公司、岗位、时间、会议链接
- 日历视图（日/周/月）+ 列表视图，支持拖拽调整
- 定时任务自动过期，手动标记状态（待面试/已完成/已取消）

### 多模型配置

- 支持 DashScope（千问）、DeepSeek、Kimi、GLM、LM Studio 等 OpenAI 兼容 Provider
- 设置页可视化管理，一键切换默认聊天模型和向量模型
- ASR/TTS 配置管理，支持连通性测试
- API Key AES-256-GCM 加密落盘（`~/.interviewpod/`）

---

## 技术栈

### 后端

| 技术 | 版本 | 说明 |
|------|------|------|
| Java | 21 | 虚拟线程（Project Loom） |
| Spring Boot | 4.1.0 | 应用框架 |
| Spring AI | 2.0.0 | LLM / Embedding 集成 |
| Spring AI Agent Utils | 0.10.0 | Skill 资源加载、Advisor |
| PostgreSQL + pgvector | 14+ | 关系数据库 + 向量存储 |
| Redis + Redisson | 6+ / 4.0.0 | 缓存 + Stream 异步队列 |
| Apache Tika | 2.9.2 | 文档解析 |
| iText 8 | 8.0.5 | PDF 导出 |
| MapStruct | 1.6.3 | 对象映射 |
| DashScope SDK | 2.22.7 | ASR / TTS（千问3 语音） |
| AWS S3 SDK | 2.29.51 | S3 兼容对象存储 |
| SpringDoc OpenAPI | 3.0.2 | Swagger UI |
| Gradle | 8.14 | 构建工具 |

### 前端

| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.3 | UI 框架 |
| TypeScript | 5.6 | 开发语言 |
| Vite | 5.4 | 构建工具 |
| Tailwind CSS | 4.1 | 样式框架 |
| React Router | 7.11 | 路由 |
| Framer Motion | 12.23 | 动画 |
| Recharts | 3.6 | 图表 |
| React Big Calendar | 1.19 | 日历组件 |
| React Virtuoso | 4.18 | 虚拟列表 |
| pnpm | 10.26 | 包管理器 |

---

## 快速开始

### 环境要求

| 依赖 | 版本 | 必需 |
|------|------|------|
| JDK | 21+ | ✅ |
| Node.js | 18+ | ✅ |
| pnpm | 10+ | 推荐 |
| Docker | 任意 | 推荐（用于一键起依赖服务） |

> 不用 Docker 也可手动安装 PostgreSQL 14+（含 pgvector 扩展）、Redis 6+、MinIO 或其他 S3 兼容存储。

### 1. 克隆项目

```bash
git clone https://github.com/Snailclimb/InterviewPod.git
cd InterviewPod
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

打开 `.env`，至少填写以下两项：

```bash
# 阿里云百炼 API Key（用于 LLM + ASR + TTS）
# 申请地址：https://bailian.console.aliyun.com/
AI_BAILIAN_API_KEY=your_dashscope_api_key

# Provider API Key 加密主密钥（随机字符串即可，部署后不得修改）
# 生成方式：openssl rand -base64 32
APP_AI_CONFIG_ENCRYPTION_KEY=your_random_secret_here
```

> **`APP_AI_CONFIG_ENCRYPTION_KEY` 说明**：用于对设置页中存储的各 Provider API Key 进行 AES-256-GCM 加密。一旦设定后不能修改，否则已存储的 API Key 无法解密。使用 `openssl rand -base64 32` 生成一个随机密钥填入即可。

其余配置（数据库、Redis、MinIO 地址等）均有默认值，与 `docker-compose.yml` 保持一致，本地开发无需修改。

### 3. 启动依赖服务

```bash
docker compose -f docker-compose.dev.yml up -d
```

启动后的服务地址：

| 服务 | 地址 | 账号 | 密码 |
|------|------|------|------|
| PostgreSQL | `localhost:5432` | `postgres` | `123456` |
| Redis | `localhost:6379` | — | — |
| RustFS（S3） | `localhost:9001` | `rustfsadmin` | `rustfsadmin` |

### 4. 启动后端

```bash
./gradlew :app:bootRun
```

后端启动于 `http://localhost:8080`，API 文档：`http://localhost:8080/swagger-ui.html`

### 5. 启动前端

```bash
cd frontend
corepack enable   # 激活 pnpm（需要 Node.js 18+）
pnpm install
pnpm dev
```

前端启动于 `http://localhost:5173`

---

## Docker 一键部署

适合生产或演示环境，编排了 6 个服务：PostgreSQL（含 pgvector）、Redis、MinIO、Bucket 初始化、Spring Boot 后端、React 前端（Nginx）。

```bash
# 1. 复制并编辑环境变量
cp .env.example .env
# 必填：AI_BAILIAN_API_KEY、APP_AI_CONFIG_ENCRYPTION_KEY

# 2. 构建并启动所有服务
docker compose up -d --build
```

服务启动后访问地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost | 用户入口 |
| 后端 API | http://localhost:8080 | RESTful API |
| Swagger UI | http://localhost:8080/swagger-ui.html | 接口文档 |
| MinIO 控制台 | http://localhost:9001 | 对象存储管理（`minioadmin` / `minioadmin`） |

常用运维命令：

```bash
# 查看后端日志
docker compose logs -f app

# 拉取新代码后重新构建
docker compose up -d --build

# 停止服务（数据保留）
docker compose down

# 停止服务并清除全部数据（慎用）
docker compose down -v
```

---

## 项目结构

```
InterviewPod/
├── app/                              # Spring Boot 后端
│   └── src/main/
│       ├── java/interview/guide/
│       │   ├── common/               # 通用能力：限流、AI 调用、异步模板、统一响应
│       │   ├── infrastructure/       # 基础设施：PDF 导出、文件解析、S3、MapStruct
│       │   └── modules/              # 业务模块
│       │       ├── interview/        # 文字模拟面试
│       │       ├── interviewschedule/# 面试日程
│       │       ├── knowledgebase/    # 知识库 RAG
│       │       ├── llmprovider/      # 多模型 Provider 管理
│       │       ├── resume/           # 简历管理
│       │       └── voiceinterview/   # 语音面试
│       └── resources/
│           ├── application.yml       # 应用配置
│           ├── prompts/              # AI Prompt 模板（StringTemplate）
│           ├── scripts/              # Redis Lua 脚本
│           └── skills/               # 面试 Skill 定义（10 个方向）
│
├── frontend/                         # React 前端
│   └── src/
│       ├── api/                      # API 调用层
│       ├── components/               # 公共组件
│       ├── pages/                    # 页面
│       ├── hooks/                    # 业务 Hooks
│       └── types/                    # 类型定义
│
├── docker-compose.yml                # 完整部署（前后端 + 全部依赖）
├── docker-compose.dev.yml            # 本地开发依赖（PostgreSQL + Redis + RustFS）
├── .env.example                      # 环境变量模板
└── docs/                             # 架构设计文档
```

---

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

[AGPL-3.0](LICENSE)（通过网络提供服务时，须向用户公开修改后的源码）
