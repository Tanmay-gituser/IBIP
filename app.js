const API_URL = 'http://localhost:3000/api/tasks';

// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const taskDateInput = document.getElementById('task-date');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const emptyState = document.getElementById('empty-state');

// State
let tasks = [];

// Initialize
document.addEventListener('DOMContentLoaded', fetchTasks);

// Fetch all tasks from the API
async function fetchTasks() {
    try {
        const response = await fetch(API_URL);
        tasks = await response.json();
        renderTasks();
    } catch (error) {
        console.error('Error fetching tasks:', error);
        // Fallback for UI if backend is not running
        tasks = [];
        renderTasks();
    }
}

// Add a new task
taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = taskInput.value.trim();
    const dueDate = taskDateInput.value;
    if (!title) return;

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, dueDate: dueDate ? dueDate : null })
        });
        
        if (response.ok) {
            const newTask = await response.json();
            tasks.unshift(newTask); // Add to beginning of array
            taskInput.value = '';
            taskDateInput.value = '';
            renderTasks();
        }
    } catch (error) {
        console.error('Error adding task:', error);
    }
});

// Toggle Task Completion status
async function toggleTaskStatus(id, currentStatus) {
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ completed: !currentStatus })
        });

        if (response.ok) {
            const updatedTask = await response.json();
            // Update local state
            tasks = tasks.map(task => task._id === id ? updatedTask : task);
            renderTasks();
        }
    } catch (error) {
        console.error('Error updating task status:', error);
    }
}

// Edit Task Title
async function editTask(id, currentTitle) {
    const newTitle = prompt('Edit task:', currentTitle);
    
    if (newTitle !== null && newTitle.trim() !== '' && newTitle.trim() !== currentTitle) {
        try {
            const response = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: newTitle.trim() })
            });

            if (response.ok) {
                const updatedTask = await response.json();
                tasks = tasks.map(task => task._id === id ? updatedTask : task);
                renderTasks();
            }
        } catch (error) {
            console.error('Error editing task:', error);
        }
    }
}

// Delete Task
async function deleteTask(id) {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            tasks = tasks.filter(task => task._id !== id);
            renderTasks();
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// Render the task list to the DOM
function renderTasks() {
    // Update counter
    taskCount.textContent = `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`;
    
    // Handle empty state
    if (tasks.length === 0) {
        taskList.innerHTML = '';
        emptyState.style.display = 'flex';
        taskList.appendChild(emptyState);
        return;
    }

    // Clear list
    taskList.innerHTML = '';
    
    // Sort tasks: incomplete first, then completed. Secondary sort by date (handled by backend mostly, but just in case)
    const sortedTasks = [...tasks].sort((a, b) => {
        if (a.completed === b.completed) return 0;
        return a.completed ? 1 : -1;
    });

    sortedTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;
        
        let dateHtml = '';
        if (task.dueDate) {
            const dateObj = new Date(task.dueDate);
            const dateStr = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            dateHtml = `<div class="task-meta"><i class="fa-regular fa-clock"></i> Due: ${dateStr}</div>`;
        }

        li.innerHTML = `
            <div class="task-content">
                <input 
                    type="checkbox" 
                    class="task-checkbox" 
                    ${task.completed ? 'checked' : ''} 
                    onchange="toggleTaskStatus('${task._id}', ${task.completed})"
                >
                <div class="task-details">
                    <span class="task-text" onclick="toggleTaskStatus('${task._id}', ${task.completed})">${escapeHTML(task.title)}</span>
                    ${dateHtml}
                </div>
            </div>
            <div class="task-actions">
                <button class="btn-icon btn-edit" onclick="editTask('${task._id}', '${escapeHTML(task.title.replace(/'/g, "\\'"))}')" aria-label="Edit">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="btn-icon btn-delete" onclick="deleteTask('${task._id}')" aria-label="Delete">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        
        taskList.appendChild(li);
    });
}

// Helper function to prevent XSS
function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
