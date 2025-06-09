import taskModel from "../models/task_model.js";

export const getNewTask = async (req, res) => {
  try {
    // Fetch tasks for the authenticated user
    const tasks = await taskModel.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ message: "Tasks fetched successfully", tasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};





function generateRawTaskId() {
  const timestamp = Date.now().toString().slice(-6); // last 6 digits
  const random = Math.floor(1000 + Math.random() * 9000); // 4 digits
  return timestamp + random.toString(); // 10-digit string
}

// Function to generate a unique taskId
async function generateUniqueTaskId() {
  let taskId;
  let exists = true;

  while (exists) {
    taskId = generateRawTaskId();
    exists = await taskModel.exists({ taskId }); // Check existence in DB
  }

  return taskId;
}



export const postNewTask = async (req, res) => {
  console.log("Creating new task:", req.body);
 
  try {
    const { 
    
      name, 
      description, 
      color, 
      dueDate, 
      repeat, 
      tags, 
      completed 
    } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Task name is required." });
    }

    // Determine category based on task properties
    let category = 'all'; // default category
    
    if (dueDate) {
      const taskDate = new Date(dueDate);
      const today = new Date();
      const isToday = taskDate.toDateString() === today.toDateString();
      
      if (isToday) {
        category = 'today';
      } else {
        category = 'scheduled';
      }
    }
    
    if (repeat && repeat.enabled) {
      category = 'daily';
    }

    // Check if task has important/urgent tags for flagged category
    const hasImportantTags = tags && tags.some(tag => 
      tag.name.toLowerCase() === 'important' || 
      tag.name.toLowerCase() === 'urgent'
    );
    
    if (hasImportantTags) {
      category = 'flagged';
    }

    const newTask = new taskModel({
       id : await generateUniqueTaskId(),
      userId: req.user.id,
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || '#007bff',
      dueDate: dueDate ? new Date(dueDate) : null,
      completed: completed || false,
      repeat: {
        enabled: repeat ? repeat.enabled : false,
        type: repeat ? repeat.type : 'daily',
        days: repeat ? repeat.days : [],
        frequency: repeat ? repeat.frequency : 'Never'
      },
      tags: tags || [],
      category: category
    });

    const savedTask = await newTask.save();
    
    res.status(201).json({ 
      message: "Task created successfully", 
      task: savedTask 
    });
    
  } catch (error) {
    console.error("Error creating task:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ message: "Failed to create task" });
  }
};

// Additional controller methods you might need

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Ensure user can only update their own tasks
    const task = await taskModel.findOne({ _id: id, userId: req.user.id });
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    const updatedTask = await taskModel.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    res.status(200).json({ 
      message: "Task updated successfully", 
      task: updatedTask 
    });
    
  } catch (error) {
    console.error("Error updating task:", error);
    res.status(500).json({ message: "Failed to update task" });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Ensure user can only delete their own tasks
    const task = await taskModel.findOneAndDelete({ _id: id, userId: req.user.id });
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    res.status(200).json({ message: "Task deleted successfully" });
    
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({ message: "Failed to delete task" });
  }
};

export const toggleTaskCompletion = async (req, res) => {
  try {
    const { id } = req.params;
    
    const task = await taskModel.findOne({ _id: id, userId: req.user.id });
    
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }
    
    task.completed = !task.completed;
    await task.save();
    
    res.status(200).json({ 
      message: "Task completion status updated", 
      task 
    });
    
  } catch (error) {
    console.error("Error toggling task completion:", error);
    res.status(500).json({ message: "Failed to update task" });
  }
};