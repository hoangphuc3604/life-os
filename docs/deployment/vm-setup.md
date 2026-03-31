# VM Deployment Guide

## 1. Create GCP VM

Create a VM instance (replace `YOUR_PROJECT_ID`):

```bash
gcloud compute instances create lifeos-vm --project=YOUR_PROJECT_ID --zone=asia-southeast1-a --machine-type=e2-medium --image-family=ubuntu-2204-lts --image-project=ubuntu-os-cloud --boot-disk-size=20GB --tags=http-server,https-server
```

Create firewall rules to allow HTTP traffic:

```bash
gcloud compute firewall-rules create allow-lifeos --allow tcp:80,tcp:443,tcp:8080 --source-ranges 0.0.0.0/0 --target-tags http-server
```

## 2. Setup VM

SSH into the VM:

```bash
gcloud compute ssh lifeos-vm --zone=asia-southeast1-a
```

Install Docker and Docker Compose:

```bash
sudo apt update && sudo apt install docker.io docker-compose-v2 -y
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

Logout and login again for group changes to take effect:

```bash
exit
```

```bash
gcloud compute ssh lifeos-vm --zone=asia-southeast1-a
```

Verify Docker installation:

```bash
docker --version
docker compose version
```

## 3. Deploy Application

Clone the repository (replace `YOUR_USERNAME`):

```bash
git clone https://github.com/YOUR_USERNAME/life-os.git
cd life-os
```

Create environment files for auth-service. Replace values as needed:

- `POSTGRES_HOST` must be `postgres` (Docker network name)
- `DATABASE_URL` host must be `postgres`
- `JWT_SECRET` must be a strong secret (min 32 characters)
- `NODE_ENV` must be `production`

```bash
cp services/auth-service/.env.example services/auth-service/.env
```

Edit `services/auth-service/.env`:

```
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=lifeos_auth
DATABASE_URL=postgresql://user:YOUR_SECURE_PASSWORD@postgres:5432/lifeos_auth?schema=public
JWT_SECRET=YOUR_STRONG_JWT_SECRET_MIN_32_CHARS
JWT_EXPIRATION=15m
PORT=3000
NODE_ENV=production
```

Create environment files for knowledge-service:

```bash
cp services/knowledge-service/.env.example services/knowledge-service/.env
```

Edit `services/knowledge-service/.env`:

```
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_USER=user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=lifeos_knowledge
DATABASE_URL=postgresql://user:YOUR_SECURE_PASSWORD@postgres:5432/lifeos_knowledge?schema=public
JWT_SECRET=YOUR_STRONG_JWT_SECRET_MIN_32_CHARS
JWT_EXPIRATION=15m
PORT=3002
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
NODE_ENV=production
```
Create a root `.env` file for docker-compose variables (e.g., your Frontend API requests):

```bash
cat <<EOF > .env
VITE_API_GATEWAY_URL=http://YOUR_DOMAIN_OR_IP/api
WEB_PORT=3001
EOF
```

Start all services:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

Check that all containers are running:

```bash
docker compose -f docker-compose.prod.yml ps
```

Check logs to verify startup:

```bash
docker compose -f docker-compose.prod.yml logs -f
```

Press `Ctrl+C` to stop following logs.

## 4. Setup Reverse Proxy (Optional)

If you want to serve the application on port 80/443 with SSL:

Install nginx on the VM:

```bash
sudo apt install nginx -y
```

Create nginx configuration:

```bash
sudo tee /etc/nginx/sites-available/lifeos > /dev/null << 'EOF'
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    # Route frontend traffic to the Web container
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Route API traffic to the API Gateway container
    location /api/ {
        proxy_pass http://localhost:8080/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF
```

Enable the site and restart nginx:

```bash
sudo ln -s /etc/nginx/sites-available/lifeos /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Setup SSL with Let's Encrypt (replace `YOUR_DOMAIN` and `YOUR_EMAIL`):

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d YOUR_DOMAIN --non-interactive --agree-tos -m YOUR_EMAIL
```

## 5. Maintenance Commands

View running containers:

```bash
docker compose -f docker-compose.prod.yml ps
```

Restart a specific service:

```bash
docker compose -f docker-compose.prod.yml restart auth-service
```

Update application (pull new code and rebuild):

```bash
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

View logs for a specific service:

```bash
docker compose -f docker-compose.prod.yml logs -f auth-service
```

Run database migrations:

```bash
docker compose -f docker-compose.prod.yml exec auth-service npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec knowledge-service npx prisma migrate deploy
```

Backup databases:

```bash
docker exec lifeos_postgres pg_dump -U user lifeos_auth > backup_auth.sql
docker exec lifeos_postgres pg_dump -U user lifeos_knowledge > backup_knowledge.sql
```

Restore databases:

```bash
docker exec -i lifeos_postgres psql -U user lifeos_auth < backup_auth.sql
docker exec -i lifeos_postgres psql -U user lifeos_knowledge < backup_knowledge.sql
```

Stop all services:

```bash
docker compose -f docker-compose.prod.yml down
```

Stop all services and remove data volumes:

```bash
docker compose -f docker-compose.prod.yml down -v
```

Clean up unused Docker resources:

```bash
docker system prune -f
```
