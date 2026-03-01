
        function bookProgram(type) {
            const modal = document.getElementById('bookingModal');
            const name = document.getElementById('modalProgramName');
            name.textContent = type === '90-day'
                ? '90-Day Quick Transform - ₹4,999'
                : '120-Day Complete Transform - ₹7,499';
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeModal() {
            document.getElementById('bookingModal').classList.remove('active');
            document.body.style.overflow = '';
        }

        document.getElementById('bookingModal').addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) closeModal();
        });

        document.getElementById('bookingForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = e.target.querySelector('.submit-btn');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Booking...';
            submitBtn.disabled = true;

            const formData = {
                name: document.getElementById('userName').value,
                email: document.getElementById('userEmail').value,
                phone: document.getElementById('userPhone').value,
                preferredTime: document.getElementById('preferredTime').value,
                program: document.getElementById('modalProgramName').textContent.includes('90') ? '90-day' : '120-day'
            };

            try {
                const res = await fetch('/api/consultations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const data = await res.json();

                if (res.ok) {
                    alert(`🎉 Booking Confirmed!\n\nThank you, ${formData.name}! We'll contact you shortly.`);
                    closeModal();
                    e.target.reset();
                } else {
                    alert('Booking failed: ' + (data.error || 'Unknown error'));
                }
            } catch (err) {
                alert('Error submitting booking. Please try again.');
                console.error(err);
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
    
window.bookProgram = bookProgram;
window.closeModal = closeModal;
