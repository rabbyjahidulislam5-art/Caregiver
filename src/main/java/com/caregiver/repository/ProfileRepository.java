package com.caregiver.repository;

import com.caregiver.model.Profile;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jdbc.repository.query.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProfileRepository extends CrudRepository<Profile, Long> {

    // Find profile by User ID
    Optional<Profile> findByUserId(Long userId);

    // ✅ FIXED: Find ALL Caregivers (Strictly Role = 'caregiver')
    @Query("SELECT p.* FROM profiles p JOIN users u ON p.user_id = u.user_id WHERE u.role = 'caregiver'")
    List<Profile> findAllCaregivers();

    // ✅ FIXED: Global Search (Only Profession & Role = 'caregiver')
    @Query("SELECT p.* FROM profiles p JOIN users u ON p.user_id = u.user_id WHERE u.role = 'caregiver' AND LOWER(p.profession) LIKE LOWER(CONCAT('%', :query, '%'))")
    List<Profile> searchGlobal(@Param("query") String query);

    // Advanced Filter: Professions List (Only for Caregivers)
    @Query("SELECT DISTINCT p.profession FROM profiles p JOIN users u ON p.user_id = u.user_id WHERE u.role = 'caregiver' AND p.profession IS NOT NULL AND p.profession != ''")
    List<String> findDistinctProfessions();

    // Advanced Filter: Complex Query with Role Check
    @Query("""
        SELECT DISTINCT p.* FROM profiles p 
        JOIN users u ON p.user_id = u.user_id
        LEFT JOIN schedules s ON p.user_id = s.caregiver_id 
        WHERE u.role = 'caregiver'
        AND (:profession IS NULL OR p.profession = :profession) 
        AND (:minExp IS NULL OR p.experience_years >= :minExp)
        AND (:rating IS NULL OR p.rating >= :rating)
        AND (:dayOfWeek IS NULL OR s.day_of_week = :dayOfWeek)
    """)
    List<Profile> filterCaregivers(
        @Param("profession") String profession,
        @Param("minExp") Integer minExp,
        @Param("rating") Double rating,
        @Param("dayOfWeek") String dayOfWeek
    );
}