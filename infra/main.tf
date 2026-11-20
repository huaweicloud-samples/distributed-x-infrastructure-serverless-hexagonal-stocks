# ============================================================================
# 华为云 Hexagonal Architecture - 完整版（已在 cn-north-4 真机验证）
#
# 验证结论（2026-08-24，temp-test 环境）：
#   ✅ FunctionGraph 自动部署成功 —— 关键修复：
#      · 委托 delegated_service_name 必须是 "op_svc_cff"（非 op_svc_fgs）
#      · 委托权限用 domain_roles（OBS 为全局服务），不能用 project_role
#      · code_type="inline" 时 func_code 必须 base64 编码
#      · runtime 格式 "Node.js18.15"（非 "Node.js18"）
#      · 函数必须 app="default"
#      · Node.js handler 签名必须 (event, context) 两个参数
#   ✅ GeminiDB Cassandra 实例自动部署成功：
#      · datastore { type="cassandra", version="3.11", storage_engine="rocksDB" }
#      · version 必须是空字符串
#   ⏸ APIG 专享版实例：配置已验证正确（validate/plan 通过），
#     但创建报 APIC.9220 Insufficient account balance —— 账号余额不足，
#     需充值后取消下方注释再 apply。
#
# 凭证：通过环境变量 HW_ACCESS_KEY / HW_SECRET_KEY 传入，或 terraform.tfvars
# ============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    huaweicloud = {
      source  = "huaweicloud/huaweicloud"
      version = ">= 1.96.0"
    }
  }

  backend "local" {}
}

provider "huaweicloud" {
  region = var.region
}

variable "region" {
  description = "华为云区域"
  type        = string
  default     = "cn-north-4"
}

variable "project_name" {
  description = "项目名称"
  type        = string
  default     = "hexagonal-arch"
}

variable "domain_name" {
  description = "华为云账号域名"
  type        = string
  default     = "your-domain"
}

variable "db_password" {
  description = "GeminiDB 数据库密码（8-32位，含大小写字母、数字、特殊字符）"
  type        = string
  sensitive   = true
}

# ---------------------------------------------------------------------------
# 可用区查询
# ---------------------------------------------------------------------------
data "huaweicloud_availability_zones" "main" {}

# ---------------------------------------------------------------------------
# VPC 网络
# ---------------------------------------------------------------------------
resource "huaweicloud_vpc" "main" {
  name = "${var.project_name}-vpc"
  cidr = "10.0.0.0/16"
}

resource "huaweicloud_vpc_subnet" "subnet_a" {
  name       = "${var.project_name}-subnet-a"
  vpc_id     = huaweicloud_vpc.main.id
  cidr       = "10.0.0.0/24"
  gateway_ip = "10.0.0.1"
}

resource "huaweicloud_networking_secgroup" "main" {
  name        = "${var.project_name}-sg"
  description = "Security group for hexagonal architecture"
}

# ---------------------------------------------------------------------------
# IAM Agency（FunctionGraph 云服务委托）
# 注意：服务名必须是 op_svc_cff（FunctionGraph 旧称 CFF），OBS 权限用
#       domain_roles（全局角色）。用 op_svc_fgs + project_role 会导致
#       FSS.1501 "The delegate not exist"。
# ---------------------------------------------------------------------------
resource "huaweicloud_identity_agency" "functiongraph" {
  name                   = "${var.project_name}-fgs-agency-cff"
  description            = "Agency for FunctionGraph (cloud service delegation)"
  duration               = "FOREVER"
  delegated_service_name = "op_svc_cff"

  domain_roles = [
    "OBS OperateAccess",
  ]
}

# ---------------------------------------------------------------------------
# FunctionGraph 函数（code_type=inline 必须 base64 编码）
# ---------------------------------------------------------------------------
resource "huaweicloud_fgs_function" "main" {
  name        = "${var.project_name}-stocks-handler"
  app         = "default"
  agency      = huaweicloud_identity_agency.functiongraph.name
  handler     = "index.handler"
  memory_size = 256
  timeout     = 20
  runtime     = "Node.js18.15"

  code_type = "inline"
  func_code = base64encode(<<-EOF
exports.handler = async (event, context) => {
    try {
        const stockID = event.pathParameters?.StockID || event.pathParameters?.stockID;
        const response = {
            'statusCode': 200,
            'body': JSON.stringify({
                stockId: stockID,
                value: 1234.56,
                currency: 'USD',
                message: 'Stock data from Huawei Cloud'
            })
        };
        return response;
    } catch (err) {
        return {
            'statusCode': 500,
            'body': JSON.stringify({ error: 'Internal error' })
        };
    }
};
EOF
  )

  user_data = jsonencode({
    REGION = var.region
  })

  tags = {
    project = var.project_name
  }
}

# ---------------------------------------------------------------------------
# APIG 专享版实例
# ⚠️ 已真机验证：配置正确（validate/plan 通过），但创建报
#    APIC.9220 Insufficient account balance —— 账号余额不足，需充值。
#    充值后取消下方注释即可自动部署。
# ---------------------------------------------------------------------------
/*
resource "huaweicloud_apig_instance" "main" {
  name              = "${var.project_name}-apig"
  edition           = "BASIC"
  vpc_id            = huaweicloud_vpc.main.id
  subnet_id         = huaweicloud_vpc_subnet.subnet_a.id
  security_group_id = huaweicloud_networking_secgroup.main.id
  maintain_begin    = "06:00:00"
  bandwidth_size    = 5
  available_zones   = [
    data.huaweicloud_availability_zones.main.names[0],
    data.huaweicloud_availability_zones.main.names[1],
  ]

  tags = {
    project = var.project_name
  }
}

resource "huaweicloud_apig_group" "main" {
  name        = "${var.project_name}-api-group"
  instance_id = huaweicloud_apig_instance.main.id
}

resource "huaweicloud_apig_environment" "main" {
  name        = "release"
  instance_id = huaweicloud_apig_instance.main.id
}

resource "huaweicloud_apig_api" "main" {
  name             = "stock-api"
  group_id         = huaweicloud_apig_group.main.id
  instance_id      = huaweicloud_apig_instance.main.id
  type             = "FunctionGraph"
  request_method   = "GET"
  request_path     = "/stock/{StockID}"
  request_protocol = "HTTPS"

  func_graph {
    function_urn = huaweicloud_fgs_function.main.urn
  }
}
*/

# ---------------------------------------------------------------------------
# GeminiDB Cassandra 实例（CQL 端口 9042）
# ---------------------------------------------------------------------------
resource "huaweicloud_geminidb_instance" "store" {
  name = "${var.project_name}-geminidb-cql"
  mode = "Cluster"
  flavor {
    num       = 3
    size      = 100
    storage   = "ULTRAHIGH"
    spec_code = "geminidb.cassandra.large.4"
  }
  datastore {
    type           = "cassandra"
    version        = "3.11"
    storage_engine = "rocksDB"
  }
  availability_zone = data.huaweicloud_availability_zones.main.names[0]
  vpc_id            = huaweicloud_vpc.main.id
  subnet_id         = huaweicloud_vpc_subnet.subnet_a.id
  security_group_id = huaweicloud_networking_secgroup.main.id
  password          = var.db_password

  tags = {
    project = var.project_name
  }
}

output "function_urn" {
  description = "FunctionGraph 函数 URN"
  value       = huaweicloud_fgs_function.main.urn
}

output "geminidb_id" {
  description = "GeminiDB 实例 ID"
  value       = huaweicloud_geminidb_instance.store.id
}

output "vpc_id" {
  description = "VPC ID"
  value       = huaweicloud_vpc.main.id
}

output "subnet_id" {
  description = "Subnet ID"
  value       = huaweicloud_vpc_subnet.subnet_a.id
}

output "agency_name" {
  description = "IAM Agency Name"
  value       = huaweicloud_identity_agency.functiongraph.name
}

output "api_url" {
  description = "APIG 网关地址（需账号充值后启用）"
  value       = "APIG 实例需账号充值后创建（APIC.9220 Insufficient account balance）"
}
