export const getNewTask = async (req, res) => {
  try {
    // You can add logic here later to fetch tasks

    res.status(200).json({ message: "New task endpoint reached successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
