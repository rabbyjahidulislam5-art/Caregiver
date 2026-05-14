package com.caregiver.repository;

import com.caregiver.model.Complaint;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ComplaintRepository extends CrudRepository<Complaint, Long> {
    List<Complaint> findByStatus(String status);
    List<Complaint> findByClientId(Long clientId);
}
