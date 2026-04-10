# HRMS Monitoring & Observability

## Overview
This directory contains monitoring configuration and observability tools for the HRMS application. It includes Prometheus configuration for metrics collection and is designed to integrate with comprehensive monitoring solutions.

## 📊 Monitoring Architecture

```
monitoring/
├── prometheus.yml              # Prometheus server configuration
├── grafana/                    # Grafana dashboards (to be added)
│   ├── hrms-dashboard.json     # Main HRMS dashboard
│   ├── backend-dashboard.json  # Backend metrics dashboard
│   └── database-dashboard.json # Database performance dashboard
├── alerts/                     # Alert rules
│   ├── backend-alerts.yml      # Backend service alerts
│   ├── database-alerts.yml     # Database performance alerts
│   └── application-alerts.yml  # Business logic alerts
└── exporters/                  # Custom metric exporters
    ├── hrms-exporter.py        # Custom HRMS metrics exporter
    └── nfc-exporter.py         # NFC device metrics
```

## 🔧 Current Configuration

### Prometheus Configuration (`prometheus.yml`)
The current configuration sets up basic Prometheus scraping for the HRMS backend metrics endpoint.

**Features**:
- Scrapes Spring Boot Actuator metrics
- 15-second scrape interval for development
- Basic service discovery
- Ready for expansion with additional targets

**Configuration**:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'hrms-backend'
    metrics_path: '/actuator/prometheus'
    static_configs:
      - targets: ['backend:8080']
        labels:
          application: 'hrms-backend'
          environment: 'development'
```

## 🎯 Monitoring Objectives

### 1. System Health Monitoring
- **Backend Service**: Uptime, response times, error rates
- **Database**: Connection pool, query performance, locks
- **Frontend**: Page load times, JavaScript errors
- **NFC Devices**: Connectivity, scan success rates

### 2. Business Metrics
- **Employee Activity**: Login frequency, feature usage
- **Attendance**: Clock-in/out patterns, compliance rates
- **Leave Management**: Request volumes, approval times
- **Payroll**: Processing times, error rates

### 3. Security Monitoring
- **Authentication**: Failed login attempts, suspicious patterns
- **Access Control**: Unauthorized access attempts
- **Audit Logs**: Sensitive operation frequency
- **Data Changes**: Unusual modification patterns

## 🚀 Getting Started

### Prerequisites
- Docker and Docker Compose
- Basic understanding of Prometheus and metrics

### Local Development Monitoring
```bash
# Start monitoring stack with main application
docker-compose up -d backend frontend postgres prometheus

# Access Prometheus UI
open http://localhost:9090

# Check metrics endpoint
curl http://localhost:8080/actuator/prometheus | head -20
```

### Production Monitoring Setup
1. **Deploy Prometheus** in production environment
2. **Configure scraping** for all services
3. **Set up alerting** with Alertmanager
4. **Deploy Grafana** for visualization
5. **Configure dashboards** for different stakeholders

## 📈 Metrics Collection

### Spring Boot Actuator Metrics
The backend exposes metrics via Spring Boot Actuator:

**Available Endpoints**:
- `/actuator/health` - Application health status
- `/actuator/metrics` - List of available metrics
- `/actuator/prometheus` - Prometheus-formatted metrics
- `/actuator/info` - Application information

**Key Metrics Collected**:
- `http_server_requests_seconds` - HTTP request latency
- `jvm_memory_used_bytes` - JVM memory usage
- `jvm_gc_pause_seconds` - Garbage collection pauses
- `tomcat_sessions_active_current` - Active sessions
- `database_connections_active` - Database connection pool

### Custom HRMS Metrics
**To be implemented**:
- `hrms_attendance_scans_total` - NFC scan counts
- `hrms_leave_requests_total` - Leave request volumes
- `hrms_payroll_processing_seconds` - Payroll processing time
- `hrms_employee_active_count` - Active employee count
- `hrms_department_employee_count` - Employees per department

## 🚨 Alerting Configuration

### Alert Rules (Planned)
```yaml
groups:
  - name: hrms-backend
    rules:
      - alert: BackendDown
        expr: up{job="hrms-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "HRMS backend is down"
          description: "Backend service has been down for more than 1 minute"
      
      - alert: HighErrorRate
        expr: rate(http_server_requests_seconds_count{status=~"5.."}[5m]) / rate(http_server_requests_seconds_count[5m]) > 0.05
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High error rate on backend"
          description: "Error rate exceeds 5% for more than 2 minutes"
      
      - alert: HighResponseTime
        expr: histogram_quantile(0.95, rate(http_server_requests_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High response time on backend"
          description: "95th percentile response time exceeds 2 seconds"
```

### Notification Channels
- **Email**: Team notifications for critical alerts
- **Slack/Teams**: Real-time alerts for operations team
- **PagerDuty**: Escalation for critical incidents
- **SMS**: Emergency alerts for system administrators

## 📊 Dashboard Design

### Planned Grafana Dashboards

#### 1. System Overview Dashboard
- **Service Status**: Health indicators for all components
- **Resource Usage**: CPU, memory, disk, network
- **Request Rates**: HTTP requests per second
- **Error Rates**: 4xx and 5xx error percentages
- **Response Times**: P50, P95, P99 latency

#### 2. Business Metrics Dashboard
- **Employee Activity**: Daily active users, feature usage
- **Attendance Metrics**: Scan success rates, compliance
- **Leave Management**: Request volumes, approval times
- **Payroll Processing**: Batch sizes, processing duration
- **Recruitment Pipeline**: Candidate stages, conversion rates

#### 3. Database Performance Dashboard
- **Query Performance**: Slow queries, execution times
- **Connection Pool**: Active connections, wait times
- **Table Statistics**: Row counts, growth rates
- **Index Usage**: Hit rates, missing indexes
- **Lock Monitoring**: Deadlocks, wait events

#### 4. Security Dashboard
- **Authentication**: Login attempts, failure rates
- **Access Patterns**: Unusual access times/locations
- **Audit Events**: Sensitive operation frequency
- **Compliance**: Policy violations, audit requirements

## 🔍 Logging Integration

### Structured Logging
- **JSON Format**: Machine-readable log entries
- **Correlation IDs**: Request tracing across services
- **Log Levels**: DEBUG, INFO, WARN, ERROR with context
- **Audit Logs**: Separate stream for compliance

### Log Aggregation (Planned)
- **ELK Stack**: Elasticsearch, Logstash, Kibana
- **Loki**: Grafana's log aggregation system
- **Cloud Services**: AWS CloudWatch, Azure Monitor
- **On-premise**: Splunk, Graylog

## 📈 Performance Monitoring

### Application Performance Monitoring (APM)
**Key Metrics**:
- **Transaction Traces**: Detailed request/response flows
- **Database Queries**: SQL performance with execution plans
- **External Calls**: API integration performance
- **Business Transactions**: End-to-end process timing

### Infrastructure Monitoring
- **Container Metrics**: Docker/ Kubernetes resource usage
- **Network Metrics**: Latency, throughput, errors
- **Storage Metrics**: IOPS, latency, capacity
- **Security Metrics**: Vulnerability scans, compliance checks

## 🔒 Security Monitoring

### Threat Detection
- **Anomaly Detection**: Unusual patterns in user behavior
- **Intrusion Detection**: Suspicious network activity
- **Data Leakage**: Unusual data export patterns
- **Access Violations**: Permission boundary breaches

### Compliance Monitoring
- **Audit Trail**: Complete record of sensitive operations
- **Policy Enforcement**: Automated compliance checks
- **Reporting**: Scheduled compliance reports
- **Alerting**: Real-time policy violation alerts

## 🐳 Docker & Container Monitoring

### Container Metrics
- **Resource Usage**: CPU, memory, disk I/O per container
- **Network Metrics**: Bandwidth, connections, errors
- **Health Checks**: Container health status
- **Orchestration**: Service discovery, load balancing

### Docker Compose Monitoring
```yaml
# Example service with health check
services:
  backend:
    build: ./backend
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## 📋 Monitoring Checklist

### Daily Checks
- [ ] Service health status
- [ ] Error rate review
- [ ] Performance metric trends
- [ ] Security event review
- [ ] Backup status verification

### Weekly Reviews
- [ ] Capacity planning analysis
- [ ] Performance bottleneck identification
- [ ] Security vulnerability assessment
- [ ] Compliance status check
- [ ] Alert tuning and optimization

### Monthly Audits
- [ ] Monitoring coverage assessment
- [ ] Alert effectiveness review
- [ ] Dashboard usability evaluation
- [ ] Tooling cost optimization
- [ ] Process improvement planning

## 🛠️ Tooling Ecosystem

### Core Monitoring Stack
- **Prometheus**: Metrics collection and alerting
- **Grafana**: Visualization and dashboards
- **Alertmanager**: Alert routing and notification

### Complementary Tools
- **Jaeger**: Distributed tracing
- **ELK Stack**: Log aggregation and analysis
- **cAdvisor**: Container monitoring
- **node_exporter**: Host-level metrics

### Cloud-Native Options
- **AWS**: CloudWatch, X-Ray, GuardDuty
- **Azure**: Monitor, Application Insights, Sentinel
- **GCP**: Cloud Monitoring, Cloud Trace, Cloud Logging
- **Kubernetes**: Prometheus Operator, Grafana Operator

## 🔄 Maintenance & Operations

### Backup & Recovery
- **Configuration Backup**: Regular backup of monitoring configs
- **Data Retention**: Policy-based metric and log retention
- **Disaster Recovery**: Monitoring system recovery procedures
- **Testing**: Regular testing of monitoring and alerting

### Scaling Considerations
- **Vertical Scaling**: Increase resources for monitoring components
- **Horizontal Scaling**: Add more instances for high availability
- **Federation**: Hierarchical Prometheus setup for large deployments
- **Sharding**: Distribute monitoring load across multiple systems

### Cost Optimization
- **Data Retention**: Adjust retention periods based on needs
- **Sampling**: Implement sampling for high-volume metrics
- **Compression**: Enable compression for stored data
- **Tiered Storage**: Move old data to cheaper storage

## 📞 Support & Troubleshooting

### Common Issues

#### Prometheus Not Scraping
```bash
# Check Prometheus status
docker-compose logs prometheus

# Check target health
curl http://localhost:9090/api/v1/targets

# Check backend metrics endpoint
curl http://localhost:8080/actuator/prometheus
```

#### High Resource Usage
```bash
# Check Prometheus resource usage
docker stats hrms-prometheus

# Check scrape interval
cat monitoring/prometheus.yml | grep scrape_interval

# Check number of time series
curl -s http://localhost:9090/api/v1/status/tsdb | jq '.stats'
```

#### Alert Not Firing
```bash
# Check alert rules
curl http://localhost:9090/api/v1/rules

# Check alert expression
curl http://localhost:9090/api/v1/query?query=up

# Check Alertmanager configuration
docker-compose logs alertmanager
```

### Debugging Tips
1. **Check Logs**: Review component logs for errors
2. **Verify Configuration**: Validate YAML configuration files
3. **Test Endpoints**: Manually test metrics endpoints
4. **Check Network**: Verify connectivity between components
5. **Review Metrics**: Use Prometheus UI to explore metrics

## 📄 Documentation & Resources

### Useful Links
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [Spring Boot Actuator](https://docs.spring.io/spring-boot/docs/current/reference/html/actuator.html)
- [Monitoring Best Practices](https://sre.google/sre-book/monitoring-distributed-systems/)

### Training Resources
- **Online Courses**: Prometheus and Grafana training
- **Workshops**: Hands-on monitoring workshops
- **Community**: Local meetups and user groups
- **Certifications**: Monitoring tool certifications

## 🤝 Contributing to Monitoring

### Adding New Metrics
1. **Identify Need**: Determine what to monitor and why
2. **Implement Collection**: Add metric collection in application
3. **Configure Scraping**: Update Prometheus configuration
4. **Create Dashboard**: Build Grafana visualization
5. **Set Up Alerts**: Define alert rules if needed
6. **Document**: Update monitoring documentation

### Improving Dashboards
1. **Gather Requirements**: Understand user needs
2. **Design Layout**: Plan dashboard organization
3. **Implement Panels**: Add charts and visualizations
4. **Test Usability**: Validate with end users
5. **Iterate**: Continuously improve based on feedback

## 📄 License
Proprietary software. All rights reserved.

---

*Last Updated: April 2026*  
*Version: 1.0.0-stable*  
*Phase 9: Structural & Operational Lockdown - COMPLETE*