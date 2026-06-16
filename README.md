# /learn-project — 项目拆解学习系统

Claude Code 自定义技能：通过拆解一个项目，系统性学习相关技术栈，达到能独立复现的水平。

## 安装

将文件复制到你的 Claude Code 配置目录：

```bash
# Skill 入口
cp learn-project.md ~/.claude/commands/

# Workflow 脚本
cp learn-project.js ~/.claude/workflows/
```

## 使用

```
/learn-project <项目路径或GitHub URL>
```

例如：
```
/learn-project https://github.com/fastapi/fastapi
/learn-project C:\Projects\my-app
/learn-project react
```

## 工作流程

```
输入项目 → 确认学习深度 → 4 Agent 并行侦察 → 知识图谱 → 3 Agent 并行生成内容 → 保存文档
```

### Phase 1: 侦察（4 Agent 并行）
- 技术栈识别
- 项目结构分析
- 核心模块识别
- 依赖与外部服务分析

### Phase 2: 知识图谱
- 汇总侦察结果
- 按依赖关系排序知识点
- 划分学习阶段

### Phase 3: 生成（3 Agent 并行）
- 学习内容（核心概念、代码示例、推荐资源）
- 代码解读（架构总览、模块详解、设计决策）
- 动手练习（渐进式、可验证、实战导向）

### Phase 4: 汇总
- 编译为完整学习文档
- 保存到 `~/learn-projects/<项目名>/`

## 学习深度

| 深度 | 时长 | 适合 |
|------|------|------|
| 快速上手 | 1-2周 | 能跑起来、改得动 |
| 深入理解 | 2-4周 | 理解架构、能做扩展 |
| 完全复现 | 1-2月 | 从零搭建同等项目 |

## 输出文件

```
~/learn-projects/<项目名>/
├── README.md           # 总览导航 + 进度追踪
├── 01-学习路线图.md     # 分阶段知识清单
├── 02-代码解读.md       # 核心模块逐函数解读
└── 03-动手练习.md       # 每阶段渐进式练习
```

## 文件说明

| 文件 | 位置 | 用途 |
|------|------|------|
| `learn-project.md` | `~/.claude/commands/` | Skill 入口定义 |
| `learn-project.js` | `~/.claude/workflows/` | Workflow 多 Agent 编排脚本 |
