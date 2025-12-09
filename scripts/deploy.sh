#!/bin/bash

set -e

ENVIRONMENT=${1:-development}
NAMESPACE="care-monitoring-${ENVIRONMENT}"

echo "Deploying to ${ENVIRONMENT} environment..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "kubectl is not installed"
    exit 1
fi

# Apply namespace
kubectl apply -f infrastructure/kubernetes/namespaces/${ENVIRONMENT}-namespace.yaml

# Apply ConfigMaps
kubectl apply -f infrastructure/kubernetes/configmaps/ -n ${NAMESPACE}

# Apply Secrets (should be created manually or via sealed-secrets)
echo "Warning: Make sure secrets are configured in ${NAMESPACE} namespace"

# Apply Deployments
kubectl apply -f infrastructure/kubernetes/deployments/ -n ${NAMESPACE}

# Apply Services
kubectl apply -f infrastructure/kubernetes/services/ -n ${NAMESPACE}

# Wait for deployments
echo "Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/api-gateway -n ${NAMESPACE} || true

echo "Deployment completed!"

