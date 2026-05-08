const socket = io();
const datePicker = document.getElementById('datePicker');
const slotGrid = document.getElementById('slotGrid');
const statusCard = document.getElementById('live-status');
const bookingForm = document.getElementById('bookingForm');
const formDate = document.getElementById('formDate');
const nameInput = document.getElementById('nameInput');
const timeSelect = document.getElementById('timeSelect');
const formMessage = document.getElementById('formMessage');

const availableTimes = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function formatDisplayTime(time) {
  const [hour, minute] = time.split(':').map(Number);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
}

function createSlotCard(time, booked) {
  const card = document.createElement('div');
  card.className = 'slot-card';
  const title = document.createElement('h3');
  title.textContent = formatDisplayTime(time);
  const status = document.createElement('p');
  status.textContent = booked ? `Booked by ${booked.name}` : 'Available';
  card.append(title, status);
  const actionButton = document.createElement('button');
  actionButton.className = 'button';
  actionButton.textContent = booked ? 'Booked' : 'Book now';
  actionButton.disabled = Boolean(booked);
  actionButton.addEventListener('click', () => {
    if (!booked) {
      formDate.value = datePicker.value;
      timeSelect.value = time;
      nameInput.focus();
      window.location.hash = 'book';
    }
  });
  card.append(actionButton);
  return card;
}

function renderSlots(date, appointments) {
  slotGrid.innerHTML = '';
  const bookedMap = new Map(appointments.map((appt) => [appt.time, appt]));
  availableTimes.forEach((time) => {
    const booked = bookedMap.get(time);
    const card = createSlotCard(time, booked);
    slotGrid.appendChild(card);
  });
  const bookedCount = appointments.length;
  statusCard.textContent = `${bookedCount} appointment${bookedCount === 1 ? '' : 's'} booked for ${date}.`;
}

async function loadAppointments(date) {
  const response = await fetch(`/appointments?date=${encodeURIComponent(date)}`);
  const data = await response.json();
  renderSlots(data.date, data.slots);
}

function getInitialDate() {
  const today = new Date();
  return formatDate(today);
}

function showMessage(message, type = 'success') {
  formMessage.textContent = message;
  formMessage.className = `message ${type}`;
}

function clearMessage() {
  formMessage.textContent = '';
  formMessage.className = 'message';
}

socket.on('appointmentUpdate', ({ date, booking }) => {
  if (date === datePicker.value) {
    loadAppointments(date);
  }
});

socket.on('bookingError', (message) => {
  showMessage(message, 'error');
});

datePicker.addEventListener('change', () => {
  loadAppointments(datePicker.value);
  clearMessage();
});

bookingForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const date = formDate.value;
  const time = timeSelect.value;
  const name = nameInput.value.trim();
  if (!name) {
    showMessage('Please enter your name.', 'error');
    return;
  }
  socket.emit('bookSlot', { date, time, name });
  showMessage('Booking request sent. Refreshing soon...', 'success');
  setTimeout(() => {
    if (date === datePicker.value) loadAppointments(date);
  }, 500);
});

const initialDate = getInitialDate();
datePicker.value = initialDate;
formDate.value = initialDate;
loadAppointments(initialDate);
