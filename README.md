Automated Cloud Deployment: Containerized Todo API
An end-to-end DevOps project that deploys a containerized Todo REST API to AWS EC2 using Docker Compose, Nginx, Terraform, Ansible, and GitHub Actions.

The project demonstrates Infrastructure as Code (IaC), automated server configuration, reverse-proxy routing, persistent database storage, and CI/CD automation.
Architecture
                         Internet
                            |
                         HTTP :80
                            |
                     AWS EC2 (Ubuntu)
                            |
                    +-------v-------+
                    |     Nginx     |
                    | Reverse Proxy |
                    +-------+-------+
                            |
                  Internal Docker network
                            |
                    +-------v-------+
                    |  Node.js API   |
                    | Express :3000  |
                    +-------+-------+
                            |
                    +-------v-------+
                    |    MongoDB     |
                    |    :27017      |
                    +-------+--------+
                            |
                    Named Docker volume
                    (persistent data)
Only Nginx is intended to accept public HTTP traffic. The API and MongoDB should remain on the internal Docker network and should not have public host ports exposed.
Technology Stack
Area	Tools
Cloud	AWS EC2, VPC security groups
Infrastructure as Code	Terraform
Configuration management	Ansible
Containerization	Docker, Docker Compose
Reverse proxy	Nginx
Backend	Node.js, Express.js, Mongoose
Database	MongoDB 7
CI/CD	GitHub Actions
Container registry	Docker Hub


Project Structure
docker-todo-app/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── ansible/
│   ├── inventory.ini
│   └── playbook.yml
├── nginx/
│   └── nginx.conf
├── terraform/
│   ├── main.tf
│   ├── variables.tf
│   └── outputs.tf
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
└── server.js
Features
- REST API endpoints to create, list, update, and delete Todo items.
- Multi-container deployment using Docker Compose.
- Nginx reverse proxy for HTTP traffic on port 80.
- MongoDB persistence through a named Docker volume.
- AWS infrastructure provisioned with Terraform.
- Docker installation and host setup automated using Ansible.
- GitHub Actions workflow to build and publish the API image to Docker Hub, then deploy it to EC2 over SSH.
- Separation of local development and production Compose configuration.
API Endpoints
All production requests should enter through Nginx on port 80.
Method	Endpoint	Purpose	Example body
POST	/todos	Create a Todo	{"title":"Deploy to AWS"}
GET	/todos	List Todo items	None
PUT	/todos/:id	Update a Todo	{"completed":true}
DELETE	/todos/:id	Delete a Todo	None


The exact request body and response format depend on the implementation in server.js.
Prerequisites
Install or configure the following tools:
- Git
- Docker Desktop for local development
- AWS CLI
- Terraform
- An SSH key pair that can access the EC2 instance
- An AWS account with permission to create the resources defined in Terraform
- A Docker Hub account and a GitHub repository
For AWS CLI authentication, use an appropriate profile or aws configure. Never commit AWS credentials or private SSH keys to Git.
1. Clone the Repository
git clone https://github.com/AmanDharpure/docker-todo-app.git
cd docker-todo-app
2. Run Locally
Make sure Docker Desktop is running, then start the development stack:
docker compose up -d --build
docker compose ps
docker compose logs -f
Test the API. The following commands assume the development Compose file publishes the API on localhost:3000:
curl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Local persistence test"}'

curl http://localhost:3000/todos
Test persistence by recreating the containers without deleting named volumes:
docker compose down
docker compose up -d
curl http://localhost:3000/todos
Data warning: docker compose down -v removes Compose-managed named volumes and can delete local database data. Use it only when you intentionally want to remove that data.

3. Provision AWS Infrastructure with Terraform
Review the Terraform configuration before applying it. Confirm the AWS region, instance type, AMI, SSH key configuration, and security-group rules.
cd terraform
terraform init
terraform fmt -check
terraform validate
terraform plan
terraform apply
Review the plan and confirm the changes when prompted. Retrieve the public IP from the configured output:
terraform output
Use the actual output from your deployment; do not rely on an IP address copied from an example.

Security checklist:
- Allow SSH (port 22) only from your trusted IP where possible.
- Allow HTTP (port 80) for public access if required.
- Do not expose MongoDB port 27017 or the Node.js application port 3000 publicly.
- Store SSH private keys and cloud credentials securely.
4. Configure the Server with Ansible
Update ansible/inventory.ini with the public IP of your EC2 instance and the correct SSH private-key path. For example:
[app_servers]
todo_server ansible_host=YOUR_EC2_PUBLIC_IP ansible_user=ubuntu ansible_ssh_private_key_file=~/.ssh/todo_deploy_key
Run the playbook from the project root using your installed Ansible:
ansible-playbook -i ansible/inventory.ini ansible/playbook.yml
If Ansible is not installed locally, you can run it in a container. Adjust the key mount path and container image to match your environment. Verify the playbook's compatibility with the target Ubuntu version before running it.
5. Configure GitHub Actions Secrets
In your GitHub repository, open Settings → Secrets and variables → Actions and add the secrets expected by .github/workflows/deploy.yml.
Secret	Purpose
DOCKERHUB_USERNAME	Docker Hub username
DOCKERHUB_TOKEN	Docker Hub access token with required permissions
SERVER_HOST	Public IP or hostname of the EC2 instance
SERVER_USER	SSH username, commonly ubuntu for Ubuntu EC2 images
SSH_PRIVATE_KEY	Private-key contents used by the workflow to connect to EC2


The secret names above must match the names referenced in the workflow. Never put secret values in the README, source code, logs, or commits.
6. Deploy with GitHub Actions
After reviewing the workflow and configuring the required secrets, commit and push your changes:
git add .
git commit -m "feat: automate cloud deployment"
git push origin main
The intended workflow is:
1. Trigger on a push to the configured branch.
2. Build the application Docker image.
3. Authenticate to Docker Hub and push the image.
4. Connect to the EC2 host over SSH.
5. Update the production Compose and Nginx configuration files.
6. Pull the updated image and recreate the services.
Check the Actions tab in GitHub to review job logs and troubleshoot failures.
Deployment note: Recreating containers with Docker Compose is not automatically a zero-downtime rolling deployment. Actual downtime depends on the deployment strategy, health checks, and traffic-routing setup. Describe the pipeline as automated deployment unless zero downtime has been tested and demonstrated.

7. Test the Production Deployment
Replace YOUR_EC2_PUBLIC_IP with the current public IP or DNS name of your server:
curl -i http://YOUR_EC2_PUBLIC_IP/todos
Create a Todo:
curl -X POST http://YOUR_EC2_PUBLIC_IP/todos \
  -H "Content-Type: application/json" \
  -d '{"title":"Live task on AWS"}'
Retrieve Todo items:
curl http://YOUR_EC2_PUBLIC_IP/todos
Connect to the instance and inspect the services:
ssh -i ~/.ssh/todo_deploy_key ubuntu@YOUR_EC2_PUBLIC_IP
From the deployment directory on the server:
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f nginx
docker compose -f docker-compose.prod.yml logs -f api
Use the actual service names and deployment directory from your Compose configuration. If a request fails, check the EC2 security group, instance status, Nginx configuration, container health, application logs, and MongoDB connectivity.
8. Troubleshooting
Symptom	What to check
Cannot connect to the server	EC2 state, public IP, route, security-group rules, SSH key and username
HTTP connection refused or times out	Port 80 ingress, Nginx container status and host port mapping
Nginx returns 502 Bad Gateway	Upstream service name, API port, container network and API logs
API cannot connect to MongoDB	MongoDB service name, Compose network, credentials and application connection URI
Todo items disappear	Named-volume configuration and whether the volume was removed
GitHub Actions deployment fails	Secret names, SSH key format, Docker Hub permissions and workflow logs


9. Clean Up AWS Resources
When the environment is no longer needed, destroy resources created by Terraform to avoid ongoing charges:
cd terraform
terraform plan -destroy
terraform destroy
Review the destroy plan before confirming. Terraform only destroys resources managed by the current state; manually created or separately managed resources may remain. Back up any data you need before removing infrastructure or volumes.
What I Learned
- Building and running a multi-container application with Docker Compose.
- Routing external HTTP traffic through Nginx to an internal API.
- Persisting database data using Docker named volumes.
- Provisioning cloud infrastructure with Terraform.
- Automating host configuration with Ansible.
- Building a CI/CD pipeline with GitHub Actions and Docker Hub.
- Securing access to cloud hosts and troubleshooting deployment issues.
Future Improvements
- Add automated unit and API integration tests to the CI pipeline.
- Add container health checks and deployment rollback.
- Use HTTPS with managed certificates and a domain name.
- Add centralized monitoring, logging, and alerting.
- Use AWS Systems Manager or a managed secret store where appropriate.
- Improve deployment strategy to minimize or eliminate downtime.
Author
Aman Dharpure
- GitHub: AmanDharpure
- Repository: docker-todo-app
This repository documents a learning project. Deployment behavior, security, and availability depend on the actual configuration and should be verified in the target AWS environment.
