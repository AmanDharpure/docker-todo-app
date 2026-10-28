# Automated Cloud Deployment: Containerized Todo API with Nginx Reverse Proxy, Terraform, Ansible & GitHub Actions

An end-to-end DevOps project demonstrating Infrastructure as Code (IaC), automated server configuration management, containerized multi-tier microservices, and a continuous integration / continuous deployment (CI/CD) pipeline on AWS.

---

## 🏗️ Architecture Overview
Internet (HTTP:80)│▼┌─────────────────────────────────────────────────────────────┐│ AWS EC2 (Ubuntu 22.04 LTS / ap-south-1)                     ││                                                             ││   ┌───────────────┐     Internal Docker Network             ││   │     Nginx     │────────────────────────────┐            ││   │ Reverse Proxy │                            │            ││   └───────────────┘                            ▼            ││          ▲                              ┌─────────────┐     ││          │                              │   Node.js   │     ││     Port 80 Ingress                     │   CRUD API  │     ││                                         └─────────────┘     ││                                                │            ││                                                ▼            ││                                         ┌─────────────┐     ││                                         │   MongoDB   │     ││                                         │   Database  │     ││                                         └─────────────┘     ││                                                │            ││                                         Named Docker Volume ││                                         (mongo_prod_data)   │└─────────────────────────────────────────────────────────────┘
1. **Client / Web Traffic**: Directs HTTP requests on standard port `80` to the AWS EC2 instance.
2. **Reverse Proxy (Nginx)**: Listens on port `80` and proxies traffic to the internal Node.js container (`api:3000`). Neither the Node.js API port nor MongoDB port `27017` are exposed directly to the internet.
3. **Application Layer (Node.js & Express)**: Handles RESTful CRUD routing and connects to MongoDB via Mongoose.
4. **Database Layer (MongoDB 7.0)**: Manages persistence using named Docker volumes (`mongo_data` locally, `mongo_prod_data` in production) to ensure zero data loss across container restarts or redeployments.
5. **Infrastructure as Code (Terraform)**: Declares and provisions the EC2 instance, security groups, and SSH key pairs in AWS `ap-south-1`.
6. **Configuration Management (Ansible)**: Automates package updates, Docker repository registration, Docker engine / compose installation, and user group assignments.
7. **CI/CD Pipeline (GitHub Actions)**: Builds application container images on git push, publishes to Docker Hub, connects via SSH to the server, and initiates rolling updates with Docker Compose.

---

## 🛠️ Tech Stack

| Domain | Technology / Tool |
| :--- | :--- |
| **Backend API** | Node.js, Express.js, Mongoose ODM |
| **Database** | MongoDB 7.0 |
| **Reverse Proxy** | Nginx (Alpine-based official image) |
| **Containerization** | Docker, Docker Compose (v2) |
| **Infrastructure as Code** | HashiCorp Terraform |
| **Configuration Management** | Ansible |
| **Cloud Provider** | Amazon Web Services (AWS EC2, VPC Security Groups) |
| **CI/CD Platform** | GitHub Actions |
| **Container Registry** | Docker Hub |

---

## 📂 Project Structure

```text
docker-todo-app/
├── .github/
│   └── workflows/
│       └── deploy.yml            # Automated CI/CD build, push, & deploy workflow
├── ansible/
│   ├── inventory.ini             # Server inventory configuration
│   └── playbook.yml              # Server Docker installation playbook
├── nginx/
│   └── nginx.conf                # Nginx reverse proxy routing configuration
├── terraform/
│   ├── main.tf                   # AWS EC2 & Security Group provisioning
│   ├── outputs.tf                # EC2 public IP output declaration
│   └── variables.tf              # Region and key path definitions
├── .gitignore                    # Excludes node_modules, keys, and tfstate files
├── docker-compose.yml            # Local development compose configuration
├── docker-compose.prod.yml       # Production compose configuration (with Nginx)
├── Dockerfile                    # Container build instructions for Node.js API
├── package.json                  # Node.js project manifest & dependencies
└── server.js                     # Express app setup and CRUD routes
🔌 API EndpointsAll external requests enter through port 80 via Nginx:MethodEndpointDescriptionSample Request BodyPOST/todosCreate a new todo task{"title": "Deploy to AWS"}GET/todosRetrieve all todo itemsNonePUT/todos/:idUpdate status of a todo{"completed": true}DELETE/todos/:idRemove a todo by IDNone🚀 Setup & Deployment GuidePrerequisitesDocker Desktop installed and runningAWS CLI configured (aws configure) with valid credentialsTerraform CLI (v1.5+)An SSH key pair generated at ~/.ssh/todo_deploy_keyStep 1: Local Development & VerificationClone the repository:Bashgit clone [https://github.com/AmanDharpure/docker-todo-app.git](https://github.com/AmanDharpure/docker-todo-app.git)
cd docker-todo-app
Start the local multi-container stack:Bashdocker compose up -d
Verify CRUD operations locally:Bashcurl -X POST http://localhost:3000/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Local MongoDB persistence test"}'

curl http://localhost:3000/todos
Confirm data persistence across container recreation:Bashdocker compose down
docker compose up -d
curl http://localhost:3000/todos
Step 2: Provision Cloud Infrastructure (Terraform)Navigate to the Terraform directory:Bashcd terraform
Initialize provider plugins and deploy resources:Bashterraform init
terraform apply -auto-approve
Note the generated public IP address:Plaintextserver_public_ip = "<YOUR_SERVER_PUBLIC_IP>"
Step 3: Server Configuration (Ansible)Update ansible/inventory.ini with your provisioned IP:Ini, TOML[app_servers]
todo_server ansible_host=<YOUR_SERVER_PUBLIC_IP> ansible_user=ubuntu ansible_ssh_private_key_file=/root/.ssh/todo_deploy_key
Run the playbook inside a container (resolves Windows SSH permission handling):Bashdocker run --rm \
  -v "$HOME/.ssh:/tmp/keys:ro" \
  -v "$(pwd)/ansible:/ansible" \
  -w /ansible \
  williamyeh/ansible:ubuntu18.04 \
  bash -c "mkdir -p /root/.ssh && cp /tmp/keys/todo_deploy_key /root/.ssh/todo_deploy_key && chmod 600 /root/.ssh/todo_deploy_key && ansible-playbook -i inventory.ini playbook.yml --ssh-common-args='-o StrictHostKeyChecking=no'"
Step 4: Configure GitHub SecretsAdd the following repository secrets under Settings > Secrets and variables > Actions:Secret NameDescriptionDOCKERHUB_USERNAMEYour Docker Hub account usernameDOCKERHUB_TOKENDocker Hub Personal Access Token (Read & Write permissions)SERVER_HOSTPublic IP of the deployed EC2 serverSERVER_USERServer username (ubuntu)SSH_PRIVATE_KEYContents of your private key (~/.ssh/todo_deploy_key)Step 5: Automated CI/CD DeploymentPush changes to the main branch to trigger the pipeline:Bashgit add .
git commit -m "feat: complete end-to-end cloud deployment"
git push origin main
Workflow Stages:Build & Push: Builds the production Docker image and pushes it to Docker Hub.Deploy: Authenticates via SSH into the EC2 instance, syncs docker-compose.prod.yml and nginx/nginx.conf, pulls the latest Docker image, and restarts the containers with zero downtime.🧪 Testing the Live ApplicationExecute requests against the EC2 instance on port 80:Bash# Create a task through Nginx
curl -X POST http://<YOUR_SERVER_PUBLIC_IP>/todos \
  -H "Content-Type: application/json" \
  -d '{"title": "Live task running on AWS EC2"}'

# Retrieve all tasks
curl http://<YOUR_SERVER_PUBLIC_IP>/todos
Or view the output directly in a browser at:Plaintexthttp://<YOUR_SERVER_PUBLIC_IP>/todos
To inspect container health and logs directly on the server:Bashssh -i ~/.ssh/todo_deploy_key ubuntu@<YOUR_SERVER_PUBLIC_IP>
cd ~/app
docker compose ps
docker compose logs -f nginx
🧹 Infrastructure TeardownTo avoid ongoing AWS cloud charges when the environment is no longer required:Bashcd terraform
terraform destroy -auto-approve
