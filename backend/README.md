# PandaWiki Backend

PandaWiki后端服务，提供API接口、消息队列消费、数据迁移等功能。

## 目录结构

```
backend/
├── api/           # API接口定义
├── cmd/           # 命令行入口
│   ├── api/       # API服务
│   ├── consumer/  # 消息队列消费者
│   └── migrate/   # 数据迁移
├── config/        # 配置管理
├── consts/        # 常量定义
├── docs/          # API文档
├── domain/        # 领域模型
├── handler/       # 请求处理器
├── mq/            # 消息队列
├── pkg/           # 公共包
├── repo/          # 数据访问层
├── store/         # 存储相关
├── usecase/       # 业务逻辑
└── utils/         # 工具函数
```

## 配置说明

### 环境变量配置

项目使用环境变量进行配置，主要配置项如下：

| 环境变量 | 描述 | 默认值 |
|---------|------|-------|
| POSTGRES_PASSWORD | PostgreSQL密码 | panda-wiki-secret |
| NATS_PASSWORD | NATS消息队列密码 | panda-wiki-nats-secret |
| REDIS_PASSWORD | Redis密码 | panda-wiki-redis-secret |
| JWT_SECRET | JWT密钥 | panda-wiki-jwt-secret |
| S3_SECRET_KEY | S3存储密钥 | panda-wiki-s3-secret |
| ADMIN_PASSWORD | 管理员密码 | panda-wiki-admin-secret |
| SUBNET_PREFIX | 子网前缀 | 169.254.15 |
| LOG_LEVEL | 日志级别 | 0 (info) |

### 配置文件

项目支持使用YAML配置文件进行配置，默认读取 `./config/config.yml` 文件。

可以从 `config/config.yml.example` 复制并修改：

```bash
cp config/config.yml.example config/config.yml
```

## 本地开发

### 依赖安装

```bash
# 安装Go依赖
go mod tidy

# 安装Wire依赖（用于依赖注入）
go install github.com/google/wire/cmd/wire@latest
```

### 生成依赖注入代码

```bash
# 生成API服务依赖注入代码
cd cmd/api
wire

# 生成消费者依赖注入代码
cd ../consumer
wire

# 生成迁移依赖注入代码
cd ../migrate
wire
```

### 运行服务

```bash
# 运行API服务
go run cmd/api/main.go

# 运行消费者服务
go run cmd/consumer/main.go

# 运行数据迁移
go run cmd/migrate/main.go
```

## Docker构建

### 构建API镜像

```bash
docker build -t panda-wiki-api -f Dockerfile.api .
```

### 构建消费者镜像

```bash
docker build -t panda-wiki-consumer -f Dockerfile.consumer .
```

### 跨平台构建

```bash 
docker buildx build --platform linux/amd64,linux/arm64 -t panda-wiki-api --build-arg VERSION=v1.0.0 -f Dockerfile.api .
```

## 部署说明

### 使用docker-compose部署

项目根目录提供了 `docker-compose.yml` 文件，可以直接使用它来部署整个系统：

```bash
docker-compose up -d
```

### 环境变量文件

在部署前，确保创建了正确的 `.env` 文件，包含所有必要的环境变量。

## 常见问题

### 配置文件未找到

如果遇到 "config file not found" 错误，这是正常的，因为项目会使用默认配置和环境变量覆盖。

### 依赖注入代码未生成

如果遇到 "wire_gen.go not found" 错误，需要先运行 `wire` 命令生成依赖注入代码。

### 数据库连接失败

确保 PostgreSQL 服务正在运行，并且 `POSTGRES_PASSWORD` 环境变量设置正确。

## 日志说明

- 日志级别：-4 (debug), 0 (info), 4 (warn), 8 (error)
- 默认日志级别：info (0)
- 可以通过 `LOG_LEVEL` 环境变量修改日志级别
