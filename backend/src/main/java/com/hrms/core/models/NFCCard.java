package com.hrms.core.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "NFC_Cards")
public class NFCCard {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cardId;

    @Column(nullable = false, unique = true)
    private String uid;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    private String status = "Active";

    private LocalDateTime issuedDate;

    public NFCCard() {}

    @PrePersist
    protected void onCreate() {
        issuedDate = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getCardId() { return cardId; }
    public void setCardId(Long cardId) { this.cardId = cardId; }
    public String getUid() { return uid; }
    public void setUid(String uid) { this.uid = uid; }
    public Employee getEmployee() { return employee; }
    public void setEmployee(Employee employee) { this.employee = employee; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getIssuedDate() { return issuedDate; }
}
