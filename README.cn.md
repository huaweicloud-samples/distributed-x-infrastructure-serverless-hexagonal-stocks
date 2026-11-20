# 六边形架构无服务器应用

![License](https://img.shields.io/badge/License-MIT%20No%20Attribution-blue)

[English](./README.md)
![Huawei Cloud](https://img.shields.io/badge/Huawei%20Cloud-Compatible-green)

## 简介

本项目演示了如何在华为云上实现**六边形架构（Hexagonal Architecture）**的无服务器应用，构建一个高性能的股票数据查询 API。

本项目实现了一个股票数据查询服务：用户通过 API 查询股票信息（如 `/stock/AMZN`），系统从数据库获取股票基础价格，调用外部货币 API 获取实时汇率，将股票价格转换为指定货币（支持 USD/EUR/GBP/CNY 等），可选地使用 Redis 缓存货币数据，减少外部 API 调用。

### 核心价值

1. **架构示范**：展示如何将六边形架构应用于华为云无服务器场景，业务代码与基础设施完全解耦
2. **分层清晰**：
   - **适配器层**：处理外部系统交互（HTTP 请求、数据库、缓存、外部 API）
   - **端口层**：定义业务逻辑的抽象接口
   - **领域层**：承载核心业务规则（股票价格计算、货币转换）
3. **演进能力**：缓存层可热插拔——从直接调用外部 API 切换到 Redis 缓存，无需修改业务逻辑
4. **云原生部署**：利用华为云 FunctionGraph 实现零服务器运维、按需付费

## 目录

- [架构图](#架构图)
- [方案亮点](#方案亮点)
- [涉及云服务](#涉及云服务)
- [前置条件](#前置条件)
- [快速开始](#快速开始)
- [使用方法](#使用方法)
- [清理资源](#清理资源)

## 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    APIG (API 网关)                       │
│              https://xxx.apig.cn-north-4/                 │
└─────────────────────────┬───────────────────────────────┘
                        │ GET /stock/{StockID}
┌─────────────────────────▼───────────────────────────────┐
│              FunctionGraph (函数计算)                     │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Adapter Layer (适配器)               │   │
│  │   - GetStocksRequest.js                         │   │
│  │   - StocksDB.js                                 │   │
│  │   - CurrencyConverter.js                        │   │
│  └─────────────────────────┬───────────────────────┘   │
│                            │                           │
│  ┌─────────────────────────▼───────────────────────┐   │
│  │              Ports Layer (端口层)                │   │
│  │   - HTTPHandler                                 │   │
│  │   - Repository                                  │   │
│  │   - CurrenciesService                          │   │
│  └─────────────────────────┬───────────────────────┘   │
│                            │                           │
│  ┌─────────────────────────▼───────────────────────┐   │
│  │              Domain Layer (领域层)               │   │
│  │   - StocksLogic.js                             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    ┌─────────┐    ┌──────────┐    ┌─────────┐
    │GeminiDB │    │   DCS    │    │外部API   │
    │ Cassandra│    │ (Redis)  │    │(汇率)   │
    │ 兼容模式│    │ 缓存层   │    │         │
    └─────────┘    └──────────┘    └─────────┘
```

## 方案亮点

- **六边形架构**：清晰的关注点分离，便于单元测试和业务逻辑复用
- **无服务器**：无需管理服务器，按需付费
- **缓存优化**：集成 Redis 缓存，减少外部 API 调用
- **云原生**：使用华为云原生服务构建

## 涉及云服务

- **APIG**：API 网关，提供 HTTP 端点
- **FunctionGraph**：函数计算服务
- **GeminiDB**：分布式数据库（Cassandra 兼容）
- **DCS**：分布式缓存服务（Redis）
- **VPC**：虚拟私有云
- **NAT 网关**：私有子网出站流量

## 前置条件

- 华为云账号（已开通相关服务）
- Terraform CLI (>= 1.5)
- 华为云区域：北京四 (cn-north-4)

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd hexagonal-architecture
```

### 2. 配置环境变量

```bash
export HW_ACCESS_KEY="your-access-key"
export HW_SECRET_KEY="your-secret-key"
export HW_DOMAIN_NAME="your-domain-name"
```

### 3. 部署基础设施

```bash
cd infra
terraform init
terraform plan
terraform apply
```

### 4. 获取 API 地址

部署完成后，输出中会显示 API 地址：

```
api_url = https://xxx.apig.cn-north-4.huawei.com/stock/AMZN
```

## 使用方法

### 测试 API

使用 curl 调用 API：

```bash
curl https://<api-url>/stock/AMZN
```

预期响应：

```json
{
  "stockId": "AMZN",
  "value": 1234.56,
  "currency": "USD"
}
```

### 添加股票数据

在 GeminiDB 控制台添加数据：

- **STOCK_ID**: AMZN
- **VALUE**: 1234.56

## 清理资源

```bash
cd infra
terraform destroy
```

## 许可证

本实践采用 MIT No Attribution 许可证。详情请参见 [LICENSE](./LICENSE) 文件。

## 联系方式

- 维护团队：公有云持续运营部
- 问题反馈：请提交 GitHub Issue
