# 云平台部署指南 / Cloud Platform Deployment Guide

本指南提供在主要云平台（AWS、Google Cloud、Azure）上部署和运行生物信息学分析流程的详细说明。

## 云平台比较 / Cloud Platform Comparison

| 特性 | AWS | Google Cloud | Azure |
|------|-----|--------------|-------|
| 计算实例 | EC2 | Compute Engine | Virtual Machines |
| 容器服务 | ECS/EKS | GKE | AKS |
| 批处理服务 | Batch | Cloud Life Sciences | Batch |
| 存储服务 | S3 | Cloud Storage | Blob Storage |
| 数据库 | RDS/DocumentDB | Cloud SQL/Firestore | SQL Database/Cosmos DB |
| 生物信息工具 | HealthLake | Cloud Life Sciences | Genomics |

## AWS 部署 / AWS Deployment

### 1. 基础设施设置

#### VPC和网络配置
```bash
# 创建CloudFormation模板
cat > aws-infrastructure.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Genomics Analysis Platform Infrastructure'

Parameters:
  EnvironmentName:
    Description: Environment name prefix
    Type: String
    Default: genomics-platform

Resources:
  # VPC Configuration
  VPC:
    Type: AWS::EC2::VPC
    Properties:
      CidrBlock: 10.0.0.0/16
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-VPC

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Properties:
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-IGW

  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref VPC

  # Public Subnets
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.1.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ1

  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.2.0/24
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Public-Subnet-AZ2

  # Private Subnets
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: 10.0.3.0/24
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ1

  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Properties:
      VpcId: !Ref VPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: 10.0.4.0/24
      Tags:
        - Key: Name
          Value: !Sub ${EnvironmentName}-Private-Subnet-AZ2

  # NAT Gateways
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  NatGateway1:
    Type: AWS::EC2::NatGateway
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  # Security Groups
  WebSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub ${EnvironmentName}-Web-SG
      GroupDescription: Security group for web tier
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: 0.0.0.0/0
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: 0.0.0.0/0

  ComputeSecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Properties:
      GroupName: !Sub ${EnvironmentName}-Compute-SG
      GroupDescription: Security group for compute tier
      VpcId: !Ref VPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 0
          ToPort: 65535
          SourceSecurityGroupId: !Ref WebSecurityGroup

Outputs:
  VPC:
    Description: VPC ID
    Value: !Ref VPC
    Export:
      Name: !Sub ${EnvironmentName}-VPC-ID

  PublicSubnets:
    Description: Public subnet IDs
    Value: !Join [",", [!Ref PublicSubnet1, !Ref PublicSubnet2]]
    Export:
      Name: !Sub ${EnvironmentName}-Public-Subnets

  PrivateSubnets:
    Description: Private subnet IDs
    Value: !Join [",", [!Ref PrivateSubnet1, !Ref PrivateSubnet2]]
    Export:
      Name: !Sub ${EnvironmentName}-Private-Subnets

  WebSecurityGroup:
    Description: Web security group ID
    Value: !Ref WebSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-Web-SG

  ComputeSecurityGroup:
    Description: Compute security group ID
    Value: !Ref ComputeSecurityGroup
    Export:
      Name: !Sub ${EnvironmentName}-Compute-SG
EOF

# 部署基础设施
aws cloudformation create-stack \
  --stack-name genomics-platform-infrastructure \
  --template-body file://aws-infrastructure.yaml \
  --capabilities CAPABILITY_IAM
```

#### ECS集群配置
```bash
# 创建ECS集群配置
cat > ecs-cluster.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Description: 'ECS Cluster for Genomics Platform'

Parameters:
  EnvironmentName:
    Type: String
    Default: genomics-platform

Resources:
  # ECS Cluster
  ECSCluster:
    Type: AWS::ECS::Cluster
    Properties:
      ClusterName: !Sub ${EnvironmentName}-cluster
      CapacityProviders:
        - FARGATE
        - FARGATE_SPOT
      DefaultCapacityProviderStrategy:
        - CapacityProvider: FARGATE
          Weight: 1
        - CapacityProvider: FARGATE_SPOT
          Weight: 2

  # ECR Repository
  ECRRepository:
    Type: AWS::ECR::Repository
    Properties:
      RepositoryName: !Sub ${EnvironmentName}/genomics-pipeline

  # ECS Task Execution Role
  ECSTaskExecutionRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
      Policies:
        - PolicyName: ECRAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - ecr:GetDownloadUrlForLayer
                  - ecr:BatchGetImage
                  - ecr:BatchCheckLayerAvailability
                Resource: !GetAtt ECRRepository.Arn

  # ECS Task Role
  ECSTaskRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ecs-tasks.amazonaws.com
            Action: sts:AssumeRole
      Policies:
        - PolicyName: S3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - s3:GetObject
                  - s3:PutObject
                  - s3:DeleteObject
                  - s3:ListBucket
                Resource:
                  - !Sub "arn:aws:s3:::${EnvironmentName}-genomics-data"
                  - !Sub "arn:aws:s3:::${EnvironmentName}-genomics-data/*"
        - PolicyName: BatchAccess
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - batch:SubmitJob
                  - batch:DescribeJobs
                  - batch:TerminateJob
                Resource: "*"

Outputs:
  ECSCluster:
    Description: ECS Cluster ARN
    Value: !GetAtt ECSCluster.Arn
    Export:
      Name: !Sub ${EnvironmentName}-ECS-Cluster

  ECRRepository:
    Description: ECR Repository URI
    Value: !GetAtt ECRRepository.RepositoryUri
    Export:
      Name: !Sub ${EnvironmentName}-ECR-Repository

  ECSTaskExecutionRole:
    Description: ECS Task Execution Role ARN
    Value: !GetAtt ECSTaskExecutionRole.Arn
    Export:
      Name: !Sub ${EnvironmentName}-ECS-Execution-Role

  ECSTaskRole:
    Description: ECS Task Role ARN
    Value: !GetAtt ECSTaskRole.Arn
    Export:
      Name: !Sub ${EnvironmentName}-ECS-Task-Role
EOF
```

### 2. 应用部署

#### Docker镜像构建和推送
```bash
# 构建并推送Docker镜像
#!/bin/bash
cat > deploy-to-aws.sh << 'EOF'
#!/bin/bash

# 设置变量
AWS_REGION="us-west-2"
ECR_REPOSITORY="genomics-platform"
IMAGE_TAG="latest"

# 获取ECR登录令牌
aws ecr get-login-password --region $AWS_REGION | \
    docker login --username AWS --password-stdin $ECR_REPOSITORY.dkr.ecr.$AWS_REGION.amazonaws.com

# 构建前端镜像
docker build -t $ECR_REPOSITORY/frontend:$IMAGE_TAG -f Dockerfile.frontend .
docker tag $ECR_REPOSITORY/frontend:$IMAGE_TAG \
    $ECR_REPOSITORY.dkr.ecr.$AWS_REGION.amazonaws.com/frontend:$IMAGE_TAG
docker push $ECR_REPOSITORY.dkr.ecr.$AWS_REGION.amazonaws.com/frontend:$IMAGE_TAG

# 构建后端镜像
docker build -t $ECR_REPOSITORY/backend:$IMAGE_TAG -f backend/Dockerfile backend/
docker tag $ECR_REPOSITORY/backend:$IMAGE_TAG \
    $ECR_REPOSITORY.dkr.ecr.$AWS_REGION.amazonaws.com/backend:$IMAGE_TAG
docker push $ECR_REPOSITORY.dkr.ecr.$AWS_REGION.amazonaws.com/backend:$IMAGE_TAG

echo "Docker images pushed successfully!"
EOF

chmod +x deploy-to-aws.sh
```

#### ECS服务定义
```bash
# 创建ECS任务定义
cat > task-definition.json << 'EOF'
{
  "family": "genomics-platform",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "executionRoleArn": "arn:aws:iam::ACCOUNT_ID:role/genomics-platform-ECS-Execution-Role",
  "taskRoleArn": "arn:aws:iam::ACCOUNT_ID:role/genomics-platform-ECS-Task-Role",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/genomics-platform/backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        },
        {
          "name": "MONGODB_URI",
          "value": "mongodb://genomics-platform-docdb.cluster-xyz.docdb.us-west-2.amazonaws.com:27017/genomics"
        },
        {
          "name": "AWS_REGION",
          "value": "us-west-2"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/genomics-platform",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "backend"
        }
      }
    },
    {
      "name": "frontend",
      "image": "ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/genomics-platform/frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "VITE_API_URL",
          "value": "https://api.genomics-platform.com"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/genomics-platform",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "frontend"
        }
      }
    }
  ]
}
EOF
```

### 3. AWS Batch配置

```bash
# 创建AWS Batch环境
cat > batch-environment.yaml << 'EOF'
AWSTemplateFormatVersion: '2010-09-09'
Description: 'AWS Batch Environment for Genomics Processing'

Resources:
  # Batch Service Role
  BatchServiceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: batch.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AWSBatchServiceRole

  # Instance Role
  InstanceRole:
    Type: AWS::IAM::Role
    Properties:
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: ec2.amazonaws.com
            Action: sts:AssumeRole
      ManagedPolicyArns:
        - arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role

  InstanceProfile:
    Type: AWS::IAM::InstanceProfile
    Properties:
      Roles:
        - !Ref InstanceRole

  # Compute Environment
  ComputeEnvironment:
    Type: AWS::Batch::ComputeEnvironment
    Properties:
      Type: MANAGED
      State: ENABLED
      ServiceRole: !GetAtt BatchServiceRole.Arn
      ComputeResources:
        Type: EC2
        MinvCpus: 0
        MaxvCpus: 1000
        DesiredvCpus: 0
        InstanceTypes:
          - m5.large
          - m5.xlarge
          - m5.2xlarge
          - c5.large
          - c5.xlarge
          - c5.2xlarge
          - r5.large
          - r5.xlarge
          - r5.2xlarge
        Subnets:
          - subnet-12345678  # Replace with actual subnet IDs
          - subnet-87654321
        SecurityGroupIds:
          - sg-12345678  # Replace with actual security group ID
        InstanceRole: !GetAtt InstanceProfile.Arn
        Tags:
          Environment: genomics-platform

  # Job Queue
  JobQueue:
    Type: AWS::Batch::JobQueue
    Properties:
      JobQueueName: genomics-queue
      State: ENABLED
      Priority: 1
      ComputeEnvironmentOrder:
        - Order: 1
          ComputeEnvironment: !Ref ComputeEnvironment

Outputs:
  ComputeEnvironment:
    Description: Batch Compute Environment
    Value: !Ref ComputeEnvironment

  JobQueue:
    Description: Batch Job Queue
    Value: !Ref JobQueue
EOF
```

## Google Cloud Platform 部署

### 1. GKE集群设置

```bash
# 创建GKE集群
#!/bin/bash
cat > deploy-gcp.sh << 'EOF'
#!/bin/bash

PROJECT_ID="your-project-id"
CLUSTER_NAME="genomics-platform"
REGION="us-central1"

# 设置项目
gcloud config set project $PROJECT_ID

# 启用必要的API
gcloud services enable container.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable genomics.googleapis.com

# 创建GKE集群
gcloud container clusters create $CLUSTER_NAME \
    --region=$REGION \
    --machine-type=e2-standard-4 \
    --num-nodes=3 \
    --enable-autoscaling \
    --min-nodes=1 \
    --max-nodes=10 \
    --enable-autorepair \
    --enable-autoupgrade \
    --disk-size=100GB \
    --disk-type=pd-ssd

# 获取集群凭据
gcloud container clusters get-credentials $CLUSTER_NAME --region=$REGION

# 创建命名空间
kubectl create namespace genomics-platform
EOF

chmod +x deploy-gcp.sh
```

### 2. Kubernetes部署配置

```yaml
# kubernetes-manifests.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: genomics-config
  namespace: genomics-platform
data:
  NODE_ENV: "production"
  MONGODB_URI: "mongodb://mongodb-service:27017/genomics"
  VITE_API_URL: "https://api.genomics-platform.com"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-deployment
  namespace: genomics-platform
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: gcr.io/PROJECT_ID/genomics-backend:latest
        ports:
        - containerPort: 5000
        envFrom:
        - configMapRef:
            name: genomics-config
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-deployment
  namespace: genomics-platform
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: gcr.io/PROJECT_ID/genomics-frontend:latest
        ports:
        - containerPort: 80
        envFrom:
        - configMapRef:
            name: genomics-config
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"

---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: genomics-platform
spec:
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
  type: ClusterIP

---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: genomics-platform
spec:
  selector:
    app: frontend
  ports:
  - port: 80
    targetPort: 80
  type: LoadBalancer

---
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: genomics-ingress
  namespace: genomics-platform
  annotations:
    kubernetes.io/ingress.class: "gce"
    kubernetes.io/ingress.global-static-ip-name: "genomics-ip"
    networking.gke.io/managed-certificates: "genomics-ssl-cert"
spec:
  rules:
  - host: genomics-platform.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend-service
            port:
              number: 5000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend-service
            port:
              number: 80
```

### 3. Cloud Life Sciences配置

```yaml
# nextflow-gcp.config
params {
    google_project = 'your-project-id'
    google_region = 'us-central1'
    google_zone = 'us-central1-a'
}

profiles {
    gcp {
        process {
            executor = 'google-lifesciences'
            container = 'gcr.io/your-project-id/genomics-tools:latest'
        }
        
        google {
            project = params.google_project
            zone = params.google_zone
            region = params.google_region
            
            lifeSciences {
                // 虚拟机配置
                preemptible = true
                bootDiskSize = '50 GB'
                
                // 网络配置
                network = 'default'
                subnetwork = 'default'
                usePrivateAddress = false
            }
        }
        
        // 进程特定配置
        withName: 'FASTQC' {
            machineType = 'n1-standard-2'
            disk = '50 GB'
        }
        
        withName: 'STAR_ALIGN' {
            machineType = 'n1-highmem-8'
            disk = '200 GB'
        }
        
        withName: 'FEATURECOUNTS' {
            machineType = 'n1-standard-4'
            disk = '100 GB'
        }
    }
}
```

## Azure 部署

### 1. AKS集群设置

```bash
# 创建Azure资源
#!/bin/bash
cat > deploy-azure.sh << 'EOF'
#!/bin/bash

RESOURCE_GROUP="genomics-platform-rg"
CLUSTER_NAME="genomics-platform-aks"
LOCATION="eastus"

# 创建资源组
az group create --name $RESOURCE_GROUP --location $LOCATION

# 创建AKS集群
az aks create \
    --resource-group $RESOURCE_GROUP \
    --name $CLUSTER_NAME \
    --node-count 3 \
    --node-vm-size Standard_D4s_v3 \
    --enable-addons monitoring \
    --enable-autoscaler \
    --min-count 1 \
    --max-count 10 \
    --generate-ssh-keys

# 获取凭据
az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME

# 创建容器注册表
az acr create \
    --resource-group $RESOURCE_GROUP \
    --name genomicsplatformacr \
    --sku Basic

# 集成ACR与AKS
az aks update \
    --resource-group $RESOURCE_GROUP \
    --name $CLUSTER_NAME \
    --attach-acr genomicsplatformacr
EOF

chmod +x deploy-azure.sh
```

### 2. Azure Batch配置

```bash
# 创建Azure Batch账户
cat > azure-batch-setup.sh << 'EOF'
#!/bin/bash

RESOURCE_GROUP="genomics-platform-rg"
BATCH_ACCOUNT="genomicsbatch"
STORAGE_ACCOUNT="genomicsstorage"
LOCATION="eastus"

# 创建存储账户
az storage account create \
    --resource-group $RESOURCE_GROUP \
    --name $STORAGE_ACCOUNT \
    --location $LOCATION \
    --sku Standard_LRS

# 创建Batch账户
az batch account create \
    --resource-group $RESOURCE_GROUP \
    --name $BATCH_ACCOUNT \
    --location $LOCATION \
    --storage-account $STORAGE_ACCOUNT

# 登录Batch账户
az batch account login \
    --resource-group $RESOURCE_GROUP \
    --name $BATCH_ACCOUNT \
    --shared-key-auth

# 创建池配置文件
cat > pool-config.json << 'JSON'
{
    "id": "genomics-pool",
    "vmSize": "Standard_D4s_v3",
    "virtualMachineConfiguration": {
        "imageReference": {
            "publisher": "microsoft-azure-batch",
            "offer": "ubuntu-server-container",
            "sku": "20-04-lts",
            "version": "latest"
        },
        "nodeAgentSkuId": "batch.node.ubuntu 20.04",
        "containerConfiguration": {
            "type": "dockerCompatible"
        }
    },
    "targetDedicatedNodes": 0,
    "targetLowPriorityNodes": 10,
    "enableAutoScale": true,
    "autoScaleFormula": "$TargetDedicatedNodes = 0; $TargetLowPriorityNodes = min(10, $PendingTasks.GetSample(1 * TimeInterval_Minute, 0).GetSum());",
    "autoScaleEvaluationInterval": "PT5M"
}
JSON

# 创建池
az batch pool create --json-file pool-config.json
EOF

chmod +x azure-batch-setup.sh
```

## 监控和日志 / Monitoring and Logging

### 1. Prometheus和Grafana配置

```yaml
# monitoring.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: genomics-platform
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    scrape_configs:
    - job_name: 'kubernetes-pods'
      kubernetes_sd_configs:
      - role: pod
      relabel_configs:
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
        action: keep
        regex: true
      - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
        action: replace
        target_label: __metrics_path__
        regex: (.+)

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus
  namespace: genomics-platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:latest
        ports:
        - containerPort: 9090
        volumeMounts:
        - name: config-volume
          mountPath: /etc/prometheus
        args:
        - '--config.file=/etc/prometheus/prometheus.yml'
        - '--storage.tsdb.path=/prometheus/'
        - '--web.console.libraries=/etc/prometheus/console_libraries'
        - '--web.console.templates=/etc/prometheus/consoles'
        - '--web.enable-lifecycle'
      volumes:
      - name: config-volume
        configMap:
          name: prometheus-config

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: genomics-platform
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SECURITY_ADMIN_PASSWORD
          value: "admin123"
```

### 2. 日志聚合配置

```yaml
# logging.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: fluent-bit-config
  namespace: genomics-platform
data:
  fluent-bit.conf: |
    [SERVICE]
        Flush         1
        Log_Level     info
        Daemon        off
        Parsers_File  parsers.conf

    [INPUT]
        Name              tail
        Path              /var/log/containers/*genomics*.log
        Parser            docker
        Tag               kube.*
        Refresh_Interval  5
        Mem_Buf_Limit     50MB
        Skip_Long_Lines   On

    [FILTER]
        Name                kubernetes
        Match               kube.*
        Kube_URL            https://kubernetes.default.svc:443
        Kube_CA_File        /var/run/secrets/kubernetes.io/serviceaccount/ca.crt
        Kube_Token_File     /var/run/secrets/kubernetes.io/serviceaccount/token
        Merge_Log           On
        K8S-Logging.Parser  On
        K8S-Logging.Exclude Off

    [OUTPUT]
        Name  es
        Match *
        Host  elasticsearch-service
        Port  9200
        Index genomics-logs
```

## 成本优化 / Cost Optimization

### 1. 实例调度策略

```bash
# 成本优化脚本
cat > cost-optimization.sh << 'EOF'
#!/bin/bash

# AWS Spot实例配置
configure_spot_instances() {
    echo "配置Spot实例..."
    # 使用混合实例类型
    # 设置适当的中断处理
    # 配置自动扩缩容
}

# 资源标记
tag_resources() {
    echo "标记资源以便成本跟踪..."
    # 按项目、环境、团队标记
    # 设置成本分配标签
}

# 定期清理
cleanup_resources() {
    echo "清理未使用的资源..."
    # 删除旧的快照和镜像
    # 清理临时存储
    # 停止空闲实例
}

# 监控成本
monitor_costs() {
    echo "设置成本告警..."
    # 配置成本告警
    # 生成成本报告
    # 优化建议
}
EOF
```

### 2. 自动扩缩容配置

```yaml
# autoscaling.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: genomics-platform
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-deployment
  minReplicas: 2
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

---
apiVersion: autoscaling/v2
kind: VerticalPodAutoscaler
metadata:
  name: backend-vpa
  namespace: genomics-platform
spec:
  targetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend-deployment
  updatePolicy:
    updateMode: "Auto"
  resourcePolicy:
    containerPolicies:
    - containerName: backend
      maxAllowed:
        cpu: 2
        memory: 4Gi
      minAllowed:
        cpu: 100m
        memory: 256Mi
```

## 安全配置 / Security Configuration

### 1. 网络安全

```yaml
# network-policies.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: genomics-network-policy
  namespace: genomics-platform
spec:
  podSelector:
    matchLabels:
      app: backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - podSelector:
        matchLabels:
          app: frontend
    ports:
    - protocol: TCP
      port: 5000
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: mongodb
    ports:
    - protocol: TCP
      port: 27017
```

### 2. 密钥管理

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: genomics-secrets
  namespace: genomics-platform
type: Opaque
data:
  mongodb-password: <base64-encoded-password>
  jwt-secret: <base64-encoded-jwt-secret>
  aws-access-key: <base64-encoded-access-key>
  aws-secret-key: <base64-encoded-secret-key>

---
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: genomics-secret-store
  namespace: genomics-platform
spec:
  provider:
    aws:
      service: SecretsManager
      region: us-west-2
      auth:
        jwt:
          serviceAccountRef:
            name: external-secrets-sa
```

## 灾难恢复 / Disaster Recovery

### 1. 备份策略

```bash
# 备份脚本
cat > backup-strategy.sh << 'EOF'
#!/bin/bash

# 数据库备份
backup_database() {
    echo "备份数据库..."
    # MongoDB备份到云存储
    # 定期快照
    # 跨区域复制
}

# 代码备份
backup_code() {
    echo "备份代码和配置..."
    # Git仓库备份
    # 配置文件备份
    # 容器镜像备份
}

# 恢复测试
test_recovery() {
    echo "测试恢复流程..."
    # 定期恢复测试
    # 验证数据完整性
    # 测试故障转移
}
EOF
```

### 2. 多区域部署

```yaml
# multi-region.yaml
apiVersion: v1
kind: Service
metadata:
  name: genomics-global-lb
  annotations:
    service.beta.kubernetes.io/aws-load-balancer-type: "nlb"
    service.beta.kubernetes.io/aws-load-balancer-cross-zone-load-balancing-enabled: "true"
spec:
  type: LoadBalancer
  ports:
  - port: 80
    targetPort: 80
  selector:
    app: frontend
```

---

*更新日期: 2024年1月*