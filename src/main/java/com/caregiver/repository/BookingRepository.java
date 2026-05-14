package com.caregiver.repository;

import com.caregiver.model.Booking;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends CrudRepository<Booking, Long> {
    List<Booking> findByClientId(Long clientId);
    List<Booking> findByCaregiverId(Long caregiverId);
}