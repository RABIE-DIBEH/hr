package com.hrms.api.dto;

import com.hrms.core.models.NfcDevice;

/**
 * Typed DTO for NFC device responses.
 */
public record NfcDeviceResponseDto(
        String deviceId,
        String name,
        String status,
        String systemLoad
) {
    public static NfcDeviceResponseDto from(NfcDevice device) {
        return new NfcDeviceResponseDto(
                device.getDeviceId(),
                device.getName(),
                device.getStatus(),
                device.getSystemLoad()
        );
    }
}
