package com.hrms.api;

import com.hrms.core.models.Employee;
import com.hrms.core.models.InboxMessage;
import com.hrms.security.EmployeeUserDetails;
import com.hrms.services.InboxService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class InboxControllerTest {

    @Mock
    private InboxService inboxService;

    private MockMvc mockMvc;
    private EmployeeUserDetails principal;

    @BeforeEach
    void setUp() {
        Employee employee = Employee.builder()
                .employeeId(7L)
                .fullName("Inbox User")
                .email("inbox@example.com")
                .passwordHash("secret")
                .status("Active")
                .build();
        principal = new EmployeeUserDetails(employee, "EMPLOYEE", "Operations");

        mockMvc = MockMvcBuilders.standaloneSetup(new InboxController(inboxService))
                .setControllerAdvice(new GlobalExceptionHandler())
                .setCustomArgumentResolvers(new AuthenticationPrincipalResolver(principal))
                .build();
    }

    @Test
    void getUnreadCount_ReturnsUnreadCountDtoShape() throws Exception {
        when(inboxService.getUnreadCount("EMPLOYEE", 7L)).thenReturn(3);

        mockMvc.perform(get("/api/inbox/unread-count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(3));
    }

    @Test
    void markAsRead_WhenMessageExists_ReturnsUpdatedMessage() throws Exception {
        InboxMessage message = new InboxMessage.InboxMessageBuilder()
                .title("Reminder")
                .message("Submit your timesheet")
                .targetRole("EMPLOYEE")
                .senderName("System")
                .priority("HIGH")
                .build();
        message.setMessageId(15L);
        message.setReadAt(LocalDateTime.now());

        when(inboxService.markAsRead(15L, "EMPLOYEE", 7L)).thenReturn(message);

        mockMvc.perform(put("/api/inbox/15/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.messageId").value(15))
                .andExpect(jsonPath("$.data.isRead").value(true));
    }

    @Test
    void archiveMessage_WhenMissing_Returns404() throws Exception {
        doThrow(new IllegalArgumentException("Message not found"))
                .when(inboxService).archiveMessage(42L, "EMPLOYEE", 7L);

        mockMvc.perform(put("/api/inbox/42/archive"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Message not found"));
    }

    @Test
    void deleteMessage_WhenForbidden_Returns403() throws Exception {
        doThrow(new AccessDeniedException("Access denied"))
                .when(inboxService).deleteMessage(99L, "EMPLOYEE", 7L);

        mockMvc.perform(delete("/api/inbox/99"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value("Access denied"));
    }

    private static final class AuthenticationPrincipalResolver implements HandlerMethodArgumentResolver {
        private final EmployeeUserDetails principal;

        private AuthenticationPrincipalResolver(EmployeeUserDetails principal) {
            this.principal = principal;
        }

        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(AuthenticationPrincipal.class)
                    && EmployeeUserDetails.class.isAssignableFrom(parameter.getParameterType());
        }

        @Override
        public Object resolveArgument(MethodParameter parameter,
                                      ModelAndViewContainer mavContainer,
                                      NativeWebRequest webRequest,
                                      WebDataBinderFactory binderFactory) {
            return principal;
        }
    }
}
