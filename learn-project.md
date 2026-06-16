# /learn-project — 项目拆解学习系统

通过拆解一个项目，系统性学习相关技术栈，达到能独立复现的水平。

## 使用方式

```
/learn-project <项目路径或GitHub URL>
```

## 执行流程

当用户调用此命令时，按以下步骤执行：

### 1. 解析输入

从 `$ARGUMENTS` 中提取项目路径或 URL。如果为空，用 AskUserQuestion 询问用户：
- 想学习哪个项目？
- 项目路径或 GitHub URL 是什么？

**必须拿到有效的项目路径或 URL 才能继续，不要传空值给 Workflow。**

### 2. 确认学习目标

用 AskUserQuestion 询问学习深度：

- **快速上手**（1-2周）：能跑起来、改得动，了解核心概念
- **深入理解**（2-4周）：理解架构设计、关键决策、能做功能扩展
- **完全复现**（1-2月）：从零搭建同等水平项目，掌握全部技术细节

默认选「深入理解」。

### 3. 预处理输入

根据输入类型做最小化准备（深度分析由 Workflow 负责）：

**如果是本地路径：**
- 验证路径存在
- 读取项目名称（目录名或 package.json 中的 name）

**如果是 GitHub URL：**
- 用 WebFetch 获取 README 摘要
- 提取项目名称
- 用 `git clone --depth 1` 克隆到临时目录（如果需要）

**如果是项目名称（无路径）：**
- 用 WebSearch 找到 GitHub 地址
- 按 URL 流程处理

### 4. 调用 Workflow

收集完信息后，调用 Workflow 执行深度分析。注意使用 `scriptPath` 指向本地脚本：

```javascript
Workflow({
  scriptPath: 'C:/Users/ROG/.claude/workflows/learn-project.js',
  args: {
    projectPath: '<项目路径>',
    projectName: '<项目名称>',
    learningDepth: '<快速上手|深入理解|完全复现>',
    projectSummary: '<从 README 中获得的项目简介>'
  }
})
```

### 5. 保存输出

Workflow 返回后，将结果保存到 `~/learn-projects/<项目名>/` 目录：

```
mkdir -p ~/learn-projects/<项目名>/
```

用 Write 工具依次写入：
- `README.md` ← output.readme
- `01-学习路线图.md` ← output.learnDoc
- `02-代码解读.md` ← output.codeDoc
- `03-动手练习.md` ← output.exerciseDoc

然后向用户展示：
1. 学习路线图的摘要（阶段列表和预估时长）
2. 文件保存位置
3. 建议的学习顺序

## 注意事项

- 对于大型项目（>1000 文件），在 args 中告知 Workflow 优先分析 src/ 或核心目录
- 学习计划应以「能动手写」为导向，每个知识点都要有对应的练习
- 如果项目使用了用户不熟悉的基础技术（如 TypeScript、Rust），在路线图最前面加入基础学习阶段
- 代码解读要标注「为什么这样设计」，不只是「这段代码做了什么」
