package com.caregiver.repository;

import com.caregiver.model.Review;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends CrudRepository<Review, Long> {
    List<Review> findByCaregiverId(Long caregiverId);
}
