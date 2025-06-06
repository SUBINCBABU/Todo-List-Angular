export const getTodo = async (req, res) => {
  try {
  
    res.status(200).json({
      message: "Fetched todos successfully",
    
    });
  } catch (error) {
    console.error("Get Todo Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
