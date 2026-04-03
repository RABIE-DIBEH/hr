package com.hrms.core.models;

import jakarta.persistence.*;

@Entity
@Table(name = "nfc_devices")
public class NfcDevice {

    @Id
    private String deviceId;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String status;

    @Column
    private String systemLoad;

    public NfcDevice() {
    }

    public NfcDevice(String deviceId, String name, String status, String systemLoad) {
        this.deviceId = deviceId;
        this.name = name;
        this.status = status;
        this.systemLoad = systemLoad;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getSystemLoad() {
        return systemLoad;
    }

    public void setSystemLoad(String systemLoad) {
        this.systemLoad = systemLoad;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String deviceId;
        private String name;
        private String status;
        private String systemLoad;
        
        public Builder deviceId(String deviceId) {
            this.deviceId = deviceId;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder status(String status) {
            this.status = status;
            return this;
        }

        public Builder systemLoad(String systemLoad) {
            this.systemLoad = systemLoad;
            return this;
        }

        public NfcDevice build() {
            return new NfcDevice(deviceId, name, status, systemLoad);
        }
    }
}
