// learn-project.js — 项目拆解学习系统 Workflow
// 通过多 Agent 并行分析项目，生成完整学习计划

export const meta = {
  name: 'learn-project',
  description: '拆解项目并生成系统性学习计划，包含路线图、代码解读和动手练习',
  phases: [
    { title: '侦察', detail: '并行分析项目的技术栈、结构、核心模块和依赖' },
    { title: '图谱', detail: '汇总侦察结果，构建知识图谱，划分学习阶段' },
    { title: '生成', detail: '并行生成学习内容、代码解读和动手练习' },
    { title: '汇总', detail: '编译为完整学习文档' },
  ],
}

// 侦察结果 schema — 所有侦察 Agent 共用
const RECON_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: '一段话总结分析结果' },
    details: { type: 'object', description: '结构化的详细分析数据' },
  },
  required: ['summary'],
}

// 知识图谱 schema
const KNOWLEDGE_SCHEMA = {
  type: 'object',
  properties: {
    knowledgeAreas: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          level: { type: 'string', enum: ['基础', '进阶', '高级'] },
          phase: { type: 'number' },
          prerequisites: { type: 'array', items: { type: 'string' } },
          relatedModules: { type: 'array', items: { type: 'string' } },
          why: { type: 'string', description: '为什么需要学这个' },
        },
        required: ['name', 'level', 'phase', 'why'],
      },
    },
    phases: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          title: { type: 'string' },
          duration: { type: 'string' },
          topics: { type: 'array', items: { type: 'string' } },
          goal: { type: 'string', description: '这个阶段结束时能做到什么' },
        },
        required: ['id', 'title', 'duration', 'topics', 'goal'],
      },
    },
  },
  required: ['knowledgeAreas', 'phases'],
}

// 内容输出 schema — 学习内容、代码解读、练习共用
const DOC_SCHEMA = {
  type: 'object',
  properties: {
    content: { type: 'string', description: 'Markdown 格式的完整文档内容' },
  },
  required: ['content'],
}

// ============================================================
// 工具函数
// ============================================================

/** 安全提取 Agent 结果，Agent 失败时返回降级内容 */
function safeResult(result, fallback = null) {
  if (!result) return fallback
  return result
}

/** 从侦察结果中安全提取摘要 */
function extractSummary(result) {
  const r = safeResult(result)
  return r?.summary || '（分析未完成）'
}

// ============================================================
// Phase 1: 项目侦察 — 4 个 Agent 并行
// ============================================================
async function phaseRecon(projectPath, projectName) {
  const results = await parallel([
    // Agent A: 技术栈识别
    () => agent(
      `分析项目 "${projectPath}" 的技术栈。

任务：
1. 识别主要编程语言
2. 识别使用的框架和核心库
3. 识别开发工具链（构建工具、包管理器、测试框架）
4. 评估技术成熟度和社区活跃度

请读取项目的配置文件（package.json、requirements.txt、go.mod、Cargo.toml、pom.xml 等）来确认。
如果项目路径不存在或无法访问，返回错误信息。

以 JSON 格式返回分析结果。`,
      { label: '侦察:技术栈', phase: '侦察', schema: RECON_SCHEMA }
    ),

    // Agent B: 项目结构分析
    () => agent(
      `分析项目 "${projectPath}" 的目录结构和组织方式。

任务：
1. 列出顶层目录结构（用 tree 命令或手动扫描）
2. 识别项目入口文件
3. 识别配置文件
4. 分析模块划分方式（按功能？按层？按特性？）
5. 识别是否有 monorepo 结构

以 JSON 格式返回分析结果。`,
      { label: '侦察:结构', phase: '侦察', schema: RECON_SCHEMA }
    ),

    // Agent C: 核心模块识别
    () => agent(
      `识别项目 "${projectPath}" 的核心业务模块。

任务：
1. 找到核心业务逻辑代码（不是配置、不是工具函数）
2. 分析数据流向（输入 → 处理 → 输出）
3. 识别关键设计模式（MVC、事件驱动、插件化等）
4. 识别核心算法或业务规则
5. 找到项目最复杂/最有学习价值的代码

重点关注 src/、lib/、app/ 等源码目录。

以 JSON 格式返回分析结果。`,
      { label: '侦察:核心模块', phase: '侦察', schema: RECON_SCHEMA }
    ),

    // Agent D: 依赖与外部服务
    () => agent(
      `分析项目 "${projectPath}" 的依赖关系和外部服务。

任务：
1. 列出主要第三方依赖（按重要性排序）
2. 识别外部 API 或服务依赖（数据库、消息队列、云服务等）
3. 分析构建和部署流程（Docker、CI/CD 配置）
4. 识别环境变量和配置需求
5. 评估项目运行所需的基础设施

以 JSON 格式返回分析结果。`,
      { label: '侦察:依赖', phase: '侦察', schema: RECON_SCHEMA }
    ),
  ])

  return results
}

// ============================================================
// Phase 2: 知识图谱构建
// ============================================================
async function buildKnowledgeGraph(reconResults, learningDepth, projectName, projectSummary) {
  const depthMap = {
    '快速上手': '聚焦核心概念和基本使用，跳过底层实现细节，3 个阶段以内',
    '深入理解': '理解架构设计和关键决策，掌握扩展能力，4-5 个阶段',
    '完全复现': '掌握全部技术细节，能从零搭建同等项目，5-6 个阶段，含底层原理',
  }
  const depthNote = depthMap[learningDepth] || depthMap['深入理解']

  const result = await agent(
    `基于以下项目侦察结果，构建完整的学习知识图谱。

## 项目名称
${projectName}

## 项目简介
${projectSummary || '无'}

## 学习深度
${learningDepth} — ${depthNote}

## 侦察结果

### 技术栈
${extractSummary(reconResults[0])}

### 项目结构
${extractSummary(reconResults[1])}

### 核心模块
${extractSummary(reconResults[2])}

### 依赖与外部服务
${extractSummary(reconResults[3])}

## 任务

1. 列出学习这个项目需要掌握的所有知识领域（knowledgeAreas）
2. 按依赖关系排序，划分为多个学习阶段（phases）
3. 每个阶段要有明确的目标（学完能做什么）
4. 标注每个知识领域的：
   - 难度等级（基础/进阶/高级）
   - 前置知识
   - 相关的项目模块
   - 为什么需要学这个
5. 给出每个阶段的预估学习时长

注意：
- 学习深度为「${learningDepth}」，${depthNote}
- 知识领域要具体（如「React Hooks」而不是「前端开发」）
- 阶段之间要有清晰的依赖关系
- 每个阶段的 goal 要可衡量（如「能独立实现一个 XX 功能」）`,
    { label: '图谱:知识图谱', phase: '图谱', schema: KNOWLEDGE_SCHEMA }
  )

  return result
}

// ============================================================
// Phase 3: 学习内容生成 — 3 个 Agent 并行
// ============================================================
async function generateLearningContent(knowledgeGraph, reconResults, projectPath, projectName, learningDepth) {
  // 构建侦察摘要，不传完整对象
  const reconSummary = [
    '### 技术栈', extractSummary(reconResults[0]), '',
    '### 项目结构', extractSummary(reconResults[1]), '',
    '### 核心模块', extractSummary(reconResults[2]), '',
    '### 依赖与外部服务', extractSummary(reconResults[3]),
  ].join('\n')

  // 知识图谱摘要（控制长度，避免撑爆上下文）
  const graphSummary = knowledgeGraph ? [
    `学习阶段: ${knowledgeGraph.phases?.length || 0} 个`,
    `知识领域: ${knowledgeGraph.knowledgeAreas?.length || 0} 个`,
    '',
    '阶段列表:',
    ...(knowledgeGraph.phases || []).map(p => `- 阶段 ${p.id}: ${p.title} (${p.duration}) — ${p.goal}`),
    '',
    '知识领域:',
    ...(knowledgeGraph.knowledgeAreas || []).map(k => `- [${k.level}] ${k.name} (阶段${k.phase}) — ${k.why}`),
  ].join('\n') : '无'

  const results = await parallel([
    // Agent 1: 学习内容
    () => agent(
      `你是一位技术教育专家。基于以下知识图谱，为每个学习阶段生成详细的学习内容。

## 项目: ${projectName}
## 学习深度: ${learningDepth}

## 知识图谱
${graphSummary}

## 要求

为每个阶段生成 Markdown 格式的学习内容，包含：

### 每个阶段的内容结构：
1. **阶段概述** — 这个阶段要学什么，为什么重要
2. **核心概念** — 每个知识点的解释，包含：
   - 是什么（简洁定义）
   - 为什么需要（在这个项目中的作用）
   - 怎么用（核心用法，含代码示例）
   - 常见陷阱（新手容易踩的坑）
3. **学习路径** — 建议的学习顺序
4. **推荐资源** — 官方文档、教程链接
5. **自检清单** — 学完后能回答的问题

### 格式要求：
- 使用中文
- 代码示例要完整可运行
- 概念解释要结合这个项目的实际场景
- 不要写空洞的概述，要有具体可操作的内容

输出完整的 Markdown 文档，用 # 分隔各阶段。`,
      { label: '生成:学习内容', phase: '生成', schema: DOC_SCHEMA }
    ),

    // Agent 2: 代码解读
    () => agent(
      `你是一位资深架构师。对项目 "${projectPath}" 的核心代码进行逐模块解读。

## 项目: ${projectName}
## 学习深度: ${learningDepth}

## 项目侦察摘要
${reconSummary}

## 知识图谱
${graphSummary}

## 要求

请读取项目的核心源码文件，进行深度解读：

### 解读内容：
1. **架构总览** — 项目整体架构图（用 ASCII 或文字描述）
2. **模块详解** — 对每个核心模块：
   - 文件位置和职责
   - 核心类/函数的解读
   - 设计模式的使用及原因
   - 与其他模块的交互关系
3. **数据流** — 一个请求/操作从头到尾的完整数据流
4. **设计决策** — 作者为什么这样设计，有什么权衡
5. **精华代码片段** — 最值得学习的代码，附详细注释

### 格式要求：
- 使用中文
- 代码引用要标注文件路径和行号
- 不要贴大段代码，挑关键部分解读（每个模块 30-50 行关键代码）
- 重点解释「为什么」而不是「是什么」

输出完整的 Markdown 文档。`,
      { label: '生成:代码解读', phase: '生成', schema: DOC_SCHEMA }
    ),

    // Agent 3: 动手练习
    () => agent(
      `你是一位编程导师。基于以下知识图谱，为每个学习阶段设计动手练习。

## 项目: ${projectName}
## 学习深度: ${learningDepth}

## 知识图谱
${graphSummary}

## 要求

为每个阶段设计 3-5 个动手练习，遵循以下原则：

### 练习设计原则：
1. **渐进式** — 从模仿到修改到独立实现
2. **可验证** — 每个练习都有明确的完成标准
3. **实战导向** — 练习内容与项目相关，不是孤立的 demo
4. **时间可控** — 每个练习标注预估时间

### 每个练习的结构：
- **标题** — 简洁描述要做什么
- **目标** — 这个练习锻炼什么能力
- **要求** — 具体的功能/技术要求
- **提示** — 关键思路提示（不要直接给答案）
- **验收标准** — 怎么算完成
- **预估时间** — 多久能做完

### 练习类型分布：
- 早期阶段：模仿型（照着示例写、修改现有代码）
- 中期阶段：改造型（给现有功能添加新特性）
- 后期阶段：创造型（独立实现一个完整功能）

### 格式要求：
- 使用中文
- 练习描述要具体，不要「实现一个 XX」这种模糊描述
- 每个练习要可独立完成，不依赖后续练习

输出完整的 Markdown 文档。`,
      { label: '生成:动手练习', phase: '生成', schema: DOC_SCHEMA }
    ),
  ])

  return results
}

// ============================================================
// Phase 4: 汇总输出
// ============================================================
async function compileOutput(knowledgeGraph, learningContent, projectName, projectSummary) {
  const [learnDoc, codeDoc, exerciseDoc] = learningContent

  // 提取各文档的前 2000 字符作为摘要（足够生成 README，不撑爆上下文）
  const truncate = (s, n = 2000) => (s || '').substring(0, n)

  const result = await agent(
    `将以下学习材料编译为一份 README 导航文档。

## 项目: ${projectName}
## 简介: ${projectSummary || '无'}

## 知识图谱
阶段数: ${knowledgeGraph?.phases?.length || 0}
知识领域数: ${knowledgeGraph?.knowledgeAreas?.length || 0}

阶段列表:
${(knowledgeGraph?.phases || []).map(p => `- **阶段 ${p.id}: ${p.title}** (${p.duration}) — ${p.goal}`).join('\n')}

## 学习内容（前 2000 字）
${truncate(learnDoc)}

## 代码解读（前 2000 字）
${truncate(codeDoc)}

## 动手练习（前 2000 字）
${truncate(exerciseDoc)}

## 要求

生成一个 README.md，包含：

1. **项目概述** — 一句话说明这个项目是什么，为什么值得学
2. **学习路线总览** — 用表格展示所有阶段（阶段名 | 时长 | 目标 | 核心知识点）
3. **文件导航** — 说明每个文件的内容和用途
4. **快速开始** — 建议的学习顺序和方法
5. **进度追踪** — 一个 checkbox 列表，用户可以勾选完成的阶段

使用中文，格式清晰，适合在 GitHub 上展示。`,
    { label: '汇总:README', phase: '汇总', schema: DOC_SCHEMA }
  )

  return {
    readme: result?.content || '',
    learnDoc: learnDoc?.content || '',
    codeDoc: codeDoc?.content || '',
    exerciseDoc: exerciseDoc?.content || '',
    knowledgeGraph,
  }
}

// ============================================================
// 主流程
// ============================================================
async function main(args) {
  const { projectPath, projectName, learningDepth, projectSummary } = args

  log(`开始拆解项目: ${projectName}`)
  log(`项目路径: ${projectPath}`)
  log(`学习深度: ${learningDepth}`)

  // Phase 1: 项目侦察
  phase('侦察')
  log('正在并行分析技术栈、项目结构、核心模块和依赖...')
  const reconResults = await phaseRecon(projectPath, projectName)
  const successCount = reconResults.filter(Boolean).length
  log(`侦察完成 ✓ (${successCount}/4 个分析成功)`)

  // Phase 2: 知识图谱
  phase('图谱')
  log('正在构建知识图谱...')
  const knowledgeGraph = await buildKnowledgeGraph(reconResults, learningDepth, projectName, projectSummary)
  const phaseCount = knowledgeGraph?.phases?.length || 0
  const areaCount = knowledgeGraph?.knowledgeAreas?.length || 0
  log(`知识图谱完成 ✓ — ${phaseCount} 个学习阶段，${areaCount} 个知识领域`)

  // Phase 3: 学习内容生成
  phase('生成')
  log('正在并行生成学习内容、代码解读和动手练习...')
  const learningContent = await generateLearningContent(
    knowledgeGraph, reconResults, projectPath, projectName, learningDepth
  )
  log('学习内容生成完成 ✓')

  // Phase 4: 汇总
  phase('汇总')
  log('正在编译最终文档...')
  const output = await compileOutput(knowledgeGraph, learningContent, projectName, projectSummary)
  log('汇总完成 ✓')

  return output
}

// 执行
const result = await main(args)
result
