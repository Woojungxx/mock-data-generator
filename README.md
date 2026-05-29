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

## 让别人也能用（不用各自 `npm run dev`）

`npm run dev` 只适合本机开发。要给别人一个 **固定网址**，需要把项目 **部署到服务器或云平台**，对方只需用浏览器打开链接即可。

### 方案一：Vercel（推荐，最简单）

仓库已在 GitHub 时，约 5 分钟可上线：

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 登录  
2. **Add New Project** → 选择 `Woojungxx/mock-data-generator`  
3. 框架会自动识别为 Next.js，直接 **Deploy**  
4. 完成后会得到类似 `https://mock-data-generator-xxx.vercel.app` 的地址，发给同事即可  

之后每次 `git push` 到 `main`，Vercel 会自动重新部署。

> **注意（模板保存）：** 当前模板写在服务器本地的 `data/templates.json`。Vercel 属于无状态/临时磁盘，**保存的模板在重新部署后可能丢失**，且不适合多实例长期持久化。若团队必须长期共用「已保存模板」，请用下面的方案二，或后续接入数据库 / 对象存储。

### 方案二：公司内网或云主机（模板可长期保存）

在一台大家都能访问的机器上（Windows 服务器、Linux VPS、内网虚拟机均可）：

```bash
git clone https://github.com/Woojungxx/mock-data-generator.git
cd mock-data-generator
npm install
npm run build
npm start
```

默认监听 **3000** 端口。把防火墙/安全组放行该端口，或前面加 Nginx 反代到 80/443，别人访问 `http://服务器IP:3000` 或你的域名即可。

生产环境建议用 [PM2](https://pm2.keymetrics.io/) 保持进程常驻，例如：

```bash
npm install -g pm2
pm2 start npm --name mock-data -- start
pm2 save
```

此方式磁盘上的 `data/templates.json` **可以持久保存**（注意定期备份该文件）。

### 方案三：仅内网、不对外网

与方案二相同，但只绑定内网 IP，不暴露公网；适合 QA 团队在内网使用。

### 对比（怎么选）

| 方式 | 别人怎么用 | 模板能否长期保存 | 难度 |
|------|------------|------------------|------|
| 本机 `npm run dev` | 只能你自己 | 可以（本机文件） | 最低 |
| Vercel | 发一个 https 链接 | 不稳定，易丢 | 低 |
| 自建服务器 `npm start` | 发 IP/域名链接 | 可以 | 中 |

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
