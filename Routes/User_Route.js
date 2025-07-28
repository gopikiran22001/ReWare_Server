const express = require("express");
const router = express.Router();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

// Middleware
const upload = require("../MiddleWare/multer"); // Multer config
const cloudinaryUpload = require("../MiddleWare/upload_profile_picture"); // Single image uploader
const validateUserFields = require("../MiddleWare/User_Validate");
const Authentication = require("../MiddleWare/Authentication");
const AttachOwner = require("../MiddleWare/Attach_Owner");

// Models
const User = require("../Models/User_Model");
const Product = require("../Models/Product_Model");
const Notification = require("../Models/Notification_Model");

// Middleware to parse cookies
router.use(cookieParser());
router.use(express.json());

router.get("/login", async (req, res) => {
  const token = req.cookies?.token;

  if (!token) {
    return res
      .status(401)
      .json({ error: "Access denied. Please login first." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found. Invalid token." });
    }

    res.status(200).json({
      message: "Login successful",
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        _id: user._id,
      },
    });
  } catch (err) {
    return res.status(403).json({ error: "Invalid or expired token." });
  }
});

// POST /api/register
router.post(
  "/register",
  validateUserFields, // Validate fields (name, email, etc.)
  async (req, res) => {
    try {
      const { email } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Create new user
      const user = new User({
        ...req.body,
        profilePhoto: req.imageUrl || "", // fallback if no image uploaded
      });

      await user.save();

      const newNotification = new Notification({
        userId: user._id,
        header: "Welcome to ReWare!",
        message:
          "We're excited to have you on board. Start exploring and find great deals on products you love.",
        type: "message",
        createdAt: new Date(),
      });

      await newNotification.save();

      // Generate JWT
      const token = jwt.sign(
        { _id: user._id, name: `${user.firstName} ${user.lastName}` },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
      );

      // Set token in HTTP-only cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Respond with user data (exclude password)
      const { password, ...userData } = user.toObject();

      res.status(201).json({
        message: "User registered successfully",
        user: {
          firstName: userData.firstName,
          lastName: userData.lastName,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
);

// POST /api/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Check if user exists
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Compare password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Generate token
    const token = jwt.sign(
      { _id: user._id, name: `${user.firstName} ${user.lastName}` },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Set HTTP-only cookie
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 3 * 24 * 60 * 60 * 1000, // 3 days
    });

    const { password: _, ...userData } = user.toObject();

    res.status(200).json({
      message: "Login successful",
      user: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        _id: userData._id,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

router.get("/", Authentication, AttachOwner, async (req, res) => {
  try {
    const userId = req.owner._id;

    const user = await User.findById(userId).select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({
      message: "User details fetched successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        dateOfBirth: user.dateOfBirth,
        profilePhoto: user.profilePhoto,
        role: user.role,
        wishlist: user.wishlist,
        conversations: user.conversations,
        notifications: user.notifications,
        points: user.points,
        waterSaved: user.waterSaved,
        co2Saved: user.co2Saved,
      },
    });
  } catch (error) {
    console.error("Fetch user details error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.put(
  "/",
  Authentication,
  AttachOwner,
  upload.single("file"),
  cloudinaryUpload,
  async (req, res) => {
    try {
      const userId = req.owner._id; // from JWT payload

      const disallowedFields = [
        "_id",
        "owner",
        "email",
        "role",
        "points",
        "co2Saved",
        "waterSaved",
        "wishlist",
        "conversations",
        "notifications",
      ];
      const updates = {};

      for (let key in req.body) {
        if (!disallowedFields.includes(key)) {
          updates[key] = req.body[key];
        }
      }

      if (req.profilePhoto) {
        updates.profilePhoto = req.profilePhoto;
      }

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password");

      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.status(200).json({
        message: "Update successful",
        user: updatedUser,
      });
    } catch (error) {
      console.error("Update error:", error);
      res.status(500).json({ message: "Server error" });
    }
  }
);

router.put("/wishlist", Authentication, AttachOwner, async (req, res) => {
  try {
    const { productId } = req.query;
    const userId = req.owner._id;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // Find user and update wishlist
    const user = await User.findById(userId);

    if (user.wishlist.includes(productId)) {
      return res.status(409).json({ message: "Product already in wishlist" });
    }

    user.wishlist.push(productId);
    await user.save();

    res.status(200).json({ message: "Product added to wishlist" });
  } catch (err) {
    console.error("Add to wishlist error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/wishlist", Authentication, AttachOwner, async (req, res) => {
  try {
    const userId = req.owner._id;
    const { productId } = req.query;

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: productId } },
      { new: true }
    ).select("wishlist");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Product removed from wishlist" });
  } catch (error) {
    console.error("Remove from wishlist error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/wishlist", Authentication, AttachOwner, async (req, res) => {
  try {
    const userId = req.owner._id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const products = await Product.find({
      _id: { $in: user.wishlist },
    })
      .select("-customer -createdAt -updatedAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      wishlist: products,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  res.status(200).json({ message: "Logged out successfully" });
});
module.exports = router;
