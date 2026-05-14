document.addEventListener('DOMContentLoaded', async () => {
    // 1. GLOBAL: Handle Toast & Sidebar
    const user = JSON.parse(localStorage.getItem('user'));
    const toast = document.getElementById('toast');

    if (toast) {
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3000);

        if (user && user.userId) {
            try {
                // PHASE 1: BLOCKING USER FETCH
                await loadSidebarData(user.userId);

                // PHASE 2: ROLE-BASED EXECUTION
                const path = window.location.pathname;

                if (path.includes('caregiver_dashboard')) {
                    await loadPendingRequests(user.userId);
                    setInterval(() => loadPendingRequests(user.userId), 10000);
                }
                else if (path.includes('client_dashboard')) {
                    await loadActiveBookings(user.userId);
                    setInterval(() => loadActiveBookings(user.userId), 10000);
                }
                else if (path.includes('admin_dashboard')) {
                    await loadAdminPendingRequests();
                    document.getElementById('permissionsSection').style.display = 'block';
                    setInterval(loadAdminPendingRequests, 10000);
                }

            } catch (error) {
                console.error("CRITICAL INITIALIZATION ERROR:", error);
            }
        } else {
            const publicPages = ['login.html', 'register.html', 'index.html'];
            const isPublic = publicPages.some(p => window.location.pathname.includes(p));
            if (!isPublic) window.location.href = 'login.html';
        }
    }

    // 2. LOGIN LOGIC
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                if (response.ok) {
                    const data = await response.json();
                    localStorage.setItem('user', JSON.stringify(data));
                    if (data.role === 'caregiver') window.location.href = 'caregiver_dashboard.html';
                    else if (data.role === 'client') window.location.href = 'client_dashboard.html';
                    else window.location.href = 'admin_dashboard.html';
                } else { alert('Invalid Credentials!'); }
            } catch (error) { console.error(error); }
        });
    }

    // 3. REGISTER
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const roleToggle = document.getElementById('roleToggle');
        if (roleToggle) roleToggle.addEventListener('change', (e) => document.getElementById('caregiverFields').style.display = e.target.value === 'caregiver' ? 'block' : 'none');
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(registerForm);
            const data = Object.fromEntries(formData.entries());
            try {
                // 1. Register User
                const res = await fetch('/api/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                if (res.ok) {
                    // 2. Silent Login to get User ID
                    const loginRes = await fetch('/api/login', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: data.email, password: data.password })
                    });

                    if (loginRes.ok) {
                        const userData = await loginRes.json();
                        // 3. Upload Image if exists
                        await handleProfilePictureUpload(userData.userId, 'registerProfileImage');
                    }

                    alert('Registered Successfully!');
                    window.location.href = 'login.html';
                } else {
                    const txt = await res.text();
                    alert('Registration Failed: ' + txt);
                }
            } catch (e) { alert('Network Error: ' + e.message); }
        });
    }

    // 4. HOME PAGE GRID
    const caregiverGrid = document.querySelector('.caregiver-grid');
    if (caregiverGrid) {
        const cacheKey = 'caregivers_list';
        const cachedData = localStorage.getItem(cacheKey);



        if (cachedData) {
            renderCaregivers(JSON.parse(cachedData));
        } else {
            caregiverGrid.innerHTML = '<p>Loading caregivers...</p>';
        }

        fetch('/api/caregivers')
            .then(res => res.json())
            .then(data => {
                localStorage.setItem(cacheKey, JSON.stringify(data));
                renderCaregivers(data);
            })
            .catch(err => {
                console.error(err);
                if (!cachedData) caregiverGrid.innerHTML = '<p>Error loading caregivers.</p>';
            });
    }

    // Update Profile Form
    const updateForm = document.getElementById('updateForm');
    if (updateForm) {
        updateForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('user'));
            const formData = new FormData(updateForm);
            const data = Object.fromEntries(formData.entries());

            alert('Updating...');
            closeUpdateModal();

            try {
                // 1. Upload Image First
                await handleProfilePictureUpload(user?.userId, 'updateProfileImage');

                // 2. Update Profile Data
                const res = await fetch(`/api/update-profile/${user?.userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                if (res.ok) {
                    loadSidebarData(user?.userId);
                    alert('Profile Updated!');
                } else {
                    alert('Update failed');
                }
            } catch (err) { console.error(err); alert('Error updating profile'); }
        });
    }

    // Add Schedule Form
    const addScheduleForm = document.getElementById('addScheduleForm');
    if (addScheduleForm) {
        addScheduleForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('user'));
            const data = {
                caregiverId: user?.userId,
                dayOfWeek: document.getElementById('schDay').value,
                startTime: document.getElementById('schStart').value,
                endTime: document.getElementById('schEnd').value
            };

            const list = document.getElementById('scheduleList');
            const tempId = 'temp-' + Date.now();
            const newItem = `
            <li id="${tempId}" style="border-bottom: 1px solid #ddd; padding: 5px; display: flex; justify-content: space-between; opacity: 0.7;">
                <span>${data.dayOfWeek}: ${data.startTime} - ${data.endTime} (Saving...)</span>
            </li>`;
            list.insertAdjacentHTML('beforeend', newItem);

            const res = await fetch('/api/schedule/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
            if (res.ok) {
                document.getElementById(tempId).remove();
                loadMySchedule(user?.userId);
            } else {
                document.getElementById(tempId).remove();
                alert('Failed to add schedule');
            }
        });
    }

    // Review Form
    const reviewForm = document.getElementById('reviewForm');
    if (reviewForm) {
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('user'));
            const caregiverId = document.getElementById('reviewCaregiverId').value;
            const rating = document.getElementById('reviewRating').value;
            const comment = document.getElementById('reviewComment').value;

            if (!caregiverId) { alert('Please select a caregiver.'); return; }

            const data = {
                clientId: user?.userId,
                caregiverId: caregiverId,
                rating: rating,
                comment: comment
            };

            document.getElementById('reviewModal').style.display = 'none';
            alert('Review Submitted! Thank you.');

            try {
                const res = await fetch('/api/reviews', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
                if (res.ok) {
                    reviewForm.reset();
                } else {
                    alert('Failed to submit review backend.');
                }
            } catch (err) { console.error(err); alert('Error submitting review.'); }
        });
    }

    // Complaint Form (Client)
    const complaintForm = document.getElementById('complaintForm');
    if (complaintForm) {
        complaintForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const user = JSON.parse(localStorage.getItem('user'));
            const caregiverId = document.getElementById('complaintCaregiverId').value;
            const desc = document.getElementById('complaintDesc').value;

            if (!caregiverId) return;

            const data = {
                clientId: user?.userId,
                caregiverId: caregiverId,
                description: desc
            };

            document.getElementById('complaintModal').style.display = 'none';
            alert('Submitting Complaint...');

            try {
                const res = await fetch('/api/complaints/submit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data)
                });

                if (res.ok) {
                    alert('Complaint submitted. We will review it shortly.');
                    complaintForm.reset();
                } else {
                    const txt = await res.text();
                    alert('Error: ' + txt);
                }
            } catch (err) { console.error(err); alert('Network Error'); }
        });
    }

    // Admin Add User Form
    const adminAddUserForm = document.getElementById('adminAddUserForm');
    if (adminAddUserForm) {
        adminAddUserForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fd = new FormData(adminAddUserForm);
            const data = Object.fromEntries(fd.entries());

            alert('Creating User...');

            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (res.ok) { loadAdminUsers(); adminAddUserForm.reset(); }
            else alert('Failed');
        });
    }
});

// --- HELPER FUNCTIONS ---

function loadPendingRequests(userId) {
    if (!userId) return Promise.resolve();

    const container = document.getElementById('pendingRequestsList');
    if (!container) return Promise.resolve();

    const cacheKey = `pending_requests_${userId}`;
    const cachedData = localStorage.getItem(cacheKey);

    const render = (bookings) => {
        if (!bookings || bookings.length === 0) {
            container.innerHTML = '<p>No pending requests.</p>';
            return;
        }

        container.innerHTML = bookings.map(b => `
            <div class="request-card" id="booking-${b?.bookingId}">
                <p><strong>Date:</strong> ${b?.serviceDate ? new Date(b.serviceDate).toLocaleDateString() : 'N/A'} at ${b?.serviceDate ? new Date(b.serviceDate).toLocaleTimeString() : 'N/A'}</p>
                <p><strong>Status:</strong> <span style="color: orange; font-weight: bold;">${b?.status}</span></p>
                <div style="margin-top: 10px;">
                    <button class="btn-accept" onclick="updateBookingStatus('${b?.bookingId}', 'accept')">Accept</button>
                    <button class="btn-reject" onclick="updateBookingStatus('${b?.bookingId}', 'reject')">Reject</button>
                </div>
            </div>
        `).join('');
    };

    if (cachedData) {
        render(JSON.parse(cachedData));
    }

    return fetch(`/api/bookings/caregiver/${userId}/pending`)
        .then(res => res.json())
        .then(bookings => {
            if (!bookings) return;
            localStorage.setItem(cacheKey, JSON.stringify(bookings));
            render(bookings);
        })
        .catch(err => {
            console.error(err);
            if (!cachedData) container.innerHTML = '<p>Error loading requests.</p>';
        });
}

function updateBookingStatus(bookingId, action) {
    if (!confirm(`Are you sure you want to ${action} this booking?`)) return;

    const card = document.getElementById(`booking-${bookingId}`);
    if (card) {
        card.style.opacity = '0.5';
        card.style.pointerEvents = 'none';
    }

    fetch(`/api/bookings/${bookingId}/${action}`, { method: 'POST' })
        .then(res => {
            if (res.ok) {
                if (card) card.remove();
                const user = JSON.parse(localStorage.getItem('user'));
                if (user?.userId) loadPendingRequests(user.userId);
            } else {
                alert('Operation failed');
                if (card) {
                    card.style.opacity = '1';
                    card.style.pointerEvents = 'auto';
                }
            }
        })
        .catch(err => {
            console.error(err);
            if (card) { card.style.opacity = '1'; card.style.pointerEvents = 'auto'; }
        });
}

function loadSidebarData(userId) {
    if (!userId) return Promise.resolve();

    const cacheKey = `profile_${userId}`;
    const cached = localStorage.getItem(cacheKey);

    const fillData = (data) => {
        if (document.getElementById('profileName')) document.getElementById('profileName').textContent = data?.fullName || "User";
        if (document.getElementById('profilePhone')) document.getElementById('profilePhone').textContent = data?.phone || "";
        if (document.getElementById('profileEmail')) document.getElementById('profileEmail').textContent = data?.email || "";
        if (document.getElementById('profileAddress')) document.getElementById('profileAddress').textContent = data?.address || "N/A";
        if (document.getElementById('profileProfession')) document.getElementById('profileProfession').textContent = data?.profession || "";
        if (document.getElementById('profileImage')) {
            const img = document.getElementById('profileImage');
            img.src = data?.profilePictureUrl || 'https://via.placeholder.com/100';
            img.classList.add('profile-force-square');
            // Force inline style to bypass cache issues
            img.style.width = '100px';
            img.style.height = '100px';
            img.style.borderRadius = '0';
            img.style.objectFit = 'cover';
        }
        window.currentProfileData = data;
    }

    if (cached) fillData(JSON.parse(cached));

    return fetch(`/api/profile/${userId}`).then(res => res.json()).then(data => {
        if (!data) return;
        localStorage.setItem(cacheKey, JSON.stringify(data));
        fillData(data);
    }).catch(e => console.error("Error loading profile", e));
}

function openUpdateModal() {
    document.getElementById('updateModal').style.display = "block";
    if (window.currentProfileData) {
        const names = (window.currentProfileData?.fullName || '').split(' ');
        if (document.getElementById('upFirstName')) document.getElementById('upFirstName').value = names[0] || '';
        if (document.getElementById('upLastName')) document.getElementById('upLastName').value = names.slice(1).join(' ') || '';
        if (document.getElementById('upPhone')) document.getElementById('upPhone').value = window.currentProfileData?.phone || '';
        if (document.getElementById('upAddress')) document.getElementById('upAddress').value = window.currentProfileData?.address || '';
        if (document.getElementById('upProfession')) document.getElementById('upProfession').value = window.currentProfileData?.profession || '';
    }
}
function closeUpdateModal() { document.getElementById('updateModal').style.display = "none"; }

function openScheduleModal() {
    document.getElementById('scheduleModal').style.display = "block";
    const user = JSON.parse(localStorage.getItem('user'));
    loadMySchedule(user?.userId);
}
function closeScheduleModal() { document.getElementById('scheduleModal').style.display = "none"; }

function loadMySchedule(userId) {
    const list = document.getElementById('scheduleList');
    if (!list) return;

    const cacheKey = `schedule_${userId}`;
    const cached = localStorage.getItem(cacheKey);

    const render = (data) => {
        list.innerHTML = (data && data.length) ? data.map(s => `
            <li id="sch-${s?.scheduleId}" style="border-bottom: 1px solid #ddd; padding: 5px; display: flex; justify-content: space-between;">
                <span>${s?.dayOfWeek}: ${s?.startTime} - ${s?.endTime}</span>
                <button onclick="deleteSchedule('${s?.scheduleId}')" style="color:red;border:none;background:none;cursor:pointer;">X</button>
            </li>`).join('') : '<li>No slots added.</li>';
    };

    if (cached && list.innerHTML === '') render(JSON.parse(cached));
    else if (!cached) list.innerHTML = 'Loading...';

    fetch(`/api/schedule/${userId}`).then(res => res.json()).then(data => {
        localStorage.setItem(cacheKey, JSON.stringify(data));
        render(data);
    });
}
function deleteSchedule(id) {
    if (confirm('Delete?')) {
        const el = document.getElementById(`sch-${id}`);
        if (el) el.remove();

        fetch(`/api/schedule/${id}`, { method: 'DELETE' })
            .then(() => {
                const user = JSON.parse(localStorage.getItem('user'));
                if (user) loadMySchedule(user.userId);
            });
    }
}

window.onclick = function (event) {
    if (event.target == document.getElementById('updateModal')) closeUpdateModal();
    if (event.target == document.getElementById('scheduleModal')) closeScheduleModal();
    if (event.target == document.getElementById('historyModal')) document.getElementById('historyModal').style.display = 'none';
    if (event.target == document.getElementById('reviewModal')) document.getElementById('reviewModal').style.display = 'none';
    if (event.target == document.getElementById('reviewsListModal')) document.getElementById('reviewsListModal').style.display = 'none';
    if (event.target == document.getElementById('myReviewsModal')) document.getElementById('myReviewsModal').style.display = 'none';
    if (event.target == document.getElementById('complaintModal')) document.getElementById('complaintModal').style.display = 'none';
}

function bookCaregiver(caregiverId) {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) { alert("Please login."); window.location.href = 'login.html'; return; }
    if (confirm('Confirm booking?')) {
        alert('Request Sent! (Optimistic)');

        fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId: user.userId, caregiverId: caregiverId, serviceDate: new Date().toISOString() })
        }).then(res => {
            if (res.ok) {
                // Success
            } else {
                alert('Actually failed... please retry.');
            }
        });
    }
}

function loadActiveBookings(clientId) {
    if (!clientId) return Promise.resolve();

    const container = document.getElementById('activeBookingsContainer');
    if (!container) return Promise.resolve();

    const cacheKey = `active_bookings_${clientId}`;
    const cached = localStorage.getItem(cacheKey);

    const render = (bookings) => {
        if (!bookings || bookings.length === 0) {
            container.innerHTML = '<p>No active bookings currently.</p>';
            return;
        }
        container.innerHTML = bookings.map(b => `
            <div class="card" style="border-left: 5px solid #6a1b9a;">
                <h4>${b?.caregiverName || 'Unknown'}</h4>
                <p><strong>Service:</strong> ${b?.profession || 'N/A'}</p>
                <p><strong>Date:</strong> ${b?.serviceDate ? new Date(b.serviceDate).toLocaleDateString() : ''}</p>
                <p><strong>Time:</strong> ${b?.serviceDate ? new Date(b.serviceDate).toLocaleTimeString() : ''}</p>
                <span style="background: #e1bee7; padding: 2px 6px; border-radius: 4px; font-size: 0.8em; color: #4a148c;">Today's Caregiver</span>
                <button class="btn-primary" style="margin-top: 10px; background-color: #d32f2f; width: 100%;" onclick="openComplaintForm('${b?.caregiverId}')">Complaint</button>
            </div>
        `).join('');
    };

    if (cached) render(JSON.parse(cached));
    else container.innerHTML = '<p>Loading active bookings...</p>';

    return fetch(`/api/bookings/active/${clientId}`)
        .then(res => res.json())
        .then(bookings => {
            if (!bookings) return;
            localStorage.setItem(cacheKey, JSON.stringify(bookings));
            render(bookings);
        })
        .catch(err => {
            if (!cached) container.innerHTML = '<p>Error loading active bookings.</p>';
            console.error(err);
        });
}

function openComplaintForm(caregiverId) {
    if (!document.getElementById('complaintModal')) {
        alert('Complaint system not enabled on this page.');
        return;
    }
    document.getElementById('complaintCaregiverId').value = caregiverId;
    document.getElementById('complaintModal').style.display = 'block';
}

function openHistoryModal() {
    const modal = document.getElementById('historyModal');
    const list = document.getElementById('historyList');
    const user = JSON.parse(localStorage.getItem('user'));

    modal.style.display = 'block';

    const cacheKey = `history_${user?.userId}`;
    const cached = localStorage.getItem(cacheKey);

    const render = (bookings) => {
        if (!bookings || bookings.length === 0) {
            list.innerHTML = '<p>No request history found.</p>';
            return;
        }
        list.innerHTML = bookings.map(b => `
            <div style="border-bottom: 1px solid #ddd; padding: 10px; cursor: pointer;" onclick="showRequestDetails('${b?.bookingId}', '${b?.caregiverName}', '${b?.profession}', '${b?.status}', '${b?.serviceDate}', '${b?.address}')">
                <div style="display: flex; justify-content: space-between;">
                    <strong>${b?.caregiverName} (${b?.profession})</strong>
                    <span style="font-weight: bold; color: ${b?.status === 'accepted' ? 'green' : (b?.status === 'rejected' ? 'red' : 'orange')}">${(b?.status || '').toUpperCase()}</span>
                </div>
                <small>${b?.serviceDate ? new Date(b.serviceDate).toLocaleString() : ''}</small>
            </div>
        `).join('');
    };

    if (cached) render(JSON.parse(cached));
    else list.innerHTML = 'Loading history...';

    fetch(`/api/bookings/history/${user?.userId}`)
        .then(res => res.json())
        .then(bookings => {
            localStorage.setItem(cacheKey, JSON.stringify(bookings));
            render(bookings);
        })
        .catch(err => { if (!cached) list.innerHTML = '<p>Error loading history.</p>'; });
}

function showRequestDetails(id, name, prof, status, date, address) {
    alert(`Request Details:\n\nTo: ${name}\nProfession: ${prof}\nStatus: ${status}\nDate: ${new Date(date).toLocaleString()}\nCaregiver Address: ${address}`);
}

function openReviewModal() {
    document.getElementById('reviewModal').style.display = 'block';
    const select = document.getElementById('reviewCaregiverId');
    const user = JSON.parse(localStorage.getItem('user'));

    const cacheKey = `history_${user?.userId}`;
    const cached = localStorage.getItem(cacheKey);

    if (cached) {
        populateReviewDropdown(JSON.parse(cached), select);
    } else {
        select.innerHTML = '<option>Loading...</option>';
    }

    fetch(`/api/bookings/history/${user?.userId}`)
        .then(res => res.json())
        .then(bookings => {
            localStorage.setItem(cacheKey, JSON.stringify(bookings));
            populateReviewDropdown(bookings, select);
        })
        .catch(e => { if (!cached) select.innerHTML = '<option>Error loading list</option>'; });
}

function populateReviewDropdown(bookings, selectElement) {
    const uniqueCaregivers = {};
    if (bookings && bookings.length) {
        bookings.forEach(b => {
            if (b?.caregiverId && !uniqueCaregivers[b.caregiverId]) {
                uniqueCaregivers[b.caregiverId] = { id: b.caregiverId, name: b.caregiverName };
            }
        });
    }

    const options = Object.values(uniqueCaregivers).map(c =>
        `<option value="${c.id}">${c.name}</option>`
    ).join('');

    selectElement.innerHTML = options || '<option value="">No past caregivers found.</option>';
}

function searchCaregivers() {
    const query = document.getElementById('searchInput').value;
    const grid = document.querySelector('.caregiver-grid');
    grid.innerHTML = 'Searching...';

    fetch(`/api/caregivers/search?profession=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(caregivers => {
            if (caregivers.length === 0) {
                grid.innerHTML = '<h3 style="text-align: center; width: 100%; color: #6a1b9a;">No result found</h3>';
                return;
            }
            renderCaregivers(caregivers); // Reuse existing render function
        })
        .catch(error => {
            console.error('Error searching:', error);
            grid.innerHTML = '<p>Error searching caregivers.</p>';
        });
}

function loadCaregiverReviews(caregiverId, containerElement) {
    if (!containerElement) return;

    const cacheKey = `reviews_${caregiverId}`;
    const cached = localStorage.getItem(cacheKey);

    const render = (reviews) => {
        if (reviews && reviews.length > 0) {
            const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
            containerElement.innerHTML = `<p class="rating-display" style="color: #ff9800; font-weight: bold;">★ ${avg.toFixed(1)} (${reviews.length} Reviews)</p>`;
        } else {
            containerElement.innerHTML = `<p class="rating-display" style="color: #888; font-size: 0.9em;">No reviews yet</p>`;
        }
    };

    if (cached) render(JSON.parse(cached));

    fetch(`/api/caregivers/${caregiverId}/reviews`)
        .then(res => res.json())
        .then(reviews => {
            localStorage.setItem(cacheKey, JSON.stringify(reviews));
            render(reviews);
        });
}

function viewCaregiverReviews(caregiverId) {
    const modal = document.getElementById('reviewsListModal');
    const list = document.getElementById('reviewsListContainer');
    if (!modal || !list) return;

    modal.style.display = 'block';

    const cacheKey = `reviews_${caregiverId}`;
    const cached = localStorage.getItem(cacheKey);

    const render = (reviews) => {
        if (!reviews || reviews.length === 0) {
            list.innerHTML = '<p>No reviews yet.</p>';
            return;
        }
        list.innerHTML = reviews.map(r => `
            <div style="border-bottom: 1px solid #ddd; padding: 10px;">
                <div style="display: flex; justify-content: space-between;">
                    <strong>${r?.reviewerName || 'Anonymous'}</strong>
                    <span style="color: #ff9800;">${'★'.repeat(r?.rating)}</span>
                </div>
                <p style="margin: 5px 0;">${r?.comment}</p>
                <small style="color: #888;">${r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</small>
            </div>
        `).join('');
    };

    if (cached) render(JSON.parse(cached));
    else list.innerHTML = 'Loading...';

    fetch(`/api/caregivers/${caregiverId}/reviews`)
        .then(res => res.json())
        .then(reviews => {
            localStorage.setItem(cacheKey, JSON.stringify(reviews));
            render(reviews);
        })
        .catch(err => { if (!cached) list.innerHTML = '<p>Error loading reviews.</p>'; });
}

function openMyReviewsModal() {
    const modal = document.getElementById('myReviewsModal');
    const list = document.getElementById('myReviewsList');
    const summary = document.getElementById('myReviewsSummary');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!modal || !list || !user) return;

    modal.style.display = 'block';

    const cacheKey = `my_reviews_${user?.userId}`;
    const cached = localStorage.getItem(cacheKey);

    const render = (reviews) => {
        if (!reviews || reviews.length === 0) {
            list.innerHTML = '<p>You have no reviews yet.</p>';
            summary.innerHTML = 'No Ratings Yet';
            return;
        }

        const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
        summary.innerHTML = `Average Rating: ${avg.toFixed(1)} <span style="color: #ff9800;">★</span> (${reviews.length} Reviews)`;

        list.innerHTML = reviews.map(r => `
            <div style="border-bottom: 1px solid #ddd; padding: 15px; background: #fafafa; margin-bottom: 10px; border-radius: 5px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; font-size: 1.1em;">${r?.reviewerName || 'Client'}</span>
                    <span style="color: #ff9800; font-weight: bold;">${'★'.repeat(r?.rating)}</span>
                </div>
                <p style="margin: 10px 0; font-style: italic;">"${r?.comment}"</p>
                <small style="color: #888; display: block; text-align: right;">${r?.createdAt ? new Date(r.createdAt).toLocaleDateString() : ''}</small>
            </div>
        `).join('');
    };

    if (cached) render(JSON.parse(cached));
    else list.innerHTML = 'Loading reviews...';

    fetch(`/api/caregivers/${user?.userId}/reviews`)
        .then(res => res.json())
        .then(reviews => {
            localStorage.setItem(cacheKey, JSON.stringify(reviews));
            render(reviews);
        })
        .catch(err => { if (!cached) list.innerHTML = '<p>Error loading your reviews.</p>'; });
}

function loadAdminBookingPermissions() {
    hideAllAdminSections();
    document.getElementById('permissionsSection').style.display = 'block';

    const list = document.getElementById('adminPendingList');
    const cacheKey = 'admin_pending_requests';
    const cached = localStorage.getItem(cacheKey);

    const render = (bookings) => {
        if (!bookings || bookings.length === 0) {
            list.innerHTML = '<p>No pending permissions.</p>';
            return;
        }
        list.innerHTML = bookings.map(b => `
            <div class="request-card" id="admin-req-${b?.bookingId}">
                <div>
                    <strong>Booking ID:</strong> ${b?.bookingId}<br>
                    <span>Status: ${b?.status}</span>
                </div>
                <div>
                    <button class="btn-accept" onclick="adminReviewRequest('${b?.bookingId}', 'approve')">Approve</button>
                    <button class="btn-reject" onclick="adminReviewRequest('${b?.bookingId}', 'reject')">Reject</button>
                </div>
            </div>
        `).join('');
    };

    if (cached) render(JSON.parse(cached));
    else list.innerHTML = 'Loading...';

    return fetch('/api/admin/requests/pending')
        .then(res => res.json())
        .then(bookings => {
            if (!bookings) return;
            localStorage.setItem(cacheKey, JSON.stringify(bookings));
            render(bookings);
        })
        .catch(err => { if (!cached) list.innerHTML = '<p>Error loading permissions.</p>'; });
}

function adminReviewRequest(id, action) {
    if (!confirm('Confirm ' + action + '?')) return;

    const el = document.getElementById(`admin-req-${id}`);
    if (el) el.remove();

    fetch(`/api/admin/requests/${id}/${action}`, { method: 'POST' })
        .then(res => {
            if (res.ok) {
                loadAdminPendingRequests();
            }
            else {
                alert('Error');
            }
        });
}

function loadComplaints() {
    hideAllAdminSections();
    const section = document.getElementById('complaintsSection');
    if (section) section.style.display = 'block';

    const list = document.getElementById('complaintsList');
    if (!list) return;

    list.innerHTML = '<p>Loading complaints...</p>';

    fetch('/api/complaints/all')
        .then(res => res.json())
        .then(complaints => {
            if (!complaints || complaints.length === 0) {
                list.innerHTML = '<p>No complaints found.</p>';
                return;
            }

            list.innerHTML = complaints.map(c => `
                <div class="card" style="border-left: 4px solid #d32f2f; margin-bottom: 20px; padding: 20px;">
                    <div style="display: flex; gap: 30px; flex-wrap: wrap; margin-bottom: 15px;">
                        <!-- Left Side: Client -->
                        <div style="flex: 1; min-width: 250px;">
                            <h4 style="margin-top: 0; color: #555; border-bottom: 2px solid #ddd; padding-bottom: 5px;">Reported By (Client)</h4>
                            <div style="line-height: 1.6;">
                                <div><strong>Name:</strong> ${c.clientName || 'Unknown'}</div>
                                <div><strong>Email:</strong> ${c.clientEmail || 'N/A'}</div>
                                <div><strong>Phone:</strong> ${c.clientPhone || 'N/A'}</div>
                            </div>
                            <input type="hidden" value="${c.clientId}">
                        </div>

                        <!-- Right Side: Caregiver -->
                        <div style="flex: 1; min-width: 250px;">
                            <h4 style="margin-top: 0; color: #555; border-bottom: 2px solid #ddd; padding-bottom: 5px;">Against (Caregiver)</h4>
                            <div style="line-height: 1.6;">
                                <div><strong>Name:</strong> ${c.caregiverName || 'Unknown'}</div>
                                <div><strong>Email:</strong> ${c.caregiverEmail || 'N/A'}</div>
                                <div><strong>Phone:</strong> ${c.caregiverPhone || 'N/A'}</div>
                            </div>
                            <input type="hidden" value="${c.caregiverId}">
                        </div>
                    </div>

                    <!-- Bottom Section -->
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 6px;">
                        <p style="margin-top: 0;"><strong>Issue:</strong><br>${c.description}</p>
                        <p><strong>Status:</strong> 
                            <span style="padding: 4px 8px; border-radius: 4px; color: white; background-color: ${c.status === 'REVIEWED' ? '#4caf50' : '#ff9800'}">
                                ${c.status}
                            </span>
                        </p>
                        <small style="color: #888;">Date: ${c.date ? new Date(c.date).toLocaleString() : 'N/A'}</small>
                    </div>
                    
                    ${c.adminReply
                    ? `<div style="background:#e8f5e9; padding: 8px; margin-top: 10px; border-radius: 4px; border-left: 3px solid green;">
                            <strong>Admin Reply:</strong> ${c.adminReply}
                       </div>`
                    : `<div style="margin-top: 10px; border-top: 1px solid #eee; padding-top: 10px;">
                               <input type="text" id="reply-${c.id}" placeholder="Type reply..." style="padding: 8px; width: 70%; border: 1px solid #ccc; border-radius: 4px;">
                               <button onclick="replyToComplaint('${c.id}')" class="btn-primary" style="padding: 8px 15px;">Reply</button>
                           </div>`
                }
                </div>
            `).join('');
        })
        .catch(e => {
            console.error(e);
            list.innerHTML = '<p>Error loading complaints.</p>';
        });
}

function replyToComplaint(id) {
    const input = document.getElementById('reply-' + id);
    if (!input || !input.value.trim()) { alert('Please type a reply'); return; }

    fetch('/api/complaints/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complaintId: id, reply: input.value.trim() })
    }).then(res => {
        if (res.ok) {
            alert('Reply sent!');
            loadComplaints();
        } else {
            alert('Error sending reply');
        }
    });
}

function showUserManagement() {
    hideAllAdminSections();
    document.getElementById('userMgmtSection').style.display = 'block';
    loadAdminUsers();
}

function loadAdminUsers() {
    const list = document.getElementById('adminUserList');
    const cacheKey = 'admin_users';
    const cached = localStorage.getItem(cacheKey);

    const render = (users) => {
        list.innerHTML = (users && users.length) ? users.map(u => `
            <div id="user-${u?.userId}" style="border-bottom: 1px solid #eee; padding: 5px; display: flex; justify-content: space-between;">
                <span>${u?.username} (${u?.role}) - ${u?.email}</span>
                <button onclick="adminDeleteUser('${u?.userId}')" style="color:red;">Delete</button>
            </div>
        `).join('') : '<p>No users found.</p>';
    };

    if (cached) render(JSON.parse(cached));

    fetch('/api/admin/users').then(res => res.json()).then(users => {
        localStorage.setItem(cacheKey, JSON.stringify(users));
        render(users);
    });
}
function adminDeleteUser(id) {
    if (confirm('Delete user?')) {
        document.getElementById('user-' + id).remove();
        fetch('/api/admin/users/' + id, { method: 'DELETE' });
    }
}
function hideAllAdminSections() {
    if (document.getElementById('permissionsSection')) document.getElementById('permissionsSection').style.display = 'none';
    if (document.getElementById('userMgmtSection')) document.getElementById('userMgmtSection').style.display = 'none';
    if (document.getElementById('complaintsSection')) document.getElementById('complaintsSection').style.display = 'none';
}

function loadAcceptedBookings() {
    const user = JSON.parse(localStorage.getItem('user'));
    const container = document.getElementById('acceptedBookingsContainer');
    const list = document.getElementById('acceptedBookingsList');

    // Toggle visibility
    if (container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }

    // Hide other sections if needed
    document.getElementById('pendingRequestsContainer').style.display = 'none';
    container.style.display = 'block';

    list.innerHTML = 'Loading accepted jobs...';

    fetch(`/api/bookings/caregiver/${user.userId}/accepted`)
        .then(res => res.json())
        .then(bookings => {
            if (!bookings || bookings.length === 0) {
                list.innerHTML = '<p>No accepted jobs found.</p>';
                return;
            }

            list.innerHTML = bookings.map(b => `
                <div class="request-card" style="border-left: 5px solid #6a1b9a; flex-direction: column; align-items: flex-start;">
                    <h4 style="margin: 0 0 10px 0; color: #6a1b9a;">Client: ${b.clientName || 'Unknown'}</h4>
                    <div style="width: 100%; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <strong>Phone:</strong> ${b.clientPhone || 'N/A'}<br>
                            <strong>Date:</strong> ${new Date(b.serviceDate).toLocaleString()}
                        </div>
                        <div>
                            <strong>Address:</strong><br>
                            ${b.clientAddress || 'N/A'}
                        </div>
                    </div>
                </div>
            `).join('');
        })
        .catch(err => {
            console.error(err);
            list.innerHTML = '<p>Error loading jobs.</p>';
        });
}

function loadServiceHistory() {
    const user = JSON.parse(localStorage.getItem('user'));
    const container = document.getElementById('serviceHistoryContainer');
    const list = document.getElementById('serviceHistoryList');

    // Toggle visibility
    if (container && container.style.display === 'block') {
        container.style.display = 'none';
        return;
    }

    // Hide other sections
    if (document.getElementById('pendingRequestsContainer'))
        document.getElementById('pendingRequestsContainer').style.display = 'none';
    if (document.getElementById('acceptedBookingsContainer'))
        document.getElementById('acceptedBookingsContainer').style.display = 'none';

    if (container) container.style.display = 'block';
    if (list) list.innerHTML = '<p style="color:#6a1b9a;">Loading history...</p>';

    console.log("Fetching service history for user:", user.userId);

    fetch(`/api/bookings/caregiver/${user.userId}/history`)
        .then(res => res.json())
        .then(bookings => {
            console.log("Data received:", bookings);

            if (!bookings || bookings.length === 0) {
                if (list) list.innerHTML = '<p>No service history found.</p>';
                return;
            }

            list.innerHTML = bookings.map(b => {
                const status = (b.status || '').toUpperCase();
                const isAssigned = status === 'APPROVED_BY_ADMIN' || status.includes('ASSIGNED') || status.includes('APPROVED');
                const isCompleted = status === 'COMPLETED';

                if (isAssigned) {
                    // CONDITION A: ASSIGNED (Purple Highlight)
                    return `
                        <div class="request-card" style="border-left: 5px solid #6a1b9a; background: #f3e5f5; flex-direction: column; align-items: flex-start;">
                            <h4 style="margin: 0 0 10px 0; color: #6a1b9a; font-weight: bold;">
                                You have been assigned to this client by Admin
                            </h4>
                            <div style="width: 100%; margin-bottom: 10px;">
                                <strong>Client:</strong> ${b.clientName || 'Unknown'}<br>
                                <strong>Phone:</strong> ${b.clientPhone || 'N/A'}<br>
                                <strong>Address:</strong> ${b.clientAddress || 'N/A'}<br>
                                <small>Assignment Date: ${new Date(b.serviceDate).toLocaleDateString()}</small>
                            </div>
                            <button onclick="markAsCompleted('${b.bookingId}')" class="btn-primary" style="background-color: #4CAF50; border: none; padding: 8px 15px;">
                                Mark as Completed
                            </button>
                        </div>
                    `;
                } else if (isCompleted) {
                    // CONDITION B: COMPLETED (Simple)
                    return `
                        <div class="request-card" style="border-left: 5px solid #4CAF50; flex-direction: column; align-items: flex-start;">
                            <div style="display: flex; justify-content: space-between; width: 100%;">
                                <h4 style="margin: 0; color: #2E7D32;">Service Completed</h4>
                                <small>${new Date(b.serviceDate).toLocaleDateString()}</small>
                            </div>
                            <p style="margin: 5px 0 0 0;">Client: ${b.clientName || 'Unknown'}</p>
                        </div>
                    `;
                } else {
                    return '';
                }
            }).join('');
        })
        .catch(err => {
            console.error("Error fetching history:", err);
            if (list) list.innerHTML = '<p>Error loading history.</p>';
        });
}

function markAsCompleted(id) {
    if (!confirm("Are you sure you have completed this service?")) return;

    fetch(`/api/bookings/${id}/complete`, { method: 'POST' })
        .then(res => {
            if (res.ok) {
                alert("Service marked as Completed!");
                loadServiceHistory();
            } else {
                alert("Error updating status.");
            }
        });
}

function openMyComplaintsModal() {
    const modal = document.getElementById('myComplaintsModal');
    const list = document.getElementById('myComplaintsList');
    const user = JSON.parse(localStorage.getItem('user'));

    if (!modal || !list || !user) return;
    modal.style.display = 'block';

    list.innerHTML = 'Loading your complaints...';

    fetch(`/api/complaints/history/${user.userId}`)
        .then(res => res.json())
        .then(complaints => {
            if (!complaints || complaints.length === 0) {
                list.innerHTML = '<p>You have no complaints recorded.</p>';
                return;
            }
            list.innerHTML = complaints.map(c => `
                <div style="border-bottom: 4px solid #eee; padding: 15px; margin-bottom: 20px; background: #fff; border-radius:8px; box-shadow: 0 2px 5px rgba(0,0,0,0.05);">
                   <div style="display:flex; justify-content:space-between; margin-bottom:10px;">
                       <strong>Against: ${c.caregiverName}</strong>
                       <span style="color:#888;">${new Date(c.date).toLocaleDateString()}</span>
                   </div>
                   <p style="background: #fafafa; padding: 10px; border-radius: 4px; border:1px solid #eee;">
                        <strong>Your Report:</strong><br>
                        "${c.description}"
                   </p>
                   
                   ${c.adminReply ?
                    `<div class="admin-response-box" style="background: #e3f2fd; color: #0d47a1; padding: 15px; margin-top: 15px; border-radius: 6px; border-left: 5px solid #2196f3;">
                        <h4 style="margin-top:0;">Admin Response</h4>
                        <p style="margin-bottom:10px;">${c.adminReply}</p>
                        <p style="font-weight:bold; font-style:italic; border-top:1px solid rgba(0,0,0,0.1); padding-top:10px; margin-top:10px;">
                            "Thank you for staying with us. We have reviewed your complaint and are taking strict action regarding this matter very soon."
                        </p>
                      </div>` :
                    `<div style="margin-top:10px;">
                        <span style="background:#ff9800; color:white; padding:4px 8px; border-radius:12px; font-size:0.9em;">Status: Pending Review</span>
                      </div>`
                }
                </div>
            `).join('');
        })
        .catch(err => list.innerHTML = '<p>Error loading complaints.</p>');
}

// Close modals when clicking outside
window.onclick = function (event) {
    const modals = ['myComplaintsModal', 'complaintModal', 'historyModal', 'reviewModal', 'updateModal', 'reviewsListModal'];
    modals.forEach(id => {
        const modal = document.getElementById(id);
        if (modal && event.target == modal) {
            modal.style.display = 'none';
        }
    });
}

function renderCaregivers(data) {
    const grid = document.querySelector('.caregiver-grid');
    if (!grid) return;

    if (!data || data.length === 0) {
        grid.innerHTML = '<h3 style="text-align: center; width: 100%; color: red; font-weight: bold;">No result found</h3>';
        return;
    }

    grid.innerHTML = data.map(c => `
        <div class="card" id="card-${c?.userId}">
            <img style="width: 100px; height: 100px; border-radius: 0; object-fit: cover;" class="profile-force-square" src="${c?.profilePictureUrl || 'https://via.placeholder.com/100'}" alt="Caregiver">
            <h3>${c?.firstName} ${c?.lastName}</h3>
            <p style="color:purple;">${c?.profession || 'Unknown'}</p>
            <p>Exp: ${c?.experienceYears || 0} Years</p>
            <p>📍 ${c?.presentAddress || 'N/A'}</p>
            ${c?.schedules && c.schedules.length > 0 ?
            `<div style="margin: 5px 0; font-size: 0.85em; background: #f3e5f5; padding: 5px; border-radius: 4px; border: 1px solid #e1bee7;">
                    <strong>📅 Availability:</strong><br>
                    ${c.schedules.map(s => `<span>${s.dayOfWeek}: ${s.startTime}-${s.endTime}</span>`).join('<br>')}
                 </div>`
            : '<p style="font-size:0.8em; color:#888;">📅 Call for availability</p>'
        }
            <div id="rating-${c?.userId}"></div>
            <div style="margin-top: 10px; display: flex; gap: 10px;">
                <button class="btn-primary" onclick="bookCaregiver('${c?.userId}')" style="flex:1;">Book</button>
                <button class="btn-primary" onclick="viewCaregiverReviews('${c?.userId}')" style="flex:1; background-color: #7b1fa2;">Reviews</button>
            </div>
        </div>`).join('');

    data.forEach(c => {
        loadCaregiverReviews(c?.userId, document.getElementById(`rating-${c?.userId}`));
    });
}

function searchPublicCaregivers() {
    // Support both IDs just in case, but prefer the new one
    const input = document.getElementById('homeSearchInput') || document.getElementById('publicSearchInput');
    const query = input ? input.value : '';

    const grid = document.querySelector('.caregiver-grid');
    if (grid) grid.innerHTML = 'Searching...';

    fetch(`/api/caregivers/search?profession=${encodeURIComponent(query)}`)
        .then(response => response.json())
        .then(caregivers => {
            renderCaregivers(caregivers); // Uses the global render function

            // Scroll to results if found
            if (caregivers.length > 0 && grid) {
                grid.scrollIntoView({ behavior: 'smooth' });
            }
        })
        .catch(error => {
            console.error('Error searching:', error);
            if (grid) grid.innerHTML = '<p>Error searching caregivers.</p>';
        });
}

// Add event listener for the new button

// Link Filter Button
document.addEventListener('DOMContentLoaded', () => {
    const btnSearch = document.getElementById('homeSearchBtn');
    if (btnSearch) btnSearch.addEventListener('click', searchPublicCaregivers);

    const btnFilter = document.getElementById('homeFilterBtn');
    if (btnFilter) {
        btnFilter.addEventListener('click', openFilterModal);
    }
});

// --- ADVANCED FILTER LOGIC ---
function openFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) modal.style.display = 'block';
    loadProfessions(); // Load dynamic list
}

function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) modal.style.display = 'none';
}

function loadProfessions() {
    const select = document.getElementById('filterProfession');
    // If it's already populated with more than "Any", don't reload to save bandwidth/flicker
    if (!select || select.options.length > 1) return;

    select.innerHTML = '<option value="">Loading...</option>';

    fetch('/api/caregivers/professions')
        .then(res => res.json())
        .then(profs => {
            select.innerHTML = '<option value="">Any</option>';
            profs.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p;
                opt.textContent = p;
                select.appendChild(opt);
            });
        })
        .catch(err => {
            console.error(err);
            select.innerHTML = '<option value="">Error or None</option>';
        });
}

function applyFilter() {
    const profession = document.getElementById('filterProfession').value;
    const minExp = document.getElementById('filterExp').value;
    const rating = document.getElementById('filterRating').value;
    const day = document.getElementById('filterDay').value;

    const grid = document.querySelector('.caregiver-grid');
    if (grid) grid.innerHTML = 'Filtering...';

    const params = new URLSearchParams();
    if (profession) params.append('profession', profession);
    if (minExp) params.append('minExp', minExp);
    if (rating) params.append('minRating', rating);
    if (day) params.append('day', day);

    fetch(`/api/caregivers/filter?${params.toString()}`)
        .then(res => res.json())
        .then(caregivers => {
            renderCaregivers(caregivers); // Reuses global render
            closeFilterModal();
            if (grid && caregivers.length > 0) grid.scrollIntoView({ behavior: 'smooth' });
        })
        .catch(err => {
            console.error(err);
            if (grid) grid.innerHTML = '<p>Error filtering.</p>';
            closeFilterModal();
        });
}

// [Duplicate bookCaregiver removed]

// --- ADMIN REPORT GENERATION ---
function downloadUserReport() {
    const email = document.getElementById('reportUserEmail').value;
    const duration = document.getElementById('reportDuration').value;

    if (!email) {
        alert("Please enter a User Email.");
        return;
    }

    // Direct URL for download - Browser handles the stream/download
    window.location.href = `/api/reports/user?email=${encodeURIComponent(email)}&duration=${encodeURIComponent(duration)}`;
}

function downloadMonitoringReport() {
    window.location.href = '/api/reports/stats';
}

function downloadStats() {
    window.location.href = '/api/reports/stats';
}

function downloadStatsReport() {
    window.location.href = '/api/reports/stats';
}

function downloadAssignmentsReport() {
    window.location.href = '/api/reports/assignments';
}

function generateReport(type) {
    hideAllAdminSections();
    document.getElementById('reportSection').style.display = 'block';
}

function showMonitoring() {
    hideAllAdminSections();
    document.getElementById('monitoringSection').style.display = 'block';
}

function showUserManagement() {
    hideAllAdminSections();
    document.getElementById('userMgmtSection').style.display = 'block';
    loadAdminUserList(); // Auto-load list when showing section
}

// --- ADMIN PORTAL LOGIC ---

async function loadAdminUserList() {
    hideAllAdminSections();
    document.getElementById('userMgmtSection').style.display = 'block';

    const list = document.getElementById('adminUserList');
    list.innerHTML = 'Loading...';

    try {
        const res = await fetch('/api/admin/users');
        const users = await res.json();

        if (users.length === 0) {
            list.innerHTML = '<p>No users found.</p>';
            return;
        }

        let html = '<table style="width:100%; border-collapse:collapse;"><thead><tr style="background:#eee; text-align:left;"><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr></thead><tbody>';

        users.forEach(u => {
            html += `
                <tr style="border-bottom:1px solid #ddd;">
                    <td style="padding:8px;">${u.firstName} ${u.lastName}</td>
                    <td style="padding:8px;">${u.email}</td>
                    <td style="padding:8px;">${u.role}</td>
                    <td style="padding:8px;">
                        <button onclick="deleteUser(${u.userId})" style="background:red; color:white; border:none; padding:5px 10px; border-radius:4px; cursor:pointer;">Delete</button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        list.innerHTML = html;

    } catch (e) {
        list.innerHTML = '<p style="color:red">Error loading users.</p>';
        console.error(e);
    }
}

async function deleteUser(id) {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
        await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        loadAdminUserList(); // Refresh
    } catch (e) { alert("Error deleting user"); }
}

async function loadAdminCaregiverApprovals() {
    hideAllAdminSections();
    document.getElementById('permissionsSection').style.display = 'block';

    const list = document.getElementById('adminPendingList');
    // Clear previous content or append? Better to clear.
    list.innerHTML = 'Loading pending approvals... (Bookings & Registrations)';

    // Load Bookings First
    try {
        const res = await fetch('/api/admin/requests/pending');
        const bookings = await res.json();

        let html = '<h4 style="border-bottom: 2px solid #6a1b9a;">Booking Requests</h4>';
        if (bookings && bookings.length > 0) {
            html += bookings.map(b => `
            <div class="request-card" id="admin-req-${b?.bookingId}">
                <div>
                    <strong>Booking ID:</strong> ${b?.bookingId}<br>
                    <span>Status: ${b?.status}</span><br>
                    <small>Client: ${b?.clientName} | Caregiver: ${b?.caregiverName}</small>
                </div>
                <div>
                    <button class="btn-accept" onclick="adminReviewRequest('${b?.bookingId}', 'approve')">Approve</button>
                    <button class="btn-reject" onclick="adminReviewRequest('${b?.bookingId}', 'reject')">Reject</button>
                </div>
            </div>`).join('');
        } else {
            html += '<p>No pending bookings.</p>';
        }

        // Load Registrations Second
        const res2 = await fetch('/api/admin/pending-caregivers');
        const profiles = await res2.json();
        //
        // html += '<h4 style="border-bottom: 2px solid #6a1b9a; margin-top:20px;">New Caregiver Registrations</h4>';
        // if (profiles && profiles.length > 0) {
        //     html += profiles.map(p => `
        //     <div style="border:1px solid #ddd; padding:10px; margin-bottom:10px; border-radius:5px; display:flex; justify-content:space-between; align-items:center;">
        //         <div>
        //             <strong>${p.firstName} ${p.lastName}</strong><br>
        //             <small>${p.email}</small><br>
        //             <span>${p.profession} (${p.experienceYears} yrs)</span>
        //         </div>
        //         <button onclick="approveCaregiver(${p.profileId})" style="background:green; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">Approve</button>
        //     </div>`).join('');
        // } else {
        //     html += '<p>No new registrations.</p>';
        // }

        list.innerHTML = html;

    } catch (e) {
        list.innerHTML = '<p style="color:red">Error loading requests.</p>';
        console.error(e);
    }
}

async function approveCaregiver(profileId) {
    try {
        await fetch(`/api/admin/approve/${profileId}`, { method: 'PUT' });
        loadAdminPendingRequests(); // Refresh
    } catch (e) { alert("Error approving."); }
}

async function loadComplaints() {
    hideAllAdminSections();
    document.getElementById('complaintsSection').style.display = 'block';
    const list = document.getElementById('complaintsList');
    list.innerHTML = 'Loading complaints...';

    try {
        const res = await fetch('/api/admin/complaints');
        const data = await res.json();

        if (data.length === 0) {
            list.innerHTML = '<p>No complaints found.</p>';
            return;
        }

        list.innerHTML = data.map(c => `
            <div style="border:1px solid #ffcccb; background:#fff5f5; padding:15px; border-radius:8px; margin-bottom:10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom:10px; border-bottom:1px solid #ffdddd; padding-bottom:5px;">
                    <div style="width:48%;">
                        <strong style="color:#d9534f;">Reported By (Client)</strong><br>
                        <span>${c.clientName}</span><br>
                        <small>📞 ${c.clientPhone} | ✉️ ${c.clientEmail}</small>
                    </div>
                    <div style="width:48%; border-left:1px solid #ffdddd; padding-left:10px;">
                        <strong style="color:#d9534f;">Against (Caregiver)</strong><br>
                        <span>${c.caregiverName}</span><br>
                        <small>📞 ${c.caregiverPhone} | ✉️ ${c.caregiverEmail}</small>
                    </div>
                </div>
                <div>
                <div>
                    <strong>Complaint:</strong>
                    <p style="margin:5px 0;">${c.description}</p>
                    ${c.adminReply ? `<div style="margin-top:5px; padding:5px; background:#eef; border-left:3px solid blue;"><strong>Admin Reply:</strong> ${c.adminReply}</div>` : ''}
                </div>
                <div style="text-align:right; font-weight:bold; color:${c.status === 'PENDING' ? 'orange' : 'green'}; margin-top:5px;">
                    Status: ${c.status} <span style="font-size:0.8em; color:#888;">(${c.date})</span>
                    ${c.status !== 'REVIEWED' ? `<button onclick="replyToComplaint(${c.id})" style="margin-left:10px; padding:5px 10px; background:#007bff; color:white; border:none; border-radius:4px; cursor:pointer;">Reply</button>` : ''}
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error(e);
        list.innerHTML = '<p style="color:red">Error loading complaints.</p>';
    }
}

async function replyToComplaint(id) {
    const reply = prompt("Enter your reply/resolution:");
    if (!reply) return;

    try {
        const res = await fetch(`/api/admin/complaints/${id}/reply`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reply: reply })
        });
        if (res.ok) {
            alert("Reply sent.");
            loadComplaints();
        } else {
            alert("Failed to send reply.");
        }
    } catch (e) {
        console.error(e);
        alert("Error sending reply.");
    }
}

function hideAllAdminSections() {
    const ids = ['reportSection', 'monitoringSection', 'userMgmtSection', 'permissionsSection', 'complaintsSection'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function logoutAdmin() {
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = 'login.html';
}

// Helper: Upload Profile Picture
async function handleProfilePictureUpload(userId, inputId) {
    const fileInput = document.getElementById(inputId);
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch(`/api/profile/${userId}/image`, {
            method: 'POST',
            body: formData
        });
        if (!response.ok) console.error('Image upload failed');
    } catch (e) {
        console.error('Image upload error:', e);
    }
}
