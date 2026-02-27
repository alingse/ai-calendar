# AI Calendar - 个人面试日历网站

轻量的个人日历网站，用于标记忙碌时间并自动展示空闲的可面试时段。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Tailwind CSS
- **后端**: Express + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **认证**: bcrypt + JWT

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 生成管理员密码哈希

```bash
node scripts/generate-password-hash.js your-password
```

将输出的哈希值复制到 `.env` 文件中。

### 3. 配置环境变量

编辑 `.env` 文件：

```env
ADMIN_PASSWORD_HASH=<从上一步获取的哈希值>
JWT_SECRET=<随机生成的密钥>
PORT=3000
NODE_ENV=development
```

生成 JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. 启动开发服务器

```bash
npm run dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:3000

### 5. 访问应用

- 公开日历: http://localhost:5173/
- 管理后台: http://localhost:5173/admin

## 生产部署

### 1. 构建

```bash
npm run build
```

### 2. 启动

```bash
NODE_ENV=production npm start
```

应用将在 http://localhost:3000 运行（同时提供 API 和静态文件）。

## 功能说明

### 公开日历页面
- 查看每周可用的面试时间段
- 周导航（上一周/下一周/今天）
- 响应式设计，支持移动端

### 管理后台
- 密码登录
- 添加/编辑/删除忙碌事件
  - 一次性事件：指定具体日期
  - 周期性事件：每周固定时间
- 设置可用时间范围
- 设置可用天数
- 调整时间段长度

## 数据模型

### events 表
- 一次性事件：指定 date
- 周期性事件：指定 day_of_week (0=周日, 6=周六)

### settings 表
- available_start: 可用开始时间
- available_end: 可用结束时间
- available_days: 可用天数数组
- timezone: 时区
- slot_duration: 时间段长度（分钟）

## API 接口

### 公开接口
- `GET /api/availability?weekOf=2026-03-02` - 获取指定周的可用时段

### 认证接口
- `POST /api/auth/login` - 登录

### 管理接口（需要 JWT）
- `GET /api/events` - 获取所有事件
- `POST /api/events` - 创建事件
- `PUT /api/events/:id` - 更新事件
- `DELETE /api/events/:id` - 删除事件
- `GET /api/settings` - 获取设置
- `PUT /api/settings` - 更新设置

## 项目结构

```
ai-calendar/
├── server/          # Express 后端
│   └── src/
│       ├── index.ts
│       ├── db.ts
│       ├── middleware/
│       ├── routes/
│       └── utils/
├── client/          # React 前端
│   └── src/
│       ├── App.tsx
│       ├── pages/
│       └── components/
└── data/            # SQLite 数据库文件
```
