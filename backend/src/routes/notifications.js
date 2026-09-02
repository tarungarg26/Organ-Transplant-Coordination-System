const router = require("express").Router();
const Notification = require("../models/Notification");
const { protect } = require("../middleware/auth");

router.get("/", protect, async (req, res, next) => {
  try {
    const rows = await Notification.find({ userId: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(rows);
  } catch (e) { next(e); }
});

router.patch("/:id/read", protect, async (req, res, next) => {
  try {
    const row = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!row) return res.status(404).json({ message: "Notification not found" });
    res.json(row);
  } catch (e) { next(e); }
});

module.exports = router;
