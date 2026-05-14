import { Router } from 'express';
import * as booking from '../controllers/booking.controller';
import * as caregiver from '../controllers/caregiver.controller';
import * as complaint from '../controllers/complaint.controller';
import * as review from '../controllers/review.controller';
import * as schedule from '../controllers/schedule.controller';
import * as admin from '../controllers/admin.controller';

const router = Router();

// === Booking Routes (matches Java BookingController) ===
router.post('/book', booking.createBooking);
router.get('/bookings/caregiver/:caregiverId/pending', booking.getPendingBookings);
router.post('/bookings/:bookingId/accept', booking.acceptBooking);
router.post('/bookings/:bookingId/reject', booking.rejectBooking);
router.post('/bookings/:bookingId/complete', booking.completeBooking);
router.get('/bookings/caregiver/:caregiverId/history', booking.getCaregiverHistory);
router.get('/bookings/caregiver/:caregiverId/accepted', booking.getCaregiverAccepted);
router.get('/bookings/active/:clientId', booking.getClientActiveBookings);
router.get('/bookings/history/:clientId', booking.getClientHistory);

// === Caregiver Routes (matches Java CaregiverController) ===
router.get('/caregivers', caregiver.getCaregivers);
router.get('/caregivers/search', caregiver.searchCaregivers);
router.get('/caregivers/professions', caregiver.getDistinctProfessions);
router.get('/caregivers/filter', caregiver.filterCaregivers);
router.put('/update-profile/:userId', caregiver.updateProfile);

// === Complaint Routes (matches Java ComplaintController) ===
router.post('/complaints/submit', complaint.submitComplaint);
router.get('/complaints/all', complaint.getAllComplaints);
router.get('/complaints/history/:clientId', complaint.getClientComplaints);
router.post('/complaints/reply', complaint.replyToComplaint);
router.get('/complaints/pending', complaint.getPendingComplaints);

// === Review Routes (matches Java ReviewController) ===
router.post('/reviews', review.createReview);
router.get('/caregivers/:caregiverId/reviews', review.getCaregiverReviews);

// === Schedule Routes (matches Java ScheduleController) ===
router.post('/schedule/add', schedule.addSchedule);
router.get('/schedule/:caregiverId', schedule.getSchedules);
router.delete('/schedule/:scheduleId', schedule.deleteSchedule);

// === Admin Routes (matches Java AdminController) ===
router.get('/admin/users', admin.getAllUsers);
router.delete('/admin/users/:id', admin.deleteUser);
router.get('/admin/pending-caregivers', admin.getPendingCaregivers);
router.put('/admin/approve/:profileId', admin.approveCaregiver);
router.get('/admin/requests/pending', admin.getPendingBookingRequests);
router.post('/admin/requests/:id/:action', admin.reviewBookingRequest);
router.get('/admin/complaints', admin.getAllComplaints);
router.put('/admin/complaints/:id/reply', admin.replyToComplaint);
router.get('/admin/audit-logs', admin.getAuditLogs);
router.get('/admin/stats', admin.getStats);

// === Self-Service Account Deletion ===
router.delete('/account/delete/:userId', admin.deleteSelf);

export default router;
