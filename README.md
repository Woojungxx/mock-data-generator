# Mock Data Generator

面向 QA / 测试团队的 **Web 批量测试数据生成工具**：上传 Excel/CSV 模板、配置每列生成规则、在服务端批量生成 **1～100000** 行并导出 **CSV / XLSX**，模板可保存到本地 JSON 文件。

**在线仓库：** [github.com/Woojungxx/mock-data-generator](https://github.com/Woojungxx/mock-data-generator)

---

## 功能概览

| 能力 | 说明 |
|------|------|
| 模板上传 | 支持 **CSV**、**XLSX**，拖拽或点击上传 |
| 字段规则 | 固定值、数字/字符串递增、随机数/随机串、UUID、枚举随机、时间区间等 |
| 智能推断 | 根据首行示例自动推测字段类型（可在界面中修改） |
| 批量生成 | **1～100000** 行，逻辑在 **Next.js API** 中执行，避免浏览器卡死 |
| 导出 | **CSV**（UTF-8 + BOM，Excel 打开不乱码）、**XLSX** |
| 模板 | 保存 / 修改 / 删除，数据写入 `data/templates.json`（初期无数据库） |

---

## 技术栈

- **框架：** [Next.js 15](https://nextjs.org/)（App Router）
- **语言：** TypeScript、React 19
- **样式：** Tailwind CSS、[shadcn/ui](https://ui.shadcn.com/) 风格组件
- **解析：** [papaparse](https://www.papaparse.com/)（CSV）、[SheetJS / xlsx](https://sheetjs.com/)（XLSX）

---

## 环境要求

- **Node.js** 18.x 或更高（推荐 20 LTS）
- **npm**（或 pnpm / yarn，下面以 npm 为例）

---

## 快速开始

```bash
# 安装依赖
npm install

# 本地开发（默认 http://localhost:3000）
npm run dev
```

```bash
# 生产构建
npm run build

# 启动生产服务
npm start
```

首次运行前无需额外配置数据库；模板会读写项目下的 `data/templates.json`，请确保进程对该目录有写权限。

---

## 页面与路由

| 路径 | 用途 |
|------|------|
| `/` | 上传模板、新建空模板、查看最近保存的模板 |
| `/template/new` | 上传成功后进入的「新建」字段配置（草稿在浏览器 `sessionStorage`） |
| `/template/[id]` | 已保存模板的字段配置、保存、生成与下载 |

---

## API 一览

| 方法 | 路径 | 说明 |
|------|------|------|
| `POST` | `/api/upload` | 上传文件，解析表头与示例，返回 `fields` |
| `POST` | `/api/generate` | 请求体：`fields`、`rowCount`、`format`（`csv` \| `xlsx`），返回文件流下载 |
| `GET` | `/api/templates` | 模板列表 |
| `POST` | `/api/templates` | 新建或更新模板 |
| `GET` | `/api/templates/[id]` | 获取单个模板 |
| `DELETE` | `/api/templates/[id]` | 删除模板 |

---

## 目录结构（简要）

```
app/                 # 页面与 API Route
components/          # UploadZone、FieldRuleTable、GeneratePanel 等
components/ui/     # 按钮、卡片、表格等基础 UI
lib/                 # 解析、推断、生成、模板读写等逻辑
types/               # TypeScript 类型定义
data/templates.json  # 模板持久化（可纳入版本控制或自行 .gitignore）
```

扩展说明见 `lib/extensions/README.ts`（预留 AI 规则、faker、鉴权等方向）。

---

## 常见问题

**终端里 `next dev` 停在 “Ready in xs” 是否正常？**  
正常。表示开发服务已启动，请在浏览器访问终端里给出的 **Local** 地址（一般为 `http://localhost:3000`）。

**单列 CSV 上传报错？**  
已针对 PapaParse 分隔符检测与 BOM 做了处理；若仍有问题，可检查文件是否为 UTF-8、表头是否在第一行。

---

## 参与贡献

欢迎通过 Issue / Pull Request 提出建议或改进。

---

## 许可证

未指定默认许可证时，仓库内代码默认保留所有权利；若你希望开源，可自行补充 `LICENSE` 文件（如 MIT）。
