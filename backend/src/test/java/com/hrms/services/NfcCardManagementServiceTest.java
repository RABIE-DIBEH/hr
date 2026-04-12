package com.hrms.services;

import com.hrms.api.exception.BusinessException;
import com.hrms.api.exception.ErrorCode;
import com.hrms.core.models.Employee;
import com.hrms.core.models.NFCCard;
import com.hrms.core.repositories.EmployeeRepository;
import com.hrms.core.repositories.NFCCardRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NfcCardManagementServiceTest {

    @Mock
    private NFCCardRepository nfcCardRepository;

    @Mock
    private EmployeeRepository employeeRepository;

    private NfcCardManagementService nfcCardManagementService;

    @BeforeEach
    void setUp() {
        nfcCardManagementService = new NfcCardManagementService(nfcCardRepository, employeeRepository);
    }

    @Test
    void assignCard_ThrowsConflictWhenEmployeeAlreadyHasCard() {
        Employee employee = employee(5L);
        when(employeeRepository.findById(5L)).thenReturn(Optional.of(employee));
        when(nfcCardRepository.findByUid("NEW-UID")).thenReturn(Optional.empty());
        when(nfcCardRepository.findByEmployee_EmployeeId(5L)).thenReturn(Optional.of(new NFCCard()));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> nfcCardManagementService.assignCard(5L, "NEW-UID"));

        assertEquals(ErrorCode.INVALID_NFC_CARD, ex.getErrorCode());
        assertEquals("Employee already has an NFC card. Use replace instead.", ex.getMessage());
    }

    @Test
    void updateStatus_NormalizesStatusValue() {
        NFCCard card = new NFCCard();
        card.setStatus("Inactive");
        when(nfcCardRepository.findByEmployee_EmployeeId(5L)).thenReturn(Optional.of(card));
        when(nfcCardRepository.save(any(NFCCard.class))).thenAnswer(invocation -> invocation.getArgument(0));

        NFCCard saved = nfcCardManagementService.updateStatus(5L, "blocked");

        assertEquals("Blocked", saved.getStatus());
        verify(nfcCardRepository).save(card);
    }

    @Test
    void updateStatus_RejectsUnknownStatus() {
        NFCCard card = new NFCCard();
        when(nfcCardRepository.findByEmployee_EmployeeId(5L)).thenReturn(Optional.of(card));

        BusinessException ex = assertThrows(BusinessException.class,
                () -> nfcCardManagementService.updateStatus(5L, "paused"));

        assertEquals(ErrorCode.INVALID_NFC_CARD, ex.getErrorCode());
    }

    private Employee employee(Long employeeId) {
        return Employee.builder()
                .employeeId(employeeId)
                .fullName("Employee " + employeeId)
                .email("employee" + employeeId + "@example.com")
                .passwordHash("hash")
                .baseSalary(BigDecimal.ZERO)
                .build();
    }
}
