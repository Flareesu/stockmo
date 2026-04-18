# ─── Outputs ──────────────────────────────────────────────────────────────────

output "s3_bucket_name" {
  description = "S3 bucket name for vehicle Excel imports"
  value       = aws_s3_bucket.vehicle_imports.bucket
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = aws_s3_bucket.vehicle_imports.arn
}

output "processor_lambda_arn" {
  description = "ARN of the vehicle import processor Lambda"
  value       = aws_lambda_function.vehicle_import_processor.arn
}

output "presign_function_url" {
  description = "Public URL for the pre-signed upload URL endpoint — use this in the frontend"
  value       = aws_lambda_function_url.presign_url.function_url
}
