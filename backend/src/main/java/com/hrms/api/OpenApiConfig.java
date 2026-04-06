package com.hrms.api;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * OpenAPI / Swagger configuration.
 * Swagger UI is available at: /swagger-ui.html
 * OpenAPI JSON spec at: /v3/api-docs
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI hrmsOpenApi() {
        final String securitySchemeName = "BearerAuth";

        return new OpenAPI()
                .info(new Info()
                        .title("HRMS PRO API")
                        .version("1.0.0")
                        .description("Human Resources Management System with NFC-based attendance tracking. "
                                + "All endpoints (except /api/auth/login) require a JWT Bearer token "
                                + "obtained from the login endpoint.")
                        .contact(new Contact()
                                .name("HRMS Team")
                                .email("admin@hrms.com"))
                        .license(new License()
                                .name("Proprietary")
                                .url("")))
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Enter the JWT token obtained from /api/auth/login")));
    }
}
