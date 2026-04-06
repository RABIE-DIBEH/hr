package com.hrms.api;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrms.api.dto.CreateNfcDeviceRequest;
import com.hrms.api.dto.SystemMetricsDto;
import com.hrms.core.models.NfcDevice;
import com.hrms.services.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @Mock
    private AdminService adminService;

    private MockMvc mockMvc;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(new AdminController(adminService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void getMetrics_ReturnsTypedMetricsPayload() throws Exception {
        when(adminService.getSystemMetrics()).thenReturn(
                new SystemMetricsDto("25%", "1.50 GB", "99.9%", "2 days, 4 hrs, 3 mins", "System Healthy")
        );

        mockMvc.perform(get("/api/admin/metrics"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cpu").value("25%"))
                .andExpect(jsonPath("$.data.storage").value("1.50 GB"))
                .andExpect(jsonPath("$.data.uptime").value("99.9%"))
                .andExpect(jsonPath("$.data.status").value("System Healthy"));
    }

    @Test
    void addDevice_WithInvalidPayload_ReturnsValidationError() throws Exception {
        CreateNfcDeviceRequest invalidRequest = new CreateNfcDeviceRequest("", "", null, null);

        mockMvc.perform(post("/api/admin/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Validation failed"))
                .andExpect(jsonPath("$.errors.deviceId").exists())
                .andExpect(jsonPath("$.errors.name").exists());
    }

    @Test
    void addDevice_WithValidPayload_ReturnsTypedDeviceResponse() throws Exception {
        CreateNfcDeviceRequest request = new CreateNfcDeviceRequest("NFC_1234", "Gate Reader", "Online", "5%");
        NfcDevice saved = NfcDevice.builder()
                .deviceId("NFC_1234")
                .name("Gate Reader")
                .status("Online")
                .systemLoad("5%")
                .build();

        when(adminService.addNfcDevice(any(CreateNfcDeviceRequest.class))).thenReturn(saved);

        mockMvc.perform(post("/api/admin/devices")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deviceId").value("NFC_1234"))
                .andExpect(jsonPath("$.data.name").value("Gate Reader"))
                .andExpect(jsonPath("$.data.status").value("Online"))
                .andExpect(jsonPath("$.data.systemLoad").value("5%"));
    }

    @Test
    void deleteDevice_ReturnsTypedResponse() throws Exception {
        doNothing().when(adminService).deleteDevice("NFC_1234");

        mockMvc.perform(delete("/api/admin/devices/NFC_1234"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("deleted"))
                .andExpect(jsonPath("$.message").value("Device removed successfully"));
    }
}
