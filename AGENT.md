# AGENT.md

## 项目概览
- 项目类型: Vite + React 19 + TailwindCSS 3 单页应用。
- 主要入口: `src/main.jsx`。
- 主要页面逻辑: `src/App.jsx`。
- 样式入口: `src/index.css`。
- 静态图片资源位于项目根目录与 `src/`（如 `1.jpg`、`2.jpg`、`src/temple-bg.jpg`）。

## 运行与构建
- 安装依赖: `npm install`
- 本地开发: `npm run dev`
- 生产构建: `npm run build`
- 构建预览: `npm run preview`

## 修改约定
- 尽量保持现有技术栈与目录结构，不随意新增大型依赖。
- 优先在 `src/App.jsx` 中做功能改动，避免无关重构。
- Tailwind 类名优先，只有必要时再添加内联样式或 `<style>` 内规则。
- 新增 UI 文案统一使用简体中文，文件编码保持 UTF-8。
- 修改图片资源时，优先复用现有命名风格，避免破坏当前 import 路径。

## 代码质量
- 保持 React 函数组件与 Hooks 写法一致。
- 新增状态或副作用时，确保有对应清理逻辑（例如 `setInterval`、`setTimeout`）。
- 避免引入全局副作用；若必须引入，请在注释中说明原因。

## 提交前检查
- 能正常启动开发服务器并渲染页面。
- `npm run build` 可通过。
- 核心交互可用（敲击、自动敲击、静音切换、重置）。
- 未修改无关文件。
