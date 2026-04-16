variable "aws_project" {
  description = "The AWS project name."
  type        = string
  default     = "coding-workshop"
}

variable "aws_region" {
  description = "The AWS region."
  type        = string
  default     = "ap-south-1"
}

variable "aws_bucket" {
  description = "The AWS S3 bucket name for terraform state storage."
  type        = string
  default     = "coding-workshop-us-east-1-abcd1234"
}

variable "aws_app_code" {
  description = "The AWS application unique code."
  type        = string
  default     = "abcd1234"
}

variable "aws_vpc_id" {
  description = "The AWS VPC identifier."
  type        = string
  default     = null
}

variable "aws_docdb_enabled" {
  description = "Enable or disable MongoDB. Set to 'true' to enable it."
  type        = bool
  default     = false
}

variable "aws_mongo_host" {
  description = "MongoDB host for LocalStack. Defaults to 'host.docker.internal' (on Linux, set to '172.17.0.1')."
  type        = string
  default     = null
}

variable "aws_postgres_host" {
  description = "PostgreSQL host."
  type        = string
  default     = null
}

variable "aws_postgres_port" {
  description = "PostgreSQL port."
  type        = string
  default     = "5432"
}

variable "aws_postgres_name" {
  description = "PostgreSQL database name."
  type        = string
  default     = "postgres"
}

variable "aws_postgres_user" {
  description = "PostgreSQL username."
  type        = string
  default     = "postgres"
}

variable "aws_postgres_pass" {
  description = "PostgreSQL password."
  type        = string
  default     = null
  sensitive   = true
}
