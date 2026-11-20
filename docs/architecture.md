# 华为云架构说明

## 概述

本项目使用华为云服务构建了一个基于六边形架构（Hexagonal Architecture）的无服务器股票数据查询 API。

## 架构设计

### 六边形架构

六边形架构是一种软件设计模式，旨在实现关注点分离：

- **适配器层（Adapters）**：负责与外部系统交互
  - `GetStocksRequest.js`：处理 HTTP 请求
  - `StocksDB.js`：与 GeminiDB 交互
  - `CurrencyConverter.js`：获取货币汇率

- **端口层（Ports）**：定义业务逻辑的接口
  - `HTTPHandler`：HTTP 请求处理接口
  - `Repository`：数据存储接口
  - `CurrenciesService`：货币服务接口

- **领域层（Domain）**：核心业务逻辑
  - `StocksLogic.js`：股票业务逻辑

### 云服务架构

```
┌─────────────────────────────────────────────────────────┐
│                    APIG (API 网关)                       │
│              HTTPS 端点: /stock/{StockID}                │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              FunctionGraph (函数计算)                     │
│  - 运行时: Node.js 18.x                                │
│  - 内存: 256 MB                                        │
│  - 超时: 20 秒                                         │
│  - VPC: 私有子网部署                                   │
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

## 网络架构

### VPC 配置

- **CIDR**: 10.0.0.0/16
- **子网**:
  - 子网 A (10.0.0.0/24): 私有子网，部署 FunctionGraph
  - 子网 B (10.0.1.0/24): 私有子网，部署 FunctionGraph
  - 子网 C (10.0.2.0/24): 公有子网，部署 NAT 网关

### 安全策略

- FunctionGraph 部署在私有子网
- 通过 NAT 网关访问外部 API（货币汇率）
- 安全组控制入站和出站流量

## 数据流

1. 客户端请求到达 APIG
2. APIG 触发 FunctionGraph 函数
3. 函数从 GeminiDB 获取股票数据
4. 函数调用外部货币 API 获取汇率（可选缓存）
5. 计算转换后的价值
6. 返回 JSON 响应

## 环境变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| DB_TABLE | 数据库表名 | StocksTable |
| DB_ENDPOINT | GeminiDB 端点 | xxx.gemini.cn-north-4.myhuaweicloud.com |
| CACHE_URL | DCS Redis 地址 | xxx.dcs.cn-north-4.myhuaweicloud.com |
| CACHE_PORT | DCS Redis 端口 | 6379 |
| REGION | 区域 | cn-north-4 |
| CURRENCIES_PATH | 货币 API 地址 | https://api.exchangerate.host |
