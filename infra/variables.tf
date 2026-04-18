variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "ap-southeast-1" # Singapore — close to Philippines
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  default     = "production"
}

variable "bucket_name" {
  description = "S3 bucket name for vehicle Excel imports"
  type        = string
  default     = "stockmo-vehicle-imports"
}

variable "supabase_url" {
  description = "Supabase project URL (e.g. https://xxx.supabase.co)"
  type        = string
  sensitive   = true
}

variable "supabase_service_role_key" {
  description = "Supabase service role key for server-side DB access"
  type        = string
  sensitive   = true
}

variable "allowed_origin" {
  description = "CORS allowed origin for the pre-signed URL endpoint"
  type        = string
  default     = "*"
}
