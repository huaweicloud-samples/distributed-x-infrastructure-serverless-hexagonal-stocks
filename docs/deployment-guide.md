# 部署指南

## 前置条件

1. **华为云账号**：已开通以下服务
   - FunctionGraph
   - APIG
   - GeminiDB
   - DCS
   - VPC

2. **工具要求**：
   - Terraform >= 1.5
   - Node.js >= 18

3. **权限要求**：
   - IAM 委托（Agency）：FunctionGraph 访问 GeminiDB 和 DCS

## 部署步骤

### 步骤 1：配置环境变量

```bash
export HW_ACCESS_KEY="your-access-key"
export HW_SECRET_KEY="your-secret-key"
export HW_DOMAIN_NAME="your-domain-name"
```

### 步骤 2：初始化 Terraform

```bash
cd infra
terraform init
```

### 步骤 3：规划部署

```bash
terraform plan
```

### 步骤 4：执行部署

```bash
terraform apply
```

输入 `yes` 确认部署。

### 步骤 5：验证部署

部署完成后，检查输出：

```
api_url = "https://xxx.apig.cn-north-4.huawei.com/stock/AMZN"
```

测试 API：

```bash
curl https://<api-url>/stock/AMZN
```

## 配置说明

### Terraform 变量

在 `infra/` 目录下创建 `terraform.tfvars`：

```hcl
region        = "cn-north-4"
project_name  = "hexagonal-arch"
domain_name   = "your-domain-name"
dcs_password  = "your-dcs-password"
```

### 华为云服务配置

- **APIG**: BASIC 版（入门级）
- **FunctionGraph**: Node.js 18.x，256MB 内存
- **GeminiDB**: 集群模式，Cassandra 兼容
- **DCS**: Redis 5.0，单节点

## 清理资源

```bash
terraform destroy
```

## 故障排除

### 问题 1：FunctionGraph 无法访问 GeminiDB

检查：
1. FunctionGraph 和 GeminiDB 位于同一 VPC
2. 安全组允许 6379 端口访问

### 问题 2：API 调用返回 502

检查：
1. APIG 已发布到正确的环境
2. FunctionGraph 函数正常运行

### 问题 3：Terraform 部署失败

检查：
1. AK/SK 权限是否足够
2. 区域是否支持所有服务
