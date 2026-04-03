package com.hrms.core.models;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "Recruitment_Requests")
public class RecruitmentRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;

    @Column(name = "national_id", nullable = false, length = 50, unique = true)
    private String nationalId;

    @Column(name = "address", nullable = false, length = 500)
    private String address;

    @Column(name = "job_description", nullable = false, length = 300)
    private String jobDescription;

    @Column(name = "department", nullable = false, length = 100)
    private String department;

    @Column(name = "age", nullable = false)
    private Integer age;

    @Column(name = "insurance_number", length = 50)
    private String insuranceNumber;

    @Column(name = "health_number", length = 50)
    private String healthNumber;

    @Column(name = "military_service_status", nullable = false, length = 50)
    private String militaryServiceStatus;

    @Column(name = "marital_status", nullable = false, length = 20)
    private String maritalStatus;

    @Column(name = "number_of_children")
    private Integer numberOfChildren;

    @Column(name = "mobile_number", nullable = false, length = 20)
    private String mobileNumber;

    @Column(name = "expected_salary", nullable = false, precision = 12, scale = 2)
    private BigDecimal expectedSalary;

    @Column(name = "requested_by", nullable = false)
    private Long requestedBy;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "manager_note", length = 500)
    private String managerNote;

    @Column(name = "requested_at")
    private LocalDateTime requestedAt;

    @Column(name = "processed_at")
    private LocalDateTime processedAt;

    @Column(name = "approved_by")
    private Long approvedBy;

    // No-arg constructor (JPA requirement)
    public RecruitmentRequest() {
    }

    // All-args constructor
    public RecruitmentRequest(String fullName, String nationalId, String address,
                              String jobDescription, String department, Integer age,
                              String insuranceNumber, String healthNumber,
                              String militaryServiceStatus, String maritalStatus,
                              Integer numberOfChildren, String mobileNumber,
                              BigDecimal expectedSalary, Long requestedBy) {
        this.fullName = fullName;
        this.nationalId = nationalId;
        this.address = address;
        this.jobDescription = jobDescription;
        this.department = department;
        this.age = age;
        this.insuranceNumber = insuranceNumber;
        this.healthNumber = healthNumber;
        this.militaryServiceStatus = militaryServiceStatus;
        this.maritalStatus = maritalStatus;
        this.numberOfChildren = numberOfChildren;
        this.mobileNumber = mobileNumber;
        this.expectedSalary = expectedSalary;
        this.requestedBy = requestedBy;
        this.status = "Pending";
        this.requestedAt = LocalDateTime.now();
    }

    @PrePersist
    protected void onCreate() {
        if (this.requestedAt == null) {
            this.requestedAt = LocalDateTime.now();
        }
        if (this.status == null) {
            this.status = "Pending";
        }
    }

    // Getters and Setters
    public Long getRequestId() {
        return requestId;
    }

    public void setRequestId(Long requestId) {
        this.requestId = requestId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getNationalId() {
        return nationalId;
    }

    public void setNationalId(String nationalId) {
        this.nationalId = nationalId;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getJobDescription() {
        return jobDescription;
    }

    public void setJobDescription(String jobDescription) {
        this.jobDescription = jobDescription;
    }

    public String getDepartment() {
        return department;
    }

    public void setDepartment(String department) {
        this.department = department;
    }

    public Integer getAge() {
        return age;
    }

    public void setAge(Integer age) {
        this.age = age;
    }

    public String getInsuranceNumber() {
        return insuranceNumber;
    }

    public void setInsuranceNumber(String insuranceNumber) {
        this.insuranceNumber = insuranceNumber;
    }

    public String getHealthNumber() {
        return healthNumber;
    }

    public void setHealthNumber(String healthNumber) {
        this.healthNumber = healthNumber;
    }

    public String getMilitaryServiceStatus() {
        return militaryServiceStatus;
    }

    public void setMilitaryServiceStatus(String militaryServiceStatus) {
        this.militaryServiceStatus = militaryServiceStatus;
    }

    public String getMaritalStatus() {
        return maritalStatus;
    }

    public void setMaritalStatus(String maritalStatus) {
        this.maritalStatus = maritalStatus;
    }

    public Integer getNumberOfChildren() {
        return numberOfChildren;
    }

    public void setNumberOfChildren(Integer numberOfChildren) {
        this.numberOfChildren = numberOfChildren;
    }

    public String getMobileNumber() {
        return mobileNumber;
    }

    public void setMobileNumber(String mobileNumber) {
        this.mobileNumber = mobileNumber;
    }

    public BigDecimal getExpectedSalary() {
        return expectedSalary;
    }

    public void setExpectedSalary(BigDecimal expectedSalary) {
        this.expectedSalary = expectedSalary;
    }

    public Long getRequestedBy() {
        return requestedBy;
    }

    public void setRequestedBy(Long requestedBy) {
        this.requestedBy = requestedBy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getManagerNote() {
        return managerNote;
    }

    public void setManagerNote(String managerNote) {
        this.managerNote = managerNote;
    }

    public LocalDateTime getRequestedAt() {
        return requestedAt;
    }

    public void setRequestedAt(LocalDateTime requestedAt) {
        this.requestedAt = requestedAt;
    }

    public LocalDateTime getProcessedAt() {
        return processedAt;
    }

    public void setProcessedAt(LocalDateTime processedAt) {
        this.processedAt = processedAt;
    }

    public Long getApprovedBy() {
        return approvedBy;
    }

    public void setApprovedBy(Long approvedBy) {
        this.approvedBy = approvedBy;
    }

    // Manual Builder
    public static class RecruitmentRequestBuilder {
        private String fullName;
        private String nationalId;
        private String address;
        private String jobDescription;
        private String department;
        private Integer age;
        private String insuranceNumber;
        private String healthNumber;
        private String militaryServiceStatus;
        private String maritalStatus;
        private Integer numberOfChildren;
        private String mobileNumber;
        private BigDecimal expectedSalary;
        private Long requestedBy;

        public RecruitmentRequestBuilder fullName(String fullName) {
            this.fullName = fullName;
            return this;
        }

        public RecruitmentRequestBuilder nationalId(String nationalId) {
            this.nationalId = nationalId;
            return this;
        }

        public RecruitmentRequestBuilder address(String address) {
            this.address = address;
            return this;
        }

        public RecruitmentRequestBuilder jobDescription(String jobDescription) {
            this.jobDescription = jobDescription;
            return this;
        }

        public RecruitmentRequestBuilder department(String department) {
            this.department = department;
            return this;
        }

        public RecruitmentRequestBuilder age(Integer age) {
            this.age = age;
            return this;
        }

        public RecruitmentRequestBuilder insuranceNumber(String insuranceNumber) {
            this.insuranceNumber = insuranceNumber;
            return this;
        }

        public RecruitmentRequestBuilder healthNumber(String healthNumber) {
            this.healthNumber = healthNumber;
            return this;
        }

        public RecruitmentRequestBuilder militaryServiceStatus(String militaryServiceStatus) {
            this.militaryServiceStatus = militaryServiceStatus;
            return this;
        }

        public RecruitmentRequestBuilder maritalStatus(String maritalStatus) {
            this.maritalStatus = maritalStatus;
            return this;
        }

        public RecruitmentRequestBuilder numberOfChildren(Integer numberOfChildren) {
            this.numberOfChildren = numberOfChildren;
            return this;
        }

        public RecruitmentRequestBuilder mobileNumber(String mobileNumber) {
            this.mobileNumber = mobileNumber;
            return this;
        }

        public RecruitmentRequestBuilder expectedSalary(BigDecimal expectedSalary) {
            this.expectedSalary = expectedSalary;
            return this;
        }

        public RecruitmentRequestBuilder requestedBy(Long requestedBy) {
            this.requestedBy = requestedBy;
            return this;
        }

        public RecruitmentRequest build() {
            return new RecruitmentRequest(fullName, nationalId, address, jobDescription,
                    department, age, insuranceNumber, healthNumber, militaryServiceStatus,
                    maritalStatus, numberOfChildren, mobileNumber, expectedSalary, requestedBy);
        }
    }
}
