import taskModel from "../models/task_model.js";

export const getTodo = async (req, res) => {
  console.log("heloo");
  
  try {
    const tasks = await taskModel.find({ userId: req.user.id });
    res.status(200).json({ tasks });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const updatedTask = await taskModel.findOneAndUpdate(
      { _id: taskId, userId },
      req.body,
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    res.status(200).json({ message: "Task updated successfully", task: updatedTask });
  } catch (error) {
    res.status(500).json({ message: "Error updating task", error });
  }
};

// Delete a task
export const deleteTask = async (req, res) => {
  
  try {
    const taskId = req.params.id;
    const userId = req.user.id;

    const deletedTask = await taskModel.findOneAndDelete({ id: taskId, userId });

    if (!deletedTask) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    res.status(200).json({ message: "Task deleted successfully", task: deletedTask });
  } catch (error) {
    res.status(500).json({ message: "Error deleting task", error });
  }
};