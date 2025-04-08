# CertGuard

专业的 SSL/TLS 证书监控系统，实时监控证书状态，及时提醒证书过期。

## 项目简介

CertGuard 是一个专业的 SSL/TLS 证书监控系统，旨在帮助用户实时监控网站证书状态，及时提醒证书过期，确保网站安全运行。本项目最初由 v0 完成基础设计，后期使用 Cursor 进行开发和优化。

## 主要特性

- 🔍 实时监控 SSL/TLS 证书状态
- ⏰ 智能提醒证书过期时间
- 📧 邮件通知系统
- 👤 多用户支持
- 🔒 安全的登录系统
- 📊 直观的证书状态展示
- 🚀 高性能的监控服务

## 技术栈

- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- Node.js
- Nodemailer (邮件服务)
- Better-SQLite3 (本地数据库)
- Zod (数据验证)
- Radix UI (UI组件库)
- Recharts (数据可视化)

## 快速开始

### 环境要求

- Node.js 18+
- pnpm (推荐) 或 npm/yarn

### 安装步骤

1. 克隆项目
```bash
git clone https://github.com/Dacong-wu/certGuard.git
cd certGuard
```

2. 安装依赖（推荐使用 pnpm）
```bash
pnpm install
# 或使用其他包管理器
npm install
# 或
yarn install
```

3. 配置环境变量
```bash
cp .env.example .env
```
编辑 `.env` 文件，配置必要的环境变量（详见 [环境变量配置](#环境变量配置)）

4. 启动开发服务器（推荐使用 pnpm）
```bash
pnpm dev
# 或使用其他包管理器
npm run dev
# 或
yarn dev
```

## 环境变量配置

项目需要配置以下环境变量：

### 邮件服务器配置
- `SMTP_HOST`: SMTP 服务器地址
- `SMTP_PORT`: SMTP 服务器端口
- `SMTP_SECURE`: 是否使用 SSL/TLS
- `SMTP_USER`: 邮箱账号
- `SMTP_PASS`: 邮箱密码或应用专用密码
- `SMTP_FROM`: 发件人信息

### 应用配置
- `PORT`: 应用运行端口
- `NEXT_PUBLIC_APP_NAME`: 应用名称
- `NEXT_PUBLIC_APP_DESCRIPTION`: 应用描述
- `NEXT_PUBLIC_APP_KEYWORDS`: 应用关键词

### 安全配置
- `ALLOWED_EMAILS`: 允许登录的邮箱地址（多个用逗号分隔）

## 使用说明

1. 访问 `http://localhost:3000` 进入系统
2. 使用配置的邮箱登录系统
3. 添加需要监控的域名
4. 系统会自动监控证书状态并发送提醒

## 开发计划

- [ ] 添加更多通知渠道

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 许可证

MIT License
