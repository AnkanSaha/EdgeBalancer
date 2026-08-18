terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
  required_version = ">= 1.3"
}

provider "aws" {
  region = trimspace(var.aws_region)
}

# ===================================================================
# AWS ECS + EC2 LAUNCH TYPE (equivalent to k3s on a single VPS)
#
# Architecture (NAT removed for cost savings — ~$36/month saved):
#   Internet → Cloudflare → ALB (HTTPS) → ECS Tasks (public subnet)
#                                            ↓
#                                   ElastiCache Redis (t4g.micro)
#
# Auto-scaling: ASG min=1 max=10, ECS Service min=1 max=10 (uncapped)
# Region: ap-south-1 (Mumbai) — VERIFY: closest to Kolkata
# Machine: t4g.micro (2vCPU / 1GB ARM Graviton) — SAME AS YOUR CURRENT
# ===================================================================

# ─── VPC (minimal single-AZ) ──────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags                 = { Name = "edgebalancer-vpc" }
}

resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "edgebalancer-igw" }
}

resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.1.0/24"
  availability_zone       = "${var.aws_region}a"
  map_public_ip_on_launch = true
  tags                    = { Name = "public" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = { Name = "public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

# ─── Security Groups ──────────────────────────────────────────────
resource "aws_security_group" "alb" {
  name        = "edgebalancer-alb-sg"
  description = "HTTPS from Cloudflare to ALB"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "ecs" {
  name        = "edgebalancer-ecs-sg"
  description = "ECS container instances"
  vpc_id      = aws_vpc.main.id
  ingress {
    description     = "ALB → ECS"
    from_port       = 8000
    to_port         = 8000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_security_group" "redis" {
  name        = "edgebalancer-redis-sg"
  description = "Redis (ElastiCache)"
  vpc_id      = aws_vpc.main.id
  ingress {
    description     = "ECS → Redis"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs.id]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# ─── IAM Roles ────────────────────────────────────────────────────
resource "aws_iam_role" "ecs_instance" {
  name = "edgebalancer-ecs-instance-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ec2.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_instance_ec2" {
  role       = aws_iam_role.ecs_instance.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs" {
  name = "edgebalancer-ecs-instance-profile"
  role = aws_iam_role.ecs_instance.name
}

resource "aws_iam_role" "ecs_task_execution" {
  name = "edgebalancer-ecs-task-exec"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_task_exec" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "edgebalancer-ecs-task-role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

# ─── ECS Cluster ──────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "edgebalancer"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = { Name = "edgebalancer-ecs" }
}

# ─── Launch Template (t4g.micro, ARM Graviton) ────────────────────
# Uses AWS-provided ECS-optimized AMI for ARM64
data "aws_ssm_parameter" "ecs_ami" {
  name = "/aws/service/ecs/al2023/arm64/recommended"
}

resource "aws_launch_template" "ecs" {
  name_prefix   = "edgebalancer-ecs-"
  image_id      = data.aws_ssm_parameter.ecs_ami.value
  instance_type = "t4g.micro"

  iam_instance_profile { arn = aws_iam_instance_profile.ecs.arn }

  user_data = base64encode(<<-EOF
    #!/bin/bash
    cat > /etc/ecs/ecs.config <<CONF
    ECS_CLUSTER=${aws_ecs_cluster.main.name}
    ECS_ENABLE_CONTAINER_INSTANCE_DRAIN=true
    CONF
  EOF
  )
}

# ─── Auto Scaling Group (min 1, max 10 — UNCAPPED) ────────────────
resource "aws_autoscaling_group" "ecs" {
  name                      = "edgebalancer-ecs-asg"
  max_size                  = 10
  min_size                  = 1
  desired_capacity          = 1
  vpc_zone_identifier       = [aws_subnet.public.id]
  health_check_type         = "EC2"
  health_check_grace_period = 300

  launch_template {
    id      = aws_launch_template.ecs.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "edgebalancer-ecs"
    propagate_at_launch = true
  }
}

# ─── ECS Task Definition ───────────────────────────────────────────
resource "aws_ecs_task_definition" "app" {
  family                   = "edgebalancer-app"
  requires_compatibilities = ["EC2"]
  network_mode             = "bridge"
  cpu                      = "512"
  memory                   = "512"
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "edgebalancer-app"
      image = var.docker_image
      portMappings = [{
        containerPort = 8000
        hostPort      = 8000
        protocol      = "tcp"
      }]
      environment = [
        { name = "PORT", value = "8000" },
        { name = "REDIS_URL", value = "redis://${aws_elasticache_replication_group.redis.primary_endpoint_address}:6379" },
        { name = "JWT_SECRET", value = var.jwt_secret },
        { name = "MONGODB_URI", value = var.mongodb_uri },
        { name = "ENCRYPTION_KEY", value = var.encryption_key },
        { name = "CLIENT_URL", value = var.client_url },
        { name = "CORS_ORIGIN", value = var.cors_origin },
        { name = "FIREBASE_PROJECT_ID", value = var.firebase_project_id },
        { name = "FIREBASE_CLIENT_EMAIL", value = var.firebase_client_email },
        { name = "FIREBASE_PRIVATE_KEY", value = var.firebase_private_key },
        { name = "MISTRAL_API_KEY", value = var.mistral_api_key },
        { name = "OPENROUTER_API_KEY", value = var.openrouter_api_key },
        { name = "CLOUDFLARE_OAUTH_CLIENT_ID", value = var.cloudflare_oauth_client_id },
        { name = "CLOUDFLARE_OAUTH_CLIENT_SECRET", value = var.cloudflare_oauth_client_secret },
        { name = "CLOUDFLARE_OAUTH_REDIRECT_URI", value = var.cloudflare_oauth_redirect_uri },
      ]
    }
  ])
}

# ─── Load Balancer ────────────────────────────────────────────────
resource "aws_lb" "main" {
  name               = "edgebalancer-alb"
  internal           = false
  load_balancer_type = "application"
  subnets            = [aws_subnet.public.id]
  security_groups    = [aws_security_group.alb.id]
  tags               = { Name = "edgebalancer-alb" }
}

resource "aws_lb_target_group" "app" {
  name        = "edgebalancer-tg"
  port        = 8000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "instance"

  health_check {
    path                = "/health"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200-299"
  }
}

# ─── ACM Certificate (imported from same Cloudflare Origin certs as k3s) ─
resource "aws_acm_certificate" "cloudflare_origin" {
  certificate_body = var.cf_origin_cert
  private_key      = var.cf_origin_key
  tags             = { Name = "edgebalancer-cloudflare-cert" }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = aws_acm_certificate.cloudflare_origin.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.app.arn
  }
}

# ─── ECS Service ──────────────────────────────────────────────────
resource "aws_ecs_service" "app" {
  name            = "edgebalancer"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.app.arn
  launch_type     = "EC2"
  desired_count   = 1
  deployment_controller { type = "ECS" }

  load_balancer {
    target_group_arn = aws_lb_target_group.app.arn
    container_name   = "edgebalancer-app"
    container_port   = 8000
  }

  # Auto-scaling controlled by App Auto Scaling (below), not here
  lifecycle {
    ignore_changes = [desired_count]
  }

  depends_on = [aws_lb_listener.https]
}

# ─── ECS Service Auto Scaling (min 1, max 10 — UNCAPPED) ──────────
resource "aws_appautoscaling_target" "ecs" {
  max_capacity       = 10
  min_capacity       = 1
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "cpu-70-percent"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value = 70
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}

# ─── ElastiCache Redis (t4g.micro) ────────────────────────────────
resource "aws_elasticache_subnet_group" "redis" {
  name       = "edgebalancer-redis-subnet"
  subnet_ids = [aws_subnet.public.id]
}

resource "aws_elasticache_replication_group" "redis" {
  replication_group_id       = "edgebalancer-redis"
  description                = "EdgeBalancer rate-limit cache"
  node_type                  = "cache.t4g.micro"
  num_cache_clusters         = 1
  port                       = 6379
  subnet_group_name          = aws_elasticache_subnet_group.redis.name
  security_group_ids         = [aws_security_group.redis.id]
  parameter_group_name       = "default.redis7"
  at_rest_encryption_enabled = true
  # transit_encryption disabled: app uses redis:// (not rediss://)
  # All traffic stays within VPC. Enable later if TLS required.
  transit_encryption_enabled = false
  tags                       = { Name = "edgebalancer-redis" }
}

# ─── Outputs (used by GitHub Actions for force-deploy) ──────────────────
output "ecs_cluster_name" {
  value = aws_ecs_cluster.main.name
}

output "ecs_service_name" {
  value = aws_ecs_service.app.name
}

output "alb_dns" {
  value = aws_lb.main.dns_name
}

output "redis_endpoint" {
  value = aws_elasticache_replication_group.redis.primary_endpoint_address
}
