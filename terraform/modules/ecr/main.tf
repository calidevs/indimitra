resource "aws_ecr_repository" "this" {
  name                 = "${var.name_prefix}-ecr"
  image_tag_mutability = var.image_tag_mutability
  tags                 = var.tags

  encryption_configuration {
    encryption_type = var.encryption_type
  }

  image_scanning_configuration {
    scan_on_push = var.scan_on_push
  }
}
