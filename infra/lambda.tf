# ─── Lambda: Vehicle Import Processor ─────────────────────────────────────────
# Triggered by S3 ObjectCreated events. Parses Excel, writes to Supabase.

# ─── Package Lambda code ──────────────────────────────────────────────────────

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../lambda"
  output_path = "${path.module}/lambda.zip"
}

# ─── IAM Role ─────────────────────────────────────────────────────────────────

resource "aws_iam_role" "lambda_role" {
  name = "stockmo-vehicle-import-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

# CloudWatch Logs policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# S3 read + tag access to the imports bucket
resource "aws_iam_role_policy" "lambda_s3_access" {
  name = "stockmo-lambda-s3-access"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Action = [
        "s3:GetObject",
        "s3:PutObjectTagging",
      ]
      Resource = "${aws_s3_bucket.vehicle_imports.arn}/*"
    }]
  })
}

# S3 write access for pre-signed URL Lambda (PutObject needed for pre-sign)
resource "aws_iam_role_policy" "lambda_s3_write" {
  name = "stockmo-lambda-s3-write"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["s3:PutObject"]
      Resource = "${aws_s3_bucket.vehicle_imports.arn}/uploads/*"
    }]
  })
}

# ─── CloudWatch Log Group (30-day retention) ──────────────────────────────────

resource "aws_cloudwatch_log_group" "processor_logs" {
  name              = "/aws/lambda/stockmo-vehicle-import-processor"
  retention_in_days = 30
}

resource "aws_cloudwatch_log_group" "presign_logs" {
  name              = "/aws/lambda/stockmo-presign-upload-url"
  retention_in_days = 30
}

# ─── Lambda Function: Processor ───────────────────────────────────────────────

resource "aws_lambda_function" "vehicle_import_processor" {
  function_name    = "stockmo-vehicle-import-processor"
  description      = "Processes uploaded Excel/CSV vehicle files and writes to Supabase"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  memory_size      = 1024
  timeout          = 120
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      SUPABASE_URL              = var.supabase_url
      SUPABASE_SERVICE_ROLE_KEY = var.supabase_service_role_key
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.processor_logs,
  ]
}

# Allow S3 to invoke the processor Lambda
resource "aws_lambda_permission" "allow_s3_invoke" {
  statement_id  = "AllowS3Invoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.vehicle_import_processor.function_name
  principal     = "s3.amazonaws.com"
  source_arn    = aws_s3_bucket.vehicle_imports.arn
}

# ─── Lambda Function: Pre-signed URL Generator ───────────────────────────────

resource "aws_lambda_function" "presign_upload_url" {
  function_name    = "stockmo-presign-upload-url"
  description      = "Generates pre-signed S3 upload URLs for the StockMo frontend"
  role             = aws_iam_role.lambda_role.arn
  handler          = "presign.handler"
  runtime          = "nodejs20.x"
  memory_size      = 128
  timeout          = 10
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      S3_BUCKET      = aws_s3_bucket.vehicle_imports.bucket
      ALLOWED_ORIGIN = var.allowed_origin
    }
  }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_cloudwatch_log_group.presign_logs,
  ]
}

# ─── Lambda Function URL (public endpoint for pre-signed URL requests) ───────

resource "aws_lambda_function_url" "presign_url" {
  function_name      = aws_lambda_function.presign_upload_url.function_name
  authorization_type = "NONE" # Public — the frontend calls this directly

  cors {
    allow_origins = [var.allowed_origin]
    allow_methods = ["*"]
    allow_headers = ["Content-Type", "Authorization"]
    max_age       = 3600
  }
}
