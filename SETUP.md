# 快速开始指南

## 前置要求

- Node.js 18+
- npm 或 yarn

## 安装步骤

### 1. 安装依赖

```bash
npm install
```

这将安装所有必需的依赖包（包括 server 和 client）。

### 2. 配置环境变量

项目已经预配置了开发环境的 `.env` 文件：

```env
ADMIN_PASSWORD_HASH=$2b$10$WECXAo0EMlUQTPYf1KKUmuicW3vZFf36k//e7X0apwmtitUpURCQK
JWT_SECRET=aff66fcf3c7f54b832010360ca46689bd7228a5181cd6f180260625ebed07786
PORT=3000
NODE_ENV=development
```

**默认管理员密码**: `admin123`

如果需要修改密码，运行：

```bash
node scripts/generate-password-hash.js your-new-password
```

然后将生成的哈希值更新到 `.env` 文件中。

### 3. 添加测试数据（可选）

```bash
node scripts/seed-data.js
```

这将添加一些示例事件：
- 一次性事件：重要会议 (2026-03-02 10:00-11:30)
- 周期性事件：周会 (每周一 14:00-15:00)
- 周期性事件：私人时间 (每周三 12:00-13:00)
- 周期性事件：团队同步 (每周五 16:00-17:00)

### 4. 启动开发服务器

```bash
npm run dev
```

这将同时启动：
- 后端服务器: http://localhost:3000
- 前端开发服务器: http://localhost:5173

### 5. 访问应用

- **公开日历**: http://localhost:5173/
  - 查看可用的面试时间段
  - 无需登录

- **管理后台**: http://localhost:5173/admin
  - 用户名: admin
  - 密码: admin123
  - 管理忙碌事件和设置

## 功能说明

### 公开日历页面

- 显示每周可用的面试时间段
- 周导航（上一周/下一周/今天）
- 响应式设计，支持移动端
- 显示时区信息

### 管理后台

#### 事件管理
- **添加事件**: 点击"添加事件"按钮
- **编辑事件**: 点击事件卡片上的"编辑"按钮
- **删除事件**: 点击事件卡片上的"删除"按钮

**事件类型**:
- **一次性事件**: 指定具体日期（如：2026-03-05）
- **周期性事件**: 每周固定时间（如：每周一 10:00-11:00）

#### 设置
- **可用时间范围**: 设置每天的工作时间（如：09:00-18:00）
- **可用天数**: 选择哪些天可以安排面试（如：周一到周五）
- **时间段长度**: 设置每个时间段的长度（如：30分钟）
- **时区**: 显示当前时区（Asia/Shanghai）

## 核心逻辑

### 空闲时段计算

系统会自动计算可用时间段：

1. 从设置中获取可用时间窗口（如：周一至周五 9:00-18:00）
2. 查询该周内的所有忙碌事件（一次性 + 周期性）
3. 对每一天：用可用窗口减去忙碌事件 → 剩余即为空闲时段
4. 按 slot_duration 量化为整齐的时间块

**示例**:
- 可用时间: 09:00-18:00
- 忙碌事件: 10:00-11:30, 14:00-15:00
- 空闲时段: 09:00-10:00, 11:30-14:00, 15:00-18:00
- 按30分钟切分: 09:00-09:30, 09:30-10:00, 11:30-12:00, ...

## 数据存储

数据存储在 `data/calendar.db` SQLite 数据库中：

- **events 表**: 存储所有忙碌事件
- **settings 表**: 存储系统设置

## 生产部署

### 1. 构建应用

```bash
npm run build
```

这将：
- 编译 TypeScript 代码
- 构建 React 前端
- 输出到 `server/dist` 和 `client/dist`

### 2. 配置生产环境

更新 `.env` 文件：

```env
NODE_ENV=production
PORT=3000
ADMIN_PASSWORD_HASH=<your-production-password-hash>
JWT_SECRET=<your-production-secret>
```

### 3. 启动生产服务器

```bash
npm start
```

应用将在 http://localhost:3000 运行（同时提供 API 和静态文件）。

### 4. 使用 PM2 部署（推荐）

```bash
npm install -g pm2
pm2 start npm --name "ai-calendar" -- start
pm2 save
pm2 startup
```

## 故障排查

### 端口被占用

如果端口 3000 或 5173 被占用，可以修改：

- 后端端口: 修改 `.env` 中的 `PORT`
- 前端端口: 修改 `client/vite.config.ts` 中的 `server.port`

### 数据库问题

如果需要重置数据库：

```bash
rm -rf data/calendar.db
npm run dev  # 重新创建数据库
node scripts/seed-data.js  # 重新添加测试数据
```

### 登录失败

确保 `.env` 中的 `ADMIN_PASSWORD_HASH` 和 `JWT_SECRET` 已正确配置。

## 开发建议

### 修改代码后

- 前端代码会自动热重载
- 后端代码会自动重启（使用 tsx watch）

### 查看日志

开发模式下，所有日志会输出到控制台。

### 测试 API

可以使用 curl 或 Postman 测试 API：

```bash
# 获取可用时间段（公开接口）
curl http://localhost:3000/api/availability?weekOf=2026-03-02

# 登录
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"password":"admin123"}'

# 获取事件列表（需要 token）
curl http://localhost:3000/api/events \
  -H "Authorization: Bearer <your-token>"
```

## 技术栈

- **前端**: React 18, TypeScript, Vite, Tailwind CSS, React Router
- **后端**: Express, TypeScript, better-sqlite3
- **认证**: bcrypt, JWT
- **日期处理**: date-fns

## 许可证

MIT
