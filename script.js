// Data untuk tugas piket
let tasks = JSON.parse(localStorage.getItem('piketTasks')) || [];

// Hari dalam bahasa Indonesia
const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

// Elemen DOM
const dateDisplay = document.getElementById('dateDisplay');
const taskForm = document.getElementById('taskForm');
const absenceForm = document.getElementById('absenceForm');
const tasksToday = document.getElementById('tasksToday');
const emptyState = document.getElementById('emptyState');
const piketCount = document.getElementById('piketCount');
const tidakPiketCount = document.getElementById('tidakPiketCount');
const messagePreview = document.getElementById('messagePreview');
const teacherName = document.getElementById('teacherName');
const sendWhatsApp = document.getElementById('sendWhatsApp');
const copyMessage = document.getElementById('copyMessage');
const notification = document.getElementById('notification');
const notificationText = document.getElementById('notificationText');
const selectedTasksContainer = document.getElementById('selectedTasks');
const taskButtons = document.querySelectorAll('.task-btn');

// Variabel untuk menyimpan tugas yang dipilih
let selectedTasks = [];

// Inisialisasi
function init() {
    updateDateDisplay();
    renderTasksToday();
    updateCounts();
    updateMessagePreview();
    
    // Event listeners
    taskForm.addEventListener('submit', addTask);
    absenceForm.addEventListener('submit', addAbsence);
    sendWhatsApp.addEventListener('click', sendToWhatsApp);
    copyMessage.addEventListener('click', copyToClipboard);
    teacherName.addEventListener('input', updateMessagePreview);
    
    // Event listeners untuk tombol tugas
    taskButtons.forEach(button => {
        button.addEventListener('click', () => {
            const task = button.getAttribute('data-task');
            toggleTaskSelection(task, button);
        });
    });
}

// Fungsi untuk memperbarui tampilan tanggal
function updateDateDisplay() {
    const now = new Date();
    const dayName = days[now.getDay()];
    const date = now.getDate();
    const monthName = months[now.getMonth()];
    const year = now.getFullYear();
    
    dateDisplay.textContent = `${dayName}, ${date} ${monthName} ${year}`;
}

// Fungsi untuk memilih/membatalkan pilihan tugas
function toggleTaskSelection(task, button) {
    const index = selectedTasks.indexOf(task);
    
    if (index === -1) {
        // Jika belum dipilih dan belum mencapai maksimal 3
        if (selectedTasks.length < 3) {
            selectedTasks.push(task);
            button.classList.add('selected');
            updateSelectedTasksDisplay();
        } else {
            showNotification('Maksimal 3 tugas per siswa!', true);
        }
    } else {
        // Jika sudah dipilih, batalkan pilihan
        selectedTasks.splice(index, 1);
        button.classList.remove('selected');
        updateSelectedTasksDisplay();
    }
}

// Fungsi untuk memperbarui tampilan tugas yang dipilih
function updateSelectedTasksDisplay() {
    selectedTasksContainer.innerHTML = '';
    
    if (selectedTasks.length === 0) {
        selectedTasksContainer.innerHTML = '<span style="color: #94a3b8; font-style: italic;">Belum ada tugas dipilih</span>';
        return;
    }
    
    selectedTasks.forEach(task => {
        const taskElement = document.createElement('span');
        taskElement.className = 'selected-task-item';
        taskElement.textContent = task;
        selectedTasksContainer.appendChild(taskElement);
    });
}

// Fungsi untuk menyimpan tugas ke localStorage
function saveTasks() {
    localStorage.setItem('piketTasks', JSON.stringify(tasks));
}

// Fungsi untuk menampilkan tugas hari ini
function renderTasksToday() {
    tasksToday.innerHTML = '';
    
    const today = days[new Date().getDay()];
    const todayTasks = tasks.filter(task => task.day === today);
    
    if (todayTasks.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        
        // Kelompokkan tugas berdasarkan siswa
        const tasksByStudent = {};
        
        todayTasks.forEach(task => {
            if (!tasksByStudent[task.assignee]) {
                tasksByStudent[task.assignee] = {
                    tasks: [],
                    absent: task.absent,
                    absenceReason: task.absenceReason,
                    id: task.id
                };
            }
            
            if (task.tasks && task.tasks.length > 0) {
                tasksByStudent[task.assignee].tasks.push(...task.tasks);
            }
        });
        
        // Tampilkan tugas per siswa
        Object.keys(tasksByStudent).forEach(student => {
            const studentData = tasksByStudent[student];
            const taskItem = document.createElement('div');
            taskItem.className = `task-item ${studentData.absent ? 'absent' : ''}`;
            
            let tasksHTML = '';
            if (studentData.absent) {
                tasksHTML = `<div class="task-detail">Tidak piket - ${studentData.absenceReason}</div>`;
            } else {
                tasksHTML = studentData.tasks.map(task => 
                    `<div class="task-detail">${task}</div>`
                ).join('');
            }
            
            taskItem.innerHTML = `
                <div class="task-info">
                    <div class="student-name">${student}</div>
                    <div class="task-details">
                        ${tasksHTML}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="btn-danger btn-sm" onclick="deleteTask(${studentData.id})">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </div>
            `;
            
            tasksToday.appendChild(taskItem);
        });
    }
}

// Fungsi untuk menghapus tugas
function deleteTask(id) {
    if (confirm('Apakah Anda yakin ingin menghapus tugas ini?')) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasksToday();
        updateCounts();
        updateMessagePreview();
        showNotification('Tugas berhasil dihapus!');
    }
}

// Fungsi untuk memperbarui jumlah piket dan tidak piket
function updateCounts() {
    const today = days[new Date().getDay()];
    const todayTasks = tasks.filter(task => task.day === today);
    
    // Hitung siswa yang piket (setidaknya satu tugas dan tidak absent)
    const piketStudents = new Set();
    const tidakPiketStudents = new Set();
    
    todayTasks.forEach(task => {
        if (task.absent) {
            tidakPiketStudents.add(task.assignee);
        } else {
            piketStudents.add(task.assignee);
        }
    });
    
    piketCount.textContent = piketStudents.size;
    tidakPiketCount.textContent = tidakPiketStudents.size;
}

// Fungsi untuk menambah tugas baru
function addTask(event) {
    event.preventDefault();
    
    const assignee = document.getElementById('assignee').value;
    const today = days[new Date().getDay()];
    
    if (assignee && selectedTasks.length > 0) {
        // Hapus tugas sebelumnya untuk siswa ini di hari yang sama (jika ada)
        tasks = tasks.filter(task => !(task.assignee === assignee && task.day === today && !task.absent));
        
        // Tambahkan tugas baru
        const newTask = {
            id: Date.now(),
            assignee: assignee,
            day: today,
            tasks: [...selectedTasks],
            absent: false,
            absenceReason: ''
        };
        
        tasks.push(newTask);
        saveTasks();
        renderTasksToday();
        updateCounts();
        updateMessagePreview();
        
        // Reset form
        taskForm.reset();
        selectedTasks = [];
        updateSelectedTasksDisplay();
        
        // Reset tombol tugas
        taskButtons.forEach(button => {
            button.classList.remove('selected');
        });
        
        showNotification('Tugas berhasil ditambahkan!');
    } else {
        showNotification('Harap pilih setidaknya satu tugas!', true);
    }
}

// Fungsi untuk menandai ketidakhadiran
function addAbsence(event) {
    event.preventDefault();
    
    const studentName = document.getElementById('absentStudent').value;
    const reason = document.getElementById('absenceReason').value;
    const today = days[new Date().getDay()];
    
    if (studentName && reason) {
        // Hapus tugas sebelumnya untuk siswa ini di hari yang sama (jika ada)
        tasks = tasks.filter(task => !(task.assignee === studentName && task.day === today));
        
        const newAbsence = {
            id: Date.now(),
            assignee: studentName,
            day: today,
            tasks: [],
            absent: true,
            absenceReason: reason
        };
        
        tasks.push(newAbsence);
        saveTasks();
        renderTasksToday();
        updateCounts();
        updateMessagePreview();
        
        // Reset form
        absenceForm.reset();
        
        showNotification(`${studentName} ditandai tidak piket karena ${reason.toLowerCase()}!`);
    }
}

// Fungsi untuk memperbarui pratinjau pesan
function updateMessagePreview() {
    const today = days[new Date().getDay()];
    const now = new Date();
    const date = now.getDate();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const teacher = teacherName.value || 'Guru';
    
    const todayTasks = tasks.filter(task => task.day === today);
    
    let message = `Assalamualaikum, bapa/ibu ${teacher} ini list piket hari ${today}: ${date}/${month}/${year}\n\n`;
    
    if (todayTasks.length === 0) {
        message += "Tidak ada siswa yang bertugas piket hari ini.\n";
    } else {
        // Kelompokkan tugas berdasarkan siswa
        const tasksByStudent = {};
        
        todayTasks.forEach(task => {
            if (!tasksByStudent[task.assignee]) {
                tasksByStudent[task.assignee] = {
                    tasks: [],
                    absent: task.absent,
                    absenceReason: task.absenceReason
                };
            }
            
            if (task.tasks && task.tasks.length > 0) {
                tasksByStudent[task.assignee].tasks.push(...task.tasks);
            }
        });
        
        const piketStudents = [];
        const absentStudents = [];
        
        Object.keys(tasksByStudent).forEach(student => {
            const studentData = tasksByStudent[student];
            
            if (studentData.absent) {
                absentStudents.push(`${student} - ${studentData.absenceReason}`);
            } else {
                piketStudents.push(`${student} (${studentData.tasks.join(', ')})`);
            }
        });
        
        if (piketStudents.length > 0) {
            message += "Yang piket:\n";
            piketStudents.forEach(student => {
                message += `• ${student}\n`;
            });
            message += "\n";
        }
        
        if (absentStudents.length > 0) {
            message += "Yang tidak piket:\n";
            absentStudents.forEach(student => {
                message += `• ${student}\n`;
            });
        }
    }
    
    message += "\nTerima kasih.";
    
    messagePreview.textContent = message;
}

// Fungsi untuk mengirim ke WhatsApp
function sendToWhatsApp() {
    const message = messagePreview.textContent;
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
}

// Fungsi untuk menyalin pesan
function copyToClipboard() {
    const message = messagePreview.textContent;
    navigator.clipboard.writeText(message).then(() => {
        showNotification('Pesan berhasil disalin!');
    });
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, isError = false) {
    notificationText.textContent = message;
    notification.classList.toggle('error', isError);
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Inisialisasi aplikasi
init();