#!/usr/bin/env bash

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVICES_ORDER=(
    "user-service"
    "workspace-service"
    "storage-service"
    "template-service"
    "instance-service"
    "global-search-service"
    "activity-log-service"
    "notification-service"
    "rule-breach-service"
    "process-service"
    "gantt-service"
    "preview-service"
    "dashboard-service"
    "cron-service"
    "semantic-service"
    "mock-service"
    "gateway-service"
    "mock-model-api"
)

# Services that don't need building
SKIP_BUILD_SERVICES=("nginx" "mailer-service")

# Services that should run ONLY after others are ready
SERVICES_DEPEND_ON_OTHERS=(
    "gateway-service"
    "mock-service"
    "cron-service"
)

# Logs directory
LOGS_DIR="./build-logs"
mkdir -p "$LOGS_DIR"

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if service should be built
should_build() {
    local service=$1
    for skip in "${SKIP_BUILD_SERVICES[@]}"; do
        if [ "$service" == "$skip" ]; then
            return 1
        fi
    done
    return 0
}

# Check if service depends on others
depends_on_others() {
    local service=$1
    for depend in "${SERVICES_DEPEND_ON_OTHERS[@]}"; do
        if [ "$service" == "$depend" ]; then
            return 0
        fi
    done
    return 1
}

# Build a single service
build_service() {
    local service=$1
    local log_file="$LOGS_DIR/${service}_build.log"
    
    if ! should_build "$service"; then
        print_info "$service (skipped - uses pre-built image)"
        return 0
    fi
    
    print_info "Building $service..."
    
    if docker-compose build "$service" > "$log_file" 2>&1; then
        print_success "$service built successfully"
        return 0
    else
        print_error "$service build failed!"
        echo "See logs: $log_file"
        tail -20 "$log_file"
        return 1
    fi
}

# Run a single service
run_service() {
    local service=$1
    local log_file="$LOGS_DIR/${service}_run.log"
    
    print_info "Starting $service..."
    
    if docker-compose up -d "$service" > "$log_file" 2>&1; then
        print_success "$service started successfully"
        sleep 2
        return 0
    else
        print_error "$service failed to start!"
        echo "See logs: $log_file"
        tail -20 "$log_file"
        return 1
    fi
}

# Wait for service to be healthy
wait_for_service() {
    local service=$1
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for $service to be ready..."
    
    while [ $attempt -le $max_attempts ]; do
        if docker-compose ps "$service" | grep -q "Up"; then
            print_success "$service is ready"
            return 0
        fi
        
        echo -n "."
        sleep 2
        ((attempt++))
    done
    
    print_error "$service did not become ready in time"
    return 1
}

# Main execution
main() {
    local mode=${1:-all}
    
    print_header "Melta Docker Compose - Smart Build & Run"
    
    case "$mode" in
        build-only)
            print_header "Phase 1: Building all services"
            local failed_builds=()
            
            for service in "${SERVICES_ORDER[@]}"; do
                if ! build_service "$service"; then
                    failed_builds+=("$service")
                fi
            done
            
            if [ ${#failed_builds[@]} -gt 0 ]; then
                print_error "The following services failed to build:"
                for service in "${failed_builds[@]}"; do
                    echo "  - $service"
                done
                exit 1
            fi
            
            print_success "All services built successfully!"
            ;;
            
        run-only)
            print_header "Phase 2: Running all services (in order)"
            
            # First, run the independent services
            for service in "${SERVICES_ORDER[@]}"; do
                if ! depends_on_others "$service"; then
                    if ! run_service "$service"; then
                        print_error "Failed to start $service, continuing..."
                    fi
                    wait_for_service "$service"
                fi
            done
            
            # Then run the dependent services
            print_info "Waiting a bit for all services to stabilize..."
            sleep 5
            
            for service in "${SERVICES_ORDER[@]}"; do
                if depends_on_others "$service"; then
                    if ! run_service "$service"; then
                        print_error "Failed to start $service"
                    fi
                fi
            done
            
            # Finally, start nginx
            print_info "Starting nginx..."
            if docker-compose up -d nginx; then
                print_success "Nginx started"
            fi
            
            print_success "All services are running!"
            docker-compose ps
            ;;
            
        *)
            print_header "Phase 1: Building all services"
            local failed_builds=()
            
            for service in "${SERVICES_ORDER[@]}"; do
                if ! build_service "$service"; then
                    failed_builds+=("$service")
                fi
            done
            
            if [ ${#failed_builds[@]} -gt 0 ]; then
                print_error "The following services failed to build:"
                for service in "${failed_builds[@]}"; do
                    echo "  - $service"
                done
                exit 1
            fi
            
            print_success "All services built successfully!"
            
            print_header "Phase 2: Running all services (in dependency order)"
            
            # Run independent services first
            for service in "${SERVICES_ORDER[@]}"; do
                if ! depends_on_others "$service"; then
                    if ! run_service "$service"; then
                        print_error "Failed to start $service, continuing..."
                    fi
                    wait_for_service "$service"
                fi
            done
            
            # Wait for services to stabilize
            print_info "Waiting for all services to stabilize..."
            sleep 5
            
            # Run dependent services
            for service in "${SERVICES_ORDER[@]}"; do
                if depends_on_others "$service"; then
                    if ! run_service "$service"; then
                        print_error "Failed to start $service"
                    fi
                fi
            done
            
            # Start nginx last
            print_info "Starting nginx..."
            if docker-compose up -d nginx; then
                print_success "Nginx started"
            fi
            
            print_success "All services are running!"
            print_info "Build logs available in: $LOGS_DIR"
            docker-compose ps
            ;;
    esac
}

# Show usage
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    (no args or 'all')  - Build all services, then run them in dependency order
    build-only          - Only build services (without running)
    run-only            - Only run services (assumes they are already built)
    -h, --help          - Show this help message

Examples:
    ./scripts/build_and_run_smart.sh                # Build and run everything
    ./scripts/build_and_run_smart.sh build-only     # Just build
    ./scripts/build_and_run_smart.sh run-only       # Just run

EOF
    exit 0
fi

main "$@"