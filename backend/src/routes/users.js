const router = require("express").Router();
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { protect, allowRoles } = require("../middleware/auth");
const audit = require("../utils/audit");

router.get("/", protect, allowRoles("ADMIN"), async (req, res, next) => {
  try {
    res.json(await User.find().select("-password").sort({ createdAt: -1 }));
  } catch (e) { next(e); }
});

router.post("/", protect, allowRoles("ADMIN"), async (req, res, next) => {
  try {
    const { name, email, password, role, hospitalName, phone } = req.body;
    if (!name || !email || !password || !role) return res.status(400).json({ message: "Name, email, password and role are required" });
    const user = await User.create({
      name, email: email.toLowerCase(), password: await bcrypt.hash(password, 10),
      role, hospitalName, phone
    });
    await audit(req.user, "CREATE_USER", "USER", user._id, { role });
    res.status(201).json(await User.findById(user._id).select("-password"));
  } catch (e) { next(e); }
});

router.patch("/:id/toggle", protect, allowRoles("ADMIN"), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.active = !user.active;
    await user.save();
    await audit(req.user, "TOGGLE_USER", "USER", user._id, { active: user.active });
    res.json(await User.findById(user._id).select("-password"));
  } catch (e) { next(e); }
});

module.exports = router;
