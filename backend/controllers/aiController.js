export const diagnose = async (req, res) => {
  try {
    const { messages } = req.body;
    const last = messages?.slice(-1)[0];
    const reply = last?.text
      ? `Based on your symptoms: "${last.text.slice(0, 120)}" — please consult a doctor for a proper diagnosis. (AI integration coming soon)`
      : "Please describe your symptoms so I can help guide you.";

    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
