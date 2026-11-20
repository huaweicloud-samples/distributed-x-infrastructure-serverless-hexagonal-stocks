# Hexagonal Architecture Serverless Application

![License](https://img.shields.io/badge/License-MIT%20No%20Attribution-blue)

[中文版](./README.cn.md)
![Huawei Cloud](https://img.shields.io/badge/Huawei%20Cloud-Compatible-green)

## Overview

This project demonstrates how to implement **Hexagonal Architecture** (also known as Ports and Adapters) on Huawei Cloud, building a high-performance serverless stock data query API.

This project implements a stock data query service: users query stock information via API (e.g., `/stock/AMZN`), the system retrieves base stock price from the database, calls external currency API for real-time exchange rates, converts stock price to target currency (supports USD/EUR/GBP/CNY, etc.), and optionally uses Redis cache for currency data to reduce external API calls.

### Core Value

1. **Architecture Demonstration**: Shows how to apply Hexagonal Architecture to Huawei Cloud serverless scenarios, completely decoupling business code from infrastructure
2. **Clean Layering**:
   - **Adapter Layer**: Handles external system interactions (HTTP requests, database, cache, external APIs)
   - **Ports Layer**: Defines abstract interfaces for business logic
   - **Domain Layer**: Contains core business rules (stock price calculation, currency conversion)
3. **Evolution Capability**: Cache layer can be hot-swapped—switching from direct external API calls to Redis cache requires no business logic changes
4. **Cloud-Native Deployment**: Leverages Huawei Cloud FunctionGraph for zero server management, pay-as-you-go

## Table of Contents

- [Architecture](#architecture)
- [Key Features](#key-features)
- [Cloud Services](#cloud-services)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Usage](#usage)
- [Cleanup](#cleanup)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    APIG (API Gateway)                   │
│              https://xxx.apig.cn-north-4/                 │
└─────────────────────────┬───────────────────────────────┘
                        │ GET /stock/{StockID}
┌─────────────────────────▼───────────────────────────────┐
│              FunctionGraph (Serverless)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Adapter Layer                       │   │
│  │   - GetStocksRequest.js                         │   │
│  │   - StocksDB.js                                 │   │
│  │   - CurrencyConverter.js                        │   │
│  └─────────────────────────┬───────────────────────┘   │
│                            │                           │
│  ┌─────────────────────────▼───────────────────────┐   │
│  │              Ports Layer                        │   │
│  │   - HTTPHandler                                 │   │
│  │   - Repository                                  │   │
│  │   - CurrenciesService                          │   │
│  └─────────────────────────┬───────────────────────┘   │
│                            │                           │
│  ┌─────────────────────────▼───────────────────────┐   │
│  │              Domain Layer                       │   │
│  │   - StocksLogic.js                             │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────┬───────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
    ┌─────────┐    ┌──────────┐    ┌─────────┐
    │GeminiDB │    │   DCS    │    │External │
    │ Cassandra│    │ (Redis)  │    │   API   │
    │ Compatible│   │  Cache   │    │(Currency)│
    └─────────┘    └──────────┘    └─────────┘
```

## Key Features

- **Hexagonal Architecture**: Clean separation of concerns for easy unit testing and business logic reuse
- **Serverless**: No server management, pay-as-you-go
- **Cache-Optimized**: Integrated Redis cache to reduce external API calls
- **Cloud-Native**: Built with Huawei Cloud native services

## Cloud Services

- **APIG**: API Gateway for HTTP endpoints
- **FunctionGraph**: Serverless function service
- **GeminiDB**: Distributed database (Cassandra compatible)
- **DCS**: Distributed cache service (Redis)
- **VPC**: Virtual Private Cloud
- **NAT Gateway**: Outbound traffic for private subnets

## Prerequisites

- Huawei Cloud account (with required services enabled)
- Terraform CLI (>= 1.5)
- Region: China North 4 (cn-north-4)

## Quick Start

### 1. Clone the project

```bash
git clone <repository-url>
cd hexagonal-architecture
```

### 2. Configure environment variables

```bash
export HW_ACCESS_KEY="your-access-key"
export HW_SECRET_KEY="your-secret-key"
export HW_DOMAIN_NAME="your-domain-name"
```

### 3. Deploy infrastructure

```bash
cd infra
terraform init
terraform plan
terraform apply
```

### 4. Get API endpoint

After deployment, the output will show the API URL:

```
api_url = https://xxx.apig.cn-north-4.huawei.com/stock/AMZN
```

## Usage

### Test API

Call the API using curl:

```bash
curl https://<api-url>/stock/AMZN
```

Expected response:

```json
{
  "stockId": "AMZN",
  "value": 1234.56,
  "currency": "USD"
}
```

### Add stock data

Add data via GeminiDB console:

- **STOCK_ID**: AMZN
- **VALUE**: 1234.56

## Cleanup

```bash
cd infra
terraform destroy
```

## License

This practice is licensed under MIT No Attribution. See [LICENSE](./LICENSE) for details.

## Contact

- Team: Public Cloud Operations Department
- Issues: Please open a GitHub Issue
