export const diagnose = async (req, res) => {
  try {
    const { messages } = req.body;
    // Mock behavior: echo last student question and return a pseudo 'patient' reply.
    const last = messages?.slice(-1)[0];
    const reply = last?.text
      ? `Mock patient: I have been feeling ${last.text.slice(0, 120)}... (provide vitals and history to refine)`
      : "Mock patient: Hello, I have a headache and fever.";

    // In future, call Gemini API here using server-side credentials and return model reply.
    res.json({ success: true, reply });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};
