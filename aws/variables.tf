variable "aws_region" {
  type        = string
  description = "AWS region (default: ap-south-1 Mumbai — closest to Kolkata, VERIFY)"
  default     = "ap-south-1"
}

variable "docker_image" {
  type        = string
  description = "Docker image for EdgeBalancer server (e.g. ghcr.io/nexoral/edgebalancer-server:3.10.27)"
}

variable "jwt_secret" {
  type        = string
  description = "JWT secret (min 32 chars)"
}

variable "encryption_key" {
  type        = string
  description = "AES-256-GCM encryption key (64-char hex)"
}

variable "mongodb_uri" {
  type        = string
  description = "MongoDB Atlas connection string"
}

variable "client_url" {
  type        = string
  description = "Client URL for CORS"
  default     = "https://edge.nexoral.in"
}

variable "cors_origin" {
  type        = string
  description = "CORS origin"
  default     = "https://edge.nexoral.in"
}

variable "cf_origin_cert" {
  type        = string
  description = "Cloudflare Origin CA certificate (same GitHub Secret as k3s: CF_ORIGIN_CERT)"
  sensitive   = true
}

variable "cf_origin_key" {
  type        = string
  description = "Cloudflare Origin CA private key (same GitHub Secret as k3s: CF_ORIGIN_KEY)"
  sensitive   = true
}

variable "firebase_project_id" {
  type        = string
  description = "Firebase project ID"
  default     = ""
}

variable "firebase_client_email" {
  type        = string
  description = "Firebase service account client email"
  default     = ""
}

variable "firebase_private_key" {
  type        = string
  description = "Firebase service account private key"
  default     = ""
}

variable "mistral_api_key" {
  type        = string
  description = "Mistral AI API key"
  default     = ""
}

variable "openrouter_api_key" {
  type        = string
  description = "OpenRouter API key"
  default     = ""
}

variable "cloudflare_oauth_client_id" {
  type        = string
  description = "Cloudflare OAuth client ID"
  default     = ""
}

variable "cloudflare_oauth_client_secret" {
  type        = string
  description = "Cloudflare OAuth client secret"
  default     = ""
}

variable "cloudflare_oauth_redirect_uri" {
  type        = string
  description = "Cloudflare OAuth redirect URI"
  default     = ""
}
