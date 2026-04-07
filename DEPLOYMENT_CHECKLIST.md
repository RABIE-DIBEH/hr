# HRMS v0.9.1-stable Deployment Checklist

**Release**: v0.9.1-stable  
**Date**: April 8, 2026  
**Status**: Ready for Production Deployment

## Pre-Deployment Verification

### **✅ Backend Verification**
- [x] 86/86 tests passing
- [x] Security headers configured (CSP, X-Frame-Options, X-XSS-Protection)
- [x] Structured logging enabled
- [x] Audit logging for security events
- [x] CORS configured for frontend (localhost:5173) and Flutter web (localhost:8888)
- [x] Environment variables documented in `.env.example`

### **✅ Frontend Verification**
- [x] 23/23 tests passing
- [x] Code splitting implemented (15 lazy-loaded chunks)
- [x] Bundle size optimized (<500 KB chunks)
- [x] Lint warnings resolved (0 warnings)
- [x] Accessibility improvements (ARIA labels)

### **✅ Mobile Verification**
- [x] Source code complete (lib/, models/, screens/, services/)
- [x] Build scripts provided (`setup-mobile.sh`, `build-apk.sh`)
- [x] Platform setup documented (`PLATFORM_SETUP.md`)
- [x] NFC integration ready
- [x] API integration configured

### **✅ Infrastructure Verification**
- [x] CI/CD pipeline with all validation jobs
- [x] Checkstyle configuration for code quality
- [x] Prometheus monitoring configured
- [x] Spring Boot Actuator endpoints enabled
- [x] Operations scripts ready (backup/restore/rollback)

## Deployment Steps

### **1. Staging Deployment**
```bash
# 1.1 Pull the latest code
git checkout main
git pull origin main

# 1.2 Verify the release tag
git tag -v v0.9.1-stable

# 1.3 Deploy backend to staging
cd backend
mvn clean package
java -jar target/hrms-*.jar --spring.profiles.active=staging

# 1.4 Deploy frontend to staging
cd ../frontend
npm run build
# Deploy dist/ contents to staging server
```

### **2. Staging Validation**
- [ ] Backend starts successfully on staging
- [ ] Frontend loads without errors
- [ ] Authentication works (login/logout)
- [ ] All role-based access controls function
- [ ] NFC clock-in/out works (if hardware available)
- [ ] Leave request workflow functions
- [ ] Advance request workflow functions
- [ ] Payroll calculation works
- [ ] Reports generate correctly
- [ ] Mobile app connects to backend API

### **3. Production Deployment**
```bash
# 3.1 Create production deployment package
git archive --format=tar.gz v0.9.1-stable -o hrms-v0.9.1-stable.tar.gz

# 3.2 Deploy to production server
# Upload and extract hrms-v0.9.1-stable.tar.gz
# Configure production environment variables
# Start backend with production profile
java -jar hrms-*.jar --spring.profiles.active=production

# 3.3 Deploy frontend to production CDN/static host
```

### **4. Post-Deployment Verification**
- [ ] Monitor application logs for errors
- [ ] Verify Prometheus metrics are being collected
- [ ] Test backup/restore procedures
- [ ] Verify all API endpoints respond correctly
- [ ] Test mobile app connectivity
- [ ] Send test notifications/inbox messages
- [ ] Verify security headers are present

## Rollback Plan

### **If issues occur during deployment:**
1. **Immediate rollback**: Revert to previous stable version
2. **Database backup**: Restore from pre-deployment backup
3. **Log analysis**: Review structured logs for root cause
4. **Hotfix development**: Address critical issues

### **Rollback Commands:**
```bash
# Stop current deployment
pkill -f "java -jar hrms"

# Restore previous version
git checkout v0.9-stable
cd backend && mvn clean package
java -jar target/hrms-*.jar --spring.profiles.active=production

# Restore database if needed
./ops/backup/restore-backup.sh latest-pre-deployment-backup.sql
```

## Monitoring & Alerting

### **Key Metrics to Monitor:**
- **Application Health**: `/actuator/health` endpoint
- **Response Times**: 95th percentile < 500ms
- **Error Rate**: < 1% of requests
- **Memory Usage**: < 80% of allocated heap
- **Database Connections**: < 80% of pool size
- **JWT Authentication Success Rate**: > 99%

### **Alert Thresholds:**
- ⚠️ **Warning**: Error rate > 0.5%, response time > 300ms
- 🔴 **Critical**: Error rate > 2%, response time > 1000ms, service down

## Known Limitations

### **Mobile App:**
- Requires platform generation (`flutter create .`)
- NFC hardware required for physical testing
- APK signing required for production distribution

### **Backend:**
- Seed users have predictable passwords (upgrade on first login)
- No pagination on list endpoints (planned for v1.0)
- Response formats not fully standardized

### **Frontend:**
- No React Query/SWR (potential duplicate requests)
- Form validation duplicated from backend

## Success Criteria

### **Deployment Success:**
- [ ] Zero critical issues in first 24 hours
- [ ] All functional workflows operational
- [ ] Performance metrics within acceptable ranges
- [ ] Security monitoring active and alerting
- [ ] Backup/restore procedures validated

### **User Acceptance:**
- [ ] Key stakeholders confirm functionality
- [ ] Mobile app connectivity verified
- [ ] Reporting features meet requirements
- [ ] User feedback collected and documented

## Contact Information

### **Technical Support:**
- **Backend Issues**: Agent A (Security & Performance)
- **Frontend Issues**: Agent B (UI & Mobile)
- **Infrastructure Issues**: Agent C (DevOps & Operations)

### **Emergency Contacts:**
- **Production Outage**: Immediate rollback to v0.9-stable
- **Security Incident**: Review audit logs, contact security team
- **Data Loss**: Restore from latest backup

## Documentation References

- `OPERATIONS_RUNBOOK.md` - Detailed operations procedures
- `DEV_SETUP.md` - Development environment setup
- `PLATFORM_SETUP.md` - Mobile platform setup
- `PHASE7_FINAL_REPORT.md` - Complete Phase 7 summary
- `API_DOCS.md` - API documentation
- `AGENTS.md` - Project guidelines and conventions

---

**Deployment Approved By**:  
- [ ] Agent A (Backend & Security)  
- [ ] Agent B (Frontend & Mobile)  
- [ ] Agent C (DevOps & Infrastructure)  

**Deployment Date**: ________________  
**Deployment Status**: ✅ READY