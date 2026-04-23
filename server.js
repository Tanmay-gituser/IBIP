const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const Task = require('./models/Task');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Connection
// We are connecting to a local MongoDB instance. Ensure MongoDB is running locally.
mongoose.connect('mongodb://127.0.0.1:27017/smart-todo')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// --- API ROUTES ---

// GET all tasks
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching tasks', error });
  }
});

// POST a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const newTask = new Task({ 
      title: req.body.title,
      dueDate: req.body.dueDate 
    });
    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error creating task', error });
  }
});

// PUT (update) a task (mark as complete/incomplete or edit title)
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedTask) return res.status(404).json({ message: 'Task not found' });
    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: 'Error updating task', error });
  }
});

// DELETE a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const deletedTask = await Task.findByIdAndDelete(req.params.id);
    if (!deletedTask) return res.status(404).json({ message: 'Task not found' });
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting task', error });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
