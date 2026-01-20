# MusicFlow - Kubernetes Deployment Guide

## 📋 Prerequisites

- Kubernetes cluster (GKE, EKS, AKS, or local with minikube)
- kubectl configured to access your cluster
- Docker images pushed to a container registry (Docker Hub, GCR, ECR)

## 🚀 Quick Deploy

```bash
# 1. Build and push Docker images
docker build -t your-registry/musicflow-backend:latest ./backend
docker build -t your-registry/musicflow-frontend:latest ./frontend
docker push your-registry/musicflow-backend:latest
docker push your-registry/musicflow-frontend:latest

# 2. Update image names in deployment.yaml
# Replace 'musicflow-backend:latest' with 'your-registry/musicflow-backend:latest'

# 3. Apply Kubernetes manifests
kubectl apply -f k8s/deployment.yaml

# 4. Verify deployment
kubectl get pods -n musicflow
kubectl get services -n musicflow
kubectl get ingress -n musicflow
```

## 📊 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KUBERNETES CLUSTER                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                     INGRESS                          │   │
│  │         (nginx-ingress + TLS termination)           │   │
│  └─────────────────┬───────────────────┬───────────────┘   │
│                    │                   │                    │
│          /api, /socket.io           /                      │
│                    │                   │                    │
│  ┌─────────────────▼───┐   ┌──────────▼───────────────┐   │
│  │   BACKEND SERVICE   │   │   FRONTEND SERVICE       │   │
│  │    (ClusterIP)      │   │    (ClusterIP)           │   │
│  └─────────┬───────────┘   └────────────┬─────────────┘   │
│            │                            │                   │
│  ┌─────────▼───────────┐   ┌────────────▼─────────────┐   │
│  │  BACKEND PODS (2-10)│   │  FRONTEND PODS (2)       │   │
│  │  - Node.js API      │   │  - Nginx + React SPA     │   │
│  │  - Socket.io        │   │                          │   │
│  │  - HPA Autoscaling  │   │                          │   │
│  └─────────────────────┘   └──────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Configuration

### Environment Variables

Create a ConfigMap for environment variables:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: musicflow-config
  namespace: musicflow
data:
  NODE_ENV: "production"
  BACKEND_URL: "https://musicflow.example.com/api"
```

### Secrets

Create secrets for sensitive data:

```bash
kubectl create secret generic musicflow-secrets \
  --from-literal=FIREBASE_API_KEY=your-key \
  --from-literal=CLERK_SECRET_KEY=your-key \
  -n musicflow
```

## 📈 Scaling

The backend uses HPA (Horizontal Pod Autoscaler):

- **Min replicas:** 2
- **Max replicas:** 10
- **Scale up:** When CPU > 70% or Memory > 80%

```bash
# Check HPA status
kubectl get hpa -n musicflow

# Manual scaling
kubectl scale deployment musicflow-backend --replicas=5 -n musicflow
```

## 🔍 Monitoring

```bash
# View logs
kubectl logs -f deployment/musicflow-backend -n musicflow

# View pod status
kubectl describe pods -n musicflow

# Port forward for local testing
kubectl port-forward svc/musicflow-frontend 8080:80 -n musicflow
```

## 🗑️ Cleanup

```bash
# Delete all resources
kubectl delete namespace musicflow
```

## 🌐 Production Checklist

- [ ] Configure proper domain in Ingress
- [ ] Set up cert-manager for TLS certificates
- [ ] Configure resource limits based on load testing
- [ ] Set up monitoring (Prometheus + Grafana)
- [ ] Configure log aggregation (ELK/Loki)
- [ ] Set up CI/CD pipeline for deployments
