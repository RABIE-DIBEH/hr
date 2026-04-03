package com.hrms.core.repositories;

import com.hrms.core.models.NfcDevice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface NfcDeviceRepository extends JpaRepository<NfcDevice, String> {
}
