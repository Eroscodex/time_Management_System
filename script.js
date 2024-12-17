document.addEventListener('DOMContentLoaded', () => {
    const taskTitleInput = document.getElementById('task-title');
    const taskDescriptionInput = document.getElementById('task-description');
    const taskDueDateInput = document.getElementById('task-due-date');
    const taskPriorityInput = document.getElementById('task-priority');
    const addTaskButton = document.getElementById('add-task');
    const taskList = document.getElementById('task-list');
    const taskSearchInput = document.getElementById('task-search');
    const taskCountDisplay = document.getElementById('task-count');
    const dailySummary = document.getElementById('daily-summary');
    const weeklyOverview = document.getElementById('weekly-overview');
    
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];

    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    function renderTasks(filteredTasks = tasks) {
        taskList.innerHTML = '';
        filteredTasks.forEach((task, index) => {
            const taskElement = document.createElement('li');
            taskElement.classList.toggle('completed', task.completed);
            taskElement.dataset.index = index;

            const elapsedTime = formatTime(task.elapsedTime);

            taskElement.innerHTML = `
                <div class="task-info">
                    <div>
                        <strong>${task.title}</strong>
                        <p>${task.description}</p>
                        <small>Due: ${new Date(task.dueDate).toLocaleString()}</small>
                        <p>Priority: <strong>${task.priority}</strong></p>
                        <p style="color: ${isOverdue(task.dueDate) ? 'red' : ''}">
                            ${isOverdue(task.dueDate) ? 'Overdue!' : ''}
                        </p>
                    </div>
                    <div>
                        <button class="complete-task">${task.completed ? 'Undo' : 'Complete'}</button>
                        <button class="edit-task">Edit</button>
                        <button class="delete-task">Delete</button>
                        <button class="start-timer" ${task.timerRunning ? 'disabled' : ''}>Start Timer</button>
                        <button class="pause-timer" ${!task.timerRunning || task.timerPaused ? 'disabled' : ''}>Pause Timer</button>
                        <button class="stop-timer" ${!task.timerRunning ? 'disabled' : ''}>Stop Timer</button>
                        <button class="reset-timer">Reset Timer</button>
                        <div class="timer-display">${elapsedTime}</div>
                    </div>
                </div>
            `;
            taskList.appendChild(taskElement);
        });
        updateTaskCount();
        renderDailySummary();
        renderWeeklyOverview();
    }

    function updateTaskCount() {
        const completedTasks = tasks.filter(task => task.completed).length;
        const totalTasks = tasks.length;
        taskCountDisplay.textContent = `Completed: ${completedTasks} / Total: ${totalTasks}`;
    }

    function isOverdue(dueDate) {
        return new Date(dueDate) < new Date() && !tasks.completed;
    }

    function startTimer(index) {
        const task = tasks[index];
        task.timerRunning = true;
        task.startTime = Date.now() - task.elapsedTime;
        task.timerPaused = false;
        task.timerInterval = setInterval(() => {
            task.elapsedTime = Date.now() - task.startTime;
            renderTasks();
        }, 1000);
        saveTasks();
    }

    function pauseTimer(index) {
        const task = tasks[index];
        task.timerPaused = true;
        clearInterval(task.timerInterval);
        saveTasks();
        renderTasks();
    }

    function stopTimer(index) {
        const task = tasks[index];
        task.timerRunning = false;
        clearInterval(task.timerInterval);
        saveTasks();
        renderTasks();
    }

    function resetTimer(index) {
        const task = tasks[index];
        task.elapsedTime = 0;
        task.startTime = null;
        task.timerRunning = false;
        task.timerPaused = false;
        clearInterval(task.timerInterval);
        saveTasks();
        renderTasks();
    }

    function smartScheduler(existingTasks, newTask) {
        const conflictingTask = existingTasks.find(existingTask => {
            return newTask.dueDate >= existingTask.dueDate && newTask.dueDate < existingTask.dueDate + 3600000;
        });

        if (conflictingTask) {
            alert(`Conflict detected! Rescheduling task "${newTask.title}" to the next available slot.`);
            newTask.dueDate = conflictingTask.dueDate + 3600000;
        }

        return [...existingTasks, newTask].sort((a, b) => a.dueDate - b.dueDate);
    }

    taskList.addEventListener('click', (event) => {
        const taskIndex = event.target.closest('li').dataset.index;

        if (event.target.classList.contains('complete-task')) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
        }

        if (event.target.classList.contains('delete-task')) {
            tasks.splice(taskIndex, 1);
        }

        if (event.target.classList.contains('edit-task')) {
            const task = tasks[taskIndex];
            taskTitleInput.value = task.title;
            taskDescriptionInput.value = task.description;
            taskDueDateInput.value = new Date(task.dueDate).toISOString().slice(0, 16);
            taskPriorityInput.value = task.priority;

            tasks.splice(taskIndex, 1);
        }

        if (event.target.classList.contains('start-timer')) startTimer(taskIndex);
        if (event.target.classList.contains('pause-timer')) pauseTimer(taskIndex);
        if (event.target.classList.contains('stop-timer')) stopTimer(taskIndex);
        if (event.target.classList.contains('reset-timer')) resetTimer(taskIndex);

        saveTasks();
        renderTasks();
    });

    addTaskButton.addEventListener('click', () => {
        const title = taskTitleInput.value.trim();
        const description = taskDescriptionInput.value.trim();
        const dueDate = taskDueDateInput.value;
        const priority = taskPriorityInput.value;

        if (title && description && dueDate) {
            const task = {
                title,
                description,
                dueDate: new Date(dueDate).getTime(),
                priority,
                completed: false,
                timerRunning: false,
                elapsedTime: 0
            };

            tasks = smartScheduler(tasks, task);
            saveTasks();
            renderTasks();

            taskTitleInput.value = '';
            taskDescriptionInput.value = '';
            taskDueDateInput.value = '';
        } else {
            alert('Please fill in all fields.');
        }
    });

    taskSearchInput.addEventListener('input', (event) => {
        const searchTerm = event.target.value.toLowerCase();
        const filteredTasks = tasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm) ||
            task.description.toLowerCase().includes(searchTerm)
        );
        renderTasks(filteredTasks);
    });

    function formatTime(time) {
        const hours = Math.floor(time / (1000 * 60 * 60));
        const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((time % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    function renderDailySummary() {
        const today = new Date();
        const dailyTasks = tasks.filter(task => {
            const taskDueDate = new Date(task.dueDate);
            return taskDueDate.toDateString() === today.toDateString();
        });

        const completedToday = dailyTasks.filter(task => task.completed).length;
        dailySummary.textContent = `Tasks Due Today: ${dailyTasks.length}, Completed: ${completedToday}`;
    }

    function renderWeeklyOverview() {
        const today = new Date();
        const firstDayOfWeek = today.getDate() - today.getDay();
        const startOfWeek = new Date(today.setDate(firstDayOfWeek));
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        const weeklyTasks = tasks.filter(task => {
            const taskDueDate = new Date(task.dueDate);
            return taskDueDate >= startOfWeek && taskDueDate <= endOfWeek;
        });

        const completedThisWeek = weeklyTasks.filter(task => task.completed).length;
        weeklyOverview.textContent = `Tasks Due This Week: ${weeklyTasks.length}, Completed: ${completedThisWeek}`;
    }

    renderTasks();
});
