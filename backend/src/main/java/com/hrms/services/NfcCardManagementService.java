package com.hrms.services;

import com.hrms.api.exception.BusinessException;
import com.hrms.api.exception.ErrorCode;
import com.hrms.core.models.Employee;
import com.hrms.core.models.NFCCard;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.NFCCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;
import java.util.Optional;

@Service
public class NfcCardManagementService {

    private final NFCCardRepository nfcCardRepository;
    private final EmployeeRepository employeeRepository;

    public NfcCardManagementService(NFCCardRepository nfcCardRepository,
                                    EmployeeRepository employeeRepository) {
        this.nfcCardRepository = nfcCardRepository;
        this.employeeRepository = employeeRepository;
    }

    @Transactional(readOnly = true)
    public Optional<NFCCard> getCardForEmployee(Long employeeId) {
        return nfcCardRepository.findByEmployee_EmployeeId(employeeId);
    }

    @Transactional
    public NFCCard assignCard(Long employeeId, String rawUid) {
        Employee employee = getEmployee(employeeId);
        String uid = normalizeUid(rawUid);

        nfcCardRepository.findByUid(uid)
                .ifPresent(existing -> {
                    throw new BusinessException(ErrorCode.INVALID_NFC_CARD, "UID is already assigned to another card");
                });

        if (nfcCardRepository.findByEmployee_EmployeeId(employeeId).isPresent()) {
            throw new BusinessException(ErrorCode.INVALID_NFC_CARD, "Employee already has an NFC card. Use replace instead.");
        }

        NFCCard card = new NFCCard();
        card.setEmployee(employee);
        card.setUid(uid);
        card.setStatus("Active");
        return nfcCardRepository.save(card);
    }

    @Transactional
    public NFCCard replaceCard(Long employeeId, String rawUid) {
        Employee employee = getEmployee(employeeId);
        String uid = normalizeUid(rawUid);

        nfcCardRepository.findByUid(uid)
                .ifPresent(existing -> {
                    if (!existing.getEmployee().getEmployeeId().equals(employeeId)) {
                        throw new BusinessException(ErrorCode.INVALID_NFC_CARD, "UID is already assigned to another employee");
                    }
                });

        NFCCard card = nfcCardRepository.findByEmployee_EmployeeId(employeeId).orElseGet(() -> {
            NFCCard created = new NFCCard();
            created.setEmployee(employee);
            return created;
        });

        card.setUid(uid);
        card.setStatus("Active");
        return nfcCardRepository.save(card);
    }

    @Transactional
    public NFCCard updateStatus(Long employeeId, String rawStatus) {
        NFCCard card = nfcCardRepository.findByEmployee_EmployeeId(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NFC_CARD_NOT_FOUND, "No NFC card found for employee"));

        card.setStatus(normalizeStatus(rawStatus));
        return nfcCardRepository.save(card);
    }

    @Transactional
    public void unassignCard(Long employeeId) {
        NFCCard card = nfcCardRepository.findByEmployee_EmployeeId(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NFC_CARD_NOT_FOUND, "No NFC card found for employee"));
        nfcCardRepository.delete(card);
    }

    private Employee getEmployee(Long employeeId) {
        return employeeRepository.findById(employeeId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EMPLOYEE_NOT_FOUND, "Employee not found"));
    }

    private String normalizeUid(String uid) {
        String normalized = uid == null ? "" : uid.trim();
        if (normalized.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_NFC_CARD, "UID must not be blank");
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        return switch (normalized) {
            case "ACTIVE" -> "Active";
            case "INACTIVE" -> "Inactive";
            case "BLOCKED" -> "Blocked";
            default -> throw new BusinessException(ErrorCode.INVALID_NFC_CARD,
                    "Invalid NFC card status. Allowed values: ACTIVE, INACTIVE, BLOCKED");
        };
    }
}
