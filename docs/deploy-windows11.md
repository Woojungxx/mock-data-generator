# Windows 11 本机当服务器 — 内网部署指南

让同事通过 `http://你的内网IP:3000` 使用 Mock Data Generator，**无需**各自执行 `npm run dev`。

> 适合：不想买云服务器、公司自动连 VPN、Vercel 同事打不开的情况。

---

## 一、开始前准备

### 1. 需要已安装的软件

| 软件 | 用途 | 下载 |
|------|------|------|
| **Node.js 18+**（建议 20 LTS） | 运行项目 | https://nodejs.org/ |
| **Git** | 拉取代码 | https://git-scm.com/download/win |

安装 Node 后，打开 **PowerShell**，确认：

```powershell
node -v
npm -v
git -v
```

都能显示版本号即可。

### 2. 建议先问 IT 一句（可选但推荐）

> 我需要在办公电脑上用 Node 开一个内网小工具（端口 3000），给同部门同事访问，是否可以？

若 IT 禁止个人电脑对外提供服务，需改用公司测试机。

---

## 二、下载并启动项目

### 1. 打开 PowerShell

按 `Win + X` → 选择 **终端** 或 **Windows PowerShell**。

### 2. 选一个目录存放项目（示例：D 盘）

```powershell
cd D:\
git clone https://github.com/Woojungxx/mock-data-generator.git
cd mock-data-generator
```

### 3. 安装依赖并构建

```powershell
npm install
npm run build
```

首次 `npm install` 可能需要几分钟。

### 4. 启动服务（测试用）

```powershell
npm start
```

看到类似：

```text
▲ Next.js ...
- Local:    http://localhost:3000
```

**不要关这个窗口**（关掉服务就停）。

### 5. 本机浏览器自测

打开：**http://localhost:3000**

能出现「Mock Data Generator」首页即成功。

---

## 三、查本机内网 IP（发给同事用）

1. **新开一个** PowerShell 窗口（保留运行 `npm start` 的那个别关）
2. 输入：

```powershell
ipconfig
```

3. 找到当前上网用的网卡（常见名：`以太网`、`WLAN`、`Wi-Fi`），看 **IPv4 地址**，例如：

```text
IPv4 地址 . . . . . . . . . . . . : 10.34.7.69
```

4. 发给同事的地址为：

```text
http://10.34.7.69:3000
```

（把 `10.34.7.69` 换成你屏幕上看到的数字。）

> 公司自动 VPN 时，同事一般也连着 VPN，用 **10.x / 172.x / 192.168.x** 这类内网 IP 即可，不要用 `127.0.0.1`。

---

## 四、Windows 11 防火墙放行 3000 端口

否则同事可能连不上，你自己 `localhost` 却能开。

### 方法一：图形界面（推荐）

1. `Win + S` 搜索 **「Windows 安全中心」** → 打开  
2. **防火墙和网络保护** → **高级设置**  
3. 左侧 **入站规则** → 右侧 **新建规则…**  
4. 选择 **端口** → 下一步  
5. **TCP**，特定本地端口填：`3000` → 下一步  
6. **允许连接** → 下一步  
7. 域 / 专用 / 公用 可全勾（若 IT 有要求只勾「域」和「专用」）→ 下一步  
8. 名称填：`Mock Data Generator 3000` → 完成  

### 方法二：管理员 PowerShell 一条命令

以 **管理员** 身份打开终端：

```powershell
New-NetFirewallRule -DisplayName "Mock Data Generator 3000" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

---

## 五、让同事访问

1. 你的电脑 **保持开机**，且 **`npm start` 窗口不要关**（或使用下文 PM2）  
2. 把链接发给同事，例如：`http://10.34.7.69:3000`  
3. 同事用 Chrome / Edge 打开；**无需**安装 Node  

### 若同事打不开，逐项检查

| 检查项 | 做法 |
|--------|------|
| 你服务是否在跑 | 你自己再开 `http://localhost:3000` |
| IP 是否写对 | 重新 `ipconfig`，VPN 重连后 IP 可能变 |
| 防火墙 | 按第四节再确认入站规则 |
| 公司策略 | 让 IT 查是否禁止访问同事电脑的 3000 端口 |
| 你是否休眠 | 合盖睡眠会断服务，电源里可设「合盖不睡眠」 |

---

## 六、长期挂着（推荐 PM2，关掉终端也不停）

### 1. 安装 PM2

```powershell
npm install -g pm2
```

### 2. 在项目目录启动

```powershell
cd D:\mock-data-generator
pm2 start npm --name mock-data -- start
pm2 save
```

### 3. 常用命令

```powershell
pm2 list              # 查看状态
pm2 logs mock-data    # 看日志
pm2 restart mock-data # 重启
pm2 stop mock-data    # 停止
```

### 4. 开机自动启动（可选）

```powershell
pm2 startup
```

按终端提示 **复制并执行** 它给出的那条命令（通常需要管理员 PowerShell），然后再：

```powershell
pm2 save
```

重启电脑后执行：

```powershell
pm2 resurrect
```

若开机未自动拉起，可把 `pm2 resurrect` 放进「任务计划程序」登录时运行。

---

## 七、更新版本（你改了 GitHub 代码之后）

```powershell
cd D:\mock-data-generator
git pull
npm install
npm run build
pm2 restart mock-data
```

（若没用 PM2，则先 `Ctrl+C` 停掉 `npm start`，再重新 `npm start`。）

---

## 八、备份模板数据

保存的模板在：

```text
D:\mock-data-generator\data\templates.json
```

定期复制到 U 盘或公司网盘即可。

---

## 九、费用说明

| 项目 | 是否要钱 |
|------|----------|
| Node、Git、本项目 | 免费 |
| 用你自己电脑 | 不另购服务器（仅电费） |
| 内网 IP 访问 | 一般不需要域名 |
| PM2 | 免费 |

---

## 十、和 Vercel 怎么选

| | 你的 Win11 电脑 | Vercel |
|--|-----------------|--------|
| 费用 | 0 元 | 免费档 |
| 同事在公司 VPN 下 | 通常更稳（内网 IP） | 常被拦 |
| 你关机后 | 不可用 | 仍可用 |
| 模板持久化 | 稳定（本地文件） | 可能丢失 |

**建议：** 同事日常用 **内网链接**；Vercel 仅作你自己外网测试。

---

## 快速命令汇总（复制用）

```powershell
# 首次部署
cd D:\
git clone https://github.com/Woojungxx/mock-data-generator.git
cd mock-data-generator
npm install
npm run build
npm start

# 查 IP
ipconfig

# PM2 常驻（可选）
npm install -g pm2
pm2 start npm --name mock-data -- start
pm2 save
```

同事访问：**`http://<你的IPv4>:3000`**
