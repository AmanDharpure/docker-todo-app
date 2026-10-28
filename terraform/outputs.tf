output "server_public_ip" {
  description = "Public IP of the deployed EC2 server"
  value       = aws_instance.todo_server.public_ip
}
