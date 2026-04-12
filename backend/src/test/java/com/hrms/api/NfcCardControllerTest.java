package com.hrms.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrms.api.dto.AssignNfcCardRequest;
import com.hrms.api.exception.BusinessException;
import com.hrms.api.exception.ErrorCode;
import com.hrms.core.models.Employee;
import com.hrms.core.models.NFCCard;
import com.hrms.services.NfcCardManagementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.math.BigDecimal;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class NfcCardControllerTest {

    @Mock
    private NfcCardManagementService nfcCardManagementService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(new NfcCardController(nfcCardManagementService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void getEmployeeCard_ReturnsNotFoundWhenCardDoesNotExist() throws Exception {
        when(nfcCardManagementService.getCardForEmployee(99L)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/nfc-cards/employees/99"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("No NFC card found for employee"));
    }

    @Test
    void assignCard_ReturnsCreatedCardPayload() throws Exception {
        Employee employee = Employee.builder()
                .employeeId(7L)
                .fullName("NFC Employee")
                .email("nfc@example.com")
                .passwordHash("hash")
                .baseSalary(BigDecimal.ZERO)
                .build();

        NFCCard card = new NFCCard();
        card.setEmployee(employee);
        card.setUid("UID-100");
        card.setStatus("Active");

        when(nfcCardManagementService.assignCard(eq(7L), anyString())).thenReturn(card);

        mockMvc.perform(post("/api/nfc-cards/employees/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignNfcCardRequest("UID-100"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.uid").value("UID-100"))
                .andExpect(jsonPath("$.data.employeeId").value(7))
                .andExpect(jsonPath("$.data.employeeName").value("NFC Employee"))
                .andExpect(jsonPath("$.data.status").value("Active"));
    }

    @Test
    void assignCard_ReturnsConflictWhenUidAlreadyAssigned() throws Exception {
        when(nfcCardManagementService.assignCard(eq(7L), anyString()))
                .thenThrow(new BusinessException(ErrorCode.INVALID_NFC_CARD, "UID is already assigned to another card"));

        mockMvc.perform(post("/api/nfc-cards/employees/7")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AssignNfcCardRequest("UID-100"))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.message").value("UID is already assigned to another card"))
                .andExpect(jsonPath("$.error").value("INVALID_NFC_CARD"));
    }
}
