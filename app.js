// DOM Elements
const taskInput = document.getElementById('taskInput');
const prioritySelect = document.getElementById('prioritySelect');
const taskTypeSelect = document.getElementById('taskTypeSelect');
const classSelect = document.getElementById('classSelect');
const dueDateInput = document.getElementById('dueDateInput');
const taskTimeInput = document.getElementById('taskTimeInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const tasksList = document.getElementById('tasksList');
const statusFilter = document.getElementById('statusFilter');
const priorityFilter = document.getElementById('priorityFilter');
const typeFilter = document.getElementById('typeFilter');
const classFilter = document.getElementById('classFilter');
const sortBySelect = document.getElementById('sortBy');
const totalTasksElement = document.getElementById('totalTasks');
const completedTasksElement = document.getElementById('completedTasks');
const pendingTasksElement = document.getElementById('pendingTasks');
const exportTasksBtn = document.getElementById('exportTasksBtn');
const printTasksBtn = document.getElementById('printTasksBtn');
const listViewBtn = document.getElementById('listViewBtn');
const calendarViewBtn = document.getElementById('calendarViewBtn');
const listView = document.getElementById('listView');
const calendarView = document.getElementById('calendarView');
const calendarDays = document.getElementById('calendarDays');
const prevMonthBtn = document.getElementById('prevMonthBtn');
const nextMonthBtn = document.getElementById('nextMonthBtn');
const currentMonthElement = document.getElementById('currentMonth');
const enableReminders = document.getElementById('enableReminders');
const reminderTime = document.getElementById('reminderTime');

// Set default date and time
const today = new Date();
dueDateInput.valueAsDate = today;
const hours = today.getHours().toString().padStart(2, '0');
const minutes = today.getMinutes().toString().padStart(2, '0');
taskTimeInput.value = `${hours}:${minutes}`;

// Tasks array - will be stored in localStorage
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Calendar state
let currentDate = new Date();
let reminders = [];

// Event Listeners
addTaskBtn.addEventListener('click', addTask);
tasksList.addEventListener('click', handleTaskActions);
statusFilter.addEventListener('change', filterTasks);
priorityFilter.addEventListener('change', filterTasks);
typeFilter.addEventListener('change', filterTasks);
classFilter.addEventListener('change', filterTasks);
sortBySelect.addEventListener('change', filterTasks);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addTask();
    }
});
exportTasksBtn.addEventListener('click', exportTasks);
printTasksBtn.addEventListener('click', printTasks);
listViewBtn.addEventListener('click', () => toggleView('list'));
calendarViewBtn.addEventListener('click', () => toggleView('calendar'));
prevMonthBtn.addEventListener('click', () => navigateMonth(-1));
nextMonthBtn.addEventListener('click', () => navigateMonth(1));
enableReminders.addEventListener('change', updateReminderSettings);
reminderTime.addEventListener('change', updateReminderSettings);

// Load tasks on page load
document.addEventListener('DOMContentLoaded', () => {
    renderTasks();
    updateTaskStats();
    renderCalendar();
    
    // Load reminder settings
    const savedSettings = JSON.parse(localStorage.getItem('reminderSettings')) || { enabled: true, time: 60 };
    enableReminders.checked = savedSettings.enabled;
    reminderTime.value = savedSettings.time;
    
    // Set up notifications
    setupNotifications();
    
    // Check for reminders every minute
    setInterval(checkReminders, 60000);
    checkReminders(); // Check immediately on load
});

// Functions
function addTask() {
    const taskText = taskInput.value.trim();
    if (!taskText) {
        alert('נא להזין משימה!');
        return;
    }

    const priority = prioritySelect.value;
    const taskType = taskTypeSelect.value;
    const classValue = classSelect.value;
    const dueDate = dueDateInput.value;
    const time = taskTimeInput.value;
    
    const newTask = {
        id: Date.now(),
        text: taskText,
        completed: false,
        dateAdded: new Date().toISOString(),
        dueDate: dueDate,
        time: time,
        priority: priority,
        type: taskType,
        class: classValue
    };

    tasks.unshift(newTask); // Add to the beginning of the array
    saveTasks();
    renderTasks();
    updateTaskStats();
    renderCalendar();
    scheduleReminder(newTask);
    
    // Reset form
    taskInput.value = '';
    prioritySelect.value = 'בינונית';
    taskTypeSelect.selectedIndex = 0;
    classSelect.selectedIndex = 0;
    dueDateInput.valueAsDate = today;
    taskTimeInput.value = `${hours}:${minutes}`;
    taskInput.focus();
}

function renderTasks() {
    // Filter tasks
    let filteredTasks = filterTasksList();
    
    // Sort tasks
    sortTasks(filteredTasks);
    
    // Clear tasks list
    tasksList.innerHTML = '';
    
    // Render filtered tasks
    if (filteredTasks.length === 0) {
        tasksList.innerHTML = '<li class="no-tasks">אין משימות להצגה</li>';
        return;
    }
    
    filteredTasks.forEach(task => {
        const taskElement = document.createElement('li');
        taskElement.className = `task-item ${task.completed ? 'task-completed' : ''}`;
        taskElement.dataset.id = task.id;
        
        // Format due date for display
        const dueDateObj = new Date(task.dueDate);
        const formattedDueDate = `${dueDateObj.getDate()}/${dueDateObj.getMonth() + 1}/${dueDateObj.getFullYear()}`;
        
        // Determine priority class
        let priorityClass = '';
        if (task.priority === 'נמוכה') priorityClass = 'priority-low';
        else if (task.priority === 'בינונית') priorityClass = 'priority-medium';
        else if (task.priority === 'גבוהה') priorityClass = 'priority-high';
        
        // Create type class
        const typeClass = `type-${task.type || 'אחר'}`;
        
        // Build HTML
        let html = `
            <div class="task-content">
                <div class="task-title">
                    <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                    <span class="task-text">${task.text}</span>
                </div>
                <div class="task-meta">
                    <span class="task-due-date">תאריך: ${formattedDueDate}</span>`;
        
        if (task.time) {
            html += `<span class="task-time">שעה: ${task.time}</span>`;
        }
        
        html += `<span class="task-priority ${priorityClass}">עדיפות: ${task.priority}</span>
                    <span class="task-type ${typeClass}">סוג: ${task.type || 'אחר'}</span>`;
        
        if (task.class) {
            html += `<span class="task-class">כיתה: ${task.class}</span>`;
        }
        
        html += `</div>
            </div>
            <div class="task-actions">
                <button class="task-btn edit-btn" title="ערוך משימה">✏️</button>
                <button class="task-btn note-btn" title="הוסף הערה">📝</button>
                <button class="task-btn delete-btn" title="מחק משימה">🗑️</button>
            </div>`;
        
        taskElement.innerHTML = html;
        tasksList.appendChild(taskElement);
    });
}

function handleTaskActions(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    
    const taskId = parseInt(taskItem.dataset.id);
    const taskIndex = tasks.findIndex(task => task.id === taskId);
    
    if (taskIndex === -1) return;
    
    // Handle checkbox click
    if (e.target.classList.contains('task-checkbox')) {
        tasks[taskIndex].completed = e.target.checked;
        taskItem.classList.toggle('task-completed', e.target.checked);
        saveTasks();
        updateTaskStats();
        renderCalendar();
        
        // Re-render if the status filter is active
        if (statusFilter.value !== 'all') {
            renderTasks();
        }
    }
    
    // Handle delete button click
    if (e.target.classList.contains('delete-btn')) {
        if (confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
            tasks.splice(taskIndex, 1);
            saveTasks();
            renderTasks();
            updateTaskStats();
            renderCalendar();
        }
    }
    
    // Handle edit button click
    if (e.target.classList.contains('edit-btn')) {
        editTask(taskIndex);
    }
    
    // Handle note button click
    if (e.target.classList.contains('note-btn')) {
        addNoteToTask(taskIndex);
    }
}

function editTask(taskIndex) {
    const task = tasks[taskIndex];
    
    // Show edit dialog (for simplicity, using prompt for each field)
    const newText = prompt('ערוך משימה', task.text);
    if (newText === null) return;
    
    if (newText.trim() !== '') {
        tasks[taskIndex].text = newText.trim();
    }
    
    const newPriority = prompt('עדיפות (נמוכה, בינונית, גבוהה)', task.priority);
    if (newPriority && ['נמוכה', 'בינונית', 'גבוהה'].includes(newPriority)) {
        tasks[taskIndex].priority = newPriority;
    }
    
    const newType = prompt('סוג משימה (שיעור, בדיקת מבחנים, ישיבת צוות, הכנת חומרים, שיחה עם הורים, אחר)', task.type || 'אחר');
    if (newType) {
        tasks[taskIndex].type = newType;
    }
    
    const newClass = prompt('כיתה (השאר ריק אם לא רלוונטי)', task.class || '');
    tasks[taskIndex].class = newClass;
    
    const newDueDate = prompt('תאריך יעד (YYYY-MM-DD)', task.dueDate);
    if (newDueDate && /^\d{4}-\d{2}-\d{2}$/.test(newDueDate)) {
        tasks[taskIndex].dueDate = newDueDate;
    }
    
    const newTime = prompt('שעה (HH:MM)', task.time || '');
    if (newTime && /^\d{2}:\d{2}$/.test(newTime)) {
        tasks[taskIndex].time = newTime;
    }
    
    saveTasks();
    renderTasks();
    renderCalendar();
}

function addNoteToTask(taskIndex) {
    const task = tasks[taskIndex];
    const note = prompt('הוסף הערה למשימה:', task.note || '');
    
    if (note !== null) {
        tasks[taskIndex].note = note;
        saveTasks();
        renderTasks();
    }
}

function filterTasks() {
    renderTasks();
}

function filterTasksList() {
    const statusValue = statusFilter.value;
    const priorityValue = priorityFilter.value;
    const typeValue = typeFilter.value;
    const classValue = classFilter.value;
    
    return tasks.filter(task => {
        // Filter by status
        if (statusValue === 'active' && task.completed) return false;
        if (statusValue === 'completed' && !task.completed) return false;
        
        // Filter by priority
        if (priorityValue !== 'all' && task.priority !== priorityValue) return false;
        
        // Filter by type
        if (typeValue !== 'all' && task.type !== typeValue) return false;
        
        // Filter by class
        if (classValue !== 'all' && task.class !== classValue) return false;
        
        return true;
    });
}

function sortTasks(tasksList) {
    const sortBy = sortBySelect.value;
    
    switch (sortBy) {
        case 'date-added':
            tasksList.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
            break;
        case 'due-date':
            tasksList.sort((a, b) => {
                const dateA = new Date(`${a.dueDate}T${a.time || '00:00'}`);
                const dateB = new Date(`${b.dueDate}T${b.time || '00:00'}`);
                return dateA - dateB;
            });
            break;
        case 'priority':
            const priorityOrder = { 'גבוהה': 1, 'בינונית': 2, 'נמוכה': 3 };
            tasksList.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
            break;
        case 'task-type':
            tasksList.sort((a, b) => (a.type || 'אחר').localeCompare(b.type || 'אחר'));
            break;
        case 'class':
            tasksList.sort((a, b) => (a.class || '').localeCompare(b.class || ''));
            break;
    }
    
    return tasksList;
}

function updateTaskStats() {
    const totalTasks = tasks.length;
    const completedTasksCount = tasks.filter(task => task.completed).length;
    const pendingTasksCount = totalTasks - completedTasksCount;
    
    totalTasksElement.textContent = `סה"כ משימות: ${totalTasks}`;
    completedTasksElement.textContent = `הושלמו: ${completedTasksCount}`;
    pendingTasksElement.textContent = `בהמתנה: ${pendingTasksCount}`;
}

function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function exportTasks() {
    let csv = 'טקסט,עדיפות,סוג,כיתה,תאריך,שעה,סטטוס,הערות\n';
    
    tasks.forEach(task => {
        const status = task.completed ? 'הושלם' : 'פעיל';
        const note = task.note || '';
        
        csv += `"${task.text}","${task.priority}","${task.type || 'אחר'}","${task.class || ''}","${task.dueDate}","${task.time || ''}","${status}","${note}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `משימות_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function printTasks() {
    // Create a printable version of the tasks
    let printContent = `
        <html>
        <head>
            <title>רשימת משימות</title>
            <style>
                body { font-family: Arial, sans-serif; direction: rtl; }
                table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
                th { background-color: #f2f2f2; }
                .completed { text-decoration: line-through; color: #666; }
                h1 { text-align: center; }
            </style>
        </head>
        <body>
            <h1>רשימת המשימות שלי</h1>
            <p>תאריך הדפסה: ${new Date().toLocaleDateString()}</p>
            <table>
                <thead>
                    <tr>
                        <th>משימה</th>
                        <th>עדיפות</th>
                        <th>סוג</th>
                        <th>כיתה</th>
                        <th>תאריך</th>
                        <th>שעה</th>
                        <th>סטטוס</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Sort tasks by due date
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    sortedTasks.forEach(task => {
        const dueDateObj = new Date(task.dueDate);
        const formattedDueDate = `${dueDateObj.getDate()}/${dueDateObj.getMonth() + 1}/${dueDateObj.getFullYear()}`;
        const taskClass = task.completed ? 'completed' : '';
        const status = task.completed ? 'הושלם' : 'פעיל';
        
        printContent += `
            <tr class="${taskClass}">
                <td>${task.text}</td>
                <td>${task.priority}</td>
                <td>${task.type || 'אחר'}</td>
                <td>${task.class || ''}</td>
                <td>${formattedDueDate}</td>
                <td>${task.time || ''}</td>
                <td>${status}</td>
            </tr>
        `;
    });
    
    printContent += `
                </tbody>
            </table>
        </body>
        </html>
    `;
    
    // Open a new window and print
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Print after a short delay to ensure content is loaded
    setTimeout(() => {
        printWindow.print();
        printWindow.close();
    }, 500);
}

function toggleView(view) {
    if (view === 'list') {
        listView.style.display = 'block';
        calendarView.style.display = 'none';
        listViewBtn.classList.add('active');
        calendarViewBtn.classList.remove('active');
    } else {
        listView.style.display = 'none';
        calendarView.style.display = 'block';
        listViewBtn.classList.remove('active');
        calendarViewBtn.classList.add('active');
        renderCalendar();
    }
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Set the current month text
    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    currentMonthElement.textContent = `${monthNames[month]} ${year}`;
    
    // Get the first day of the month
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // Get the day of the week for the first day (0 = Sunday, 6 = Saturday)
    let startDay = firstDay.getDay();
    
    // Adjust day to match Israeli week (0 = Sunday)
    // No adjustment needed since we're using Hebrew UI with Sunday as the first day of the week
    
    // Calculate the number of days to display from the previous month
    const daysFromPrevMonth = startDay;
    
    // Calculate the number of days in the current month
    const daysInMonth = lastDay.getDate();
    
    // Calculate the total number of days to display
    const totalDays = Math.ceil((daysFromPrevMonth + daysInMonth) / 7) * 7;
    
    // Clear the calendar
    calendarDays.innerHTML = '';
    
    // Get the current date for highlighting today
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Add days from the previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = 0; i < daysFromPrevMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day prev-month';
        dayEl.innerHTML = `<div class="calendar-day-number">${prevMonthLastDay - daysFromPrevMonth + i + 1}</div>`;
        calendarDays.appendChild(dayEl);
    }
    
    // Add days from the current month
    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        
        // Check if this day is today
        const currentDate = new Date(year, month, i);
        const isToday = currentDate.getTime() === today.getTime();
        
        dayEl.className = `calendar-day ${isToday ? 'today' : ''}`;
        dayEl.innerHTML = `<div class="calendar-day-number">${i}</div>`;
        
        // Add tasks for this day
        const dayTasks = tasks.filter(task => {
            const taskDate = new Date(task.dueDate);
            return taskDate.getDate() === i && 
                   taskDate.getMonth() === month && 
                   taskDate.getFullYear() === year;
        });
        
        dayTasks.forEach(task => {
            const taskEl = document.createElement('div');
            taskEl.className = `day-task type-${task.type || 'אחר'} ${task.completed ? 'completed' : ''}`;
            taskEl.innerHTML = `${task.time ? task.time + ' - ' : ''}${task.text.substring(0, 20)}${task.text.length > 20 ? '...' : ''}`;
            taskEl.title = task.text;
            
            // Add click event to open task details
            taskEl.addEventListener('click', () => {
                const taskIndex = tasks.findIndex(t => t.id === task.id);
                if (taskIndex !== -1) {
                    alert(`משימה: ${task.text}\nסוג: ${task.type || 'אחר'}\nכיתה: ${task.class || 'לא צוין'}\nעדיפות: ${task.priority}\nשעה: ${task.time || 'לא צוין'}\nסטטוס: ${task.completed ? 'הושלם' : 'פעיל'}\nהערות: ${task.note || 'אין'}`);
                }
            });
            
            dayEl.appendChild(taskEl);
        });
        
        calendarDays.appendChild(dayEl);
    }
    
    // Add days from the next month if needed
    const remainingDays = totalDays - (daysFromPrevMonth + daysInMonth);
    for (let i = 1; i <= remainingDays; i++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day next-month';
        dayEl.innerHTML = `<div class="calendar-day-number">${i}</div>`;
        calendarDays.appendChild(dayEl);
    }
}

function navigateMonth(direction) {
    currentDate.setMonth(currentDate.getMonth() + direction);
    renderCalendar();
}

function updateReminderSettings() {
    const settings = {
        enabled: enableReminders.checked,
        time: parseInt(reminderTime.value)
    };
    
    localStorage.setItem('reminderSettings', JSON.stringify(settings));
    setupNotifications();
}

function setupNotifications() {
    // Check if browser supports notifications
    if (!("Notification" in window)) {
        alert("דפדפן זה אינו תומך בהתראות");
        return;
    }
    
    // Request permission for notifications
    if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission();
    }
}

function scheduleReminder(task) {
    // Get reminder settings
    const settings = JSON.parse(localStorage.getItem('reminderSettings')) || { enabled: true, time: 60 };
    
    if (!settings.enabled) return;
    
    // Calculate reminder time
    const taskDateTime = new Date(`${task.dueDate}T${task.time || '00:00'}`);
    const reminderDateTime = new Date(taskDateTime.getTime() - (settings.time * 60 * 1000));
    
    // Only add reminder if it's in the future
    if (reminderDateTime > new Date()) {
        reminders.push({
            id: task.id,
            time: reminderDateTime,
            task: task
        });
    }
}

function checkReminders() {
    const now = new Date();
    const settings = JSON.parse(localStorage.getItem('reminderSettings')) || { enabled: true, time: 60 };
    
    if (!settings.enabled) return;
    
    // Check for tasks that need reminders
    tasks.forEach(task => {
        if (task.completed) return;
        
        const taskDateTime = new Date(`${task.dueDate}T${task.time || '00:00'}`);
        const reminderDateTime = new Date(taskDateTime.getTime() - (settings.time * 60 * 1000));
        
        // Check if we should send a reminder now (within the last minute)
        const timeDiff = now.getTime() - reminderDateTime.getTime();
        if (timeDiff >= 0 && timeDiff < 60000) {
            showNotification(task);
        }
    });
}

function showNotification(task) {
    if (Notification.permission === "granted") {
        const notification = new Notification("תזכורת למשימה", {
            body: `יש לך משימה מתוכננת: ${task.text}\nזמן: ${task.time || 'לא צוין'}\n${task.class ? 'כיתה: ' + task.class : ''}`,
            icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='64' height='64'%3E%3Cpath fill='%234a6fdc' d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h-2v-6h2v6zm4 0h-2v-6h2v6zm-2-8c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z'/%3E%3C/svg%3E"
        });
        
        notification.onclick = function() {
            window.focus();
            notification.close();
        };
    }
} 