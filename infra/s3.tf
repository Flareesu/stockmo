# ─── S3 Bucket: Vehicle Excel Imports ─────────────────────────────────────────

resource "aws_s3_bucket" "vehicle_imports" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_versioning" "vehicle_imports" {
  bucket = aws_s3_bucket.vehicle_imports.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "vehicle_imports" {
  bucket = aws_s3_bucket.vehicle_imports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# No lifecycle deletion — files are kept persistently for audit trail
# and reprocessing. Versioning handles accidental overwrites.

resource "aws_s3_bucket_public_access_block" "vehicle_imports" {
  bucket = aws_s3_bucket.vehicle_imports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_cors_configuration" "vehicle_imports" {
  bucket = aws_s3_bucket.vehicle_imports.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT", "POST"]
    allowed_origins = [var.allowed_origin]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}

# ─── S3 Event Notification → Lambda ──────────────────────────────────────────

resource "aws_s3_bucket_notification" "vehicle_imports" {
  bucket = aws_s3_bucket.vehicle_imports.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.vehicle_import_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".xlsx"
  }

  lambda_function {
    lambda_function_arn = aws_lambda_function.vehicle_import_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".xls"
  }

  lambda_function {
    lambda_function_arn = aws_lambda_function.vehicle_import_processor.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"
    filter_suffix       = ".csv"
  }

  depends_on = [aws_lambda_permission.allow_s3_invoke]
}
