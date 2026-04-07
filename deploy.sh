#!/bin/bash

# Deployment script for HRMS
set -e

echo "=== HRMS Deployment Script ==="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    print_warning "Not running as root. Some operations may require sudo."
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi
print_status "Docker is installed"

if ! docker compose version &> /dev/null; then
    print_error "Docker Compose is not available."
    exit 1
fi
print_status "Docker Compose is available"

# Check if .env exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Creating from .env.example..."
    cp .env.example .env
    print_status "Created .env file. Please edit it with your configuration."
    exit 1
fi
print_status ".env file exists"

# Parse command line arguments
ACTION=${1:-"up"}
ENVIRONMENT=${2:-"production"}

case $ACTION in
    "up"|"start")
        echo
        echo "Starting HRMS in $ENVIRONMENT mode..."
        if [ "$ENVIRONMENT" = "development" ]; then
            docker compose -f docker-compose.yml -f docker-compose.dev.yml up -d
        else
            docker compose up -d
        fi
        print_status "Services started"
        ;;
        
    "down"|"stop")
        echo
        echo "Stopping HRMS..."
        docker compose down
        print_status "Services stopped"
        ;;
        
    "restart")
        echo
        echo "Restarting HRMS..."
        docker compose restart
        print_status "Services restarted"
        ;;
        
    "build")
        echo
        echo "Building HRMS images..."
        docker compose build
        print_status "Images built"
        ;;
        
    "logs")
        echo
        echo "Showing logs..."
        docker compose logs -f
        ;;
        
    "status")
        echo
        echo "Service status:"
        docker compose ps
        ;;
        
    "update")
        echo
        echo "Updating HRMS..."
        docker compose pull
        docker compose up -d
        docker system prune -f
        print_status "Update completed"
        ;;
        
    "backup")
        echo
        echo "Creating database backup..."
        TIMESTAMP=$(date +%Y%m%d_%H%M%S)
        docker compose exec -T postgres pg_dump -U hrms_user hrms > backup_${TIMESTAMP}.sql
        print_status "Backup created: backup_${TIMESTAMP}.sql"
        ;;
        
    "help"|*)
        echo
        echo "Usage: $0 [command] [environment]"
        echo
        echo "Commands:"
        echo "  up, start    - Start services (default)"
        echo "  down, stop   - Stop services"
        echo "  restart      - Restart services"
        echo "  build        - Build Docker images"
        echo "  logs         - Show logs"
        echo "  status       - Show service status"
        echo "  update       - Update and restart services"
        echo "  backup       - Create database backup"
        echo "  help         - Show this help"
        echo
        echo "Environments:"
        echo "  production   - Production mode (default)"
        echo "  development  - Development mode with hot reload"
        echo
        echo "Examples:"
        echo "  $0 up           # Start in production mode"
        echo "  $0 start development  # Start in development mode"
        echo "  $0 backup       # Create database backup"
        ;;
esac

echo
print_status "Deployment script completed"