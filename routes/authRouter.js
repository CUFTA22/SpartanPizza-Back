const router = require("express").Router();

router.post("/login", (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate
    if (!username || !password)
      return res
        .status(400)
        .json({ variant: "error", message: "No empty fields!" });

    res.status(200).json({
      message: "Login successful!",
      username,
    });
  } catch (error) {
    res.status(400).json({ variant: "error", message: "Server Error!" });
  }
});

module.exports = router;
