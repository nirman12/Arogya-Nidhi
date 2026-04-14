import validator from "validator";
import bcrypt from "bcrypt";
import { v2 as cloudinary } from "cloudinary";
import { supabase } from "../config/supabase.js";
import repo from "../repository/auth.repository.js";
import { generateAccessToken } from "../util/token.util.js";
import jwt from "jsonwebtoken";

// API for adding doctor
const addDoctor = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      speciality,
      degree,
      experience,
      about,
      fees,
      address,
    } = req.body;
    const imageFile = req.file;

    // checking for all data to add-doctor
    if (
      !name ||
      !email ||
      !password ||
      !speciality ||
      !degree ||
      !experience ||
      !about ||
      !fees ||
      !address ||
      !imageFile
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Please fill all fields" });
    }

    // validating email format
    if (!validator.isEmail(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter a valid email!" });
    }

    // validating password length
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long!",
      });
    }

    // hashing the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // upload image to cloudinary
    const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
    const imageUrl = imageUpload.secure_url;

    // create Supabase auth user for doctor
    const { data: createdUser, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role: 'doctor' },
      email_confirm: true,
    });
    if (createErr) return res.status(500).json({ success: false, message: createErr.message });

    // insert doctor profile in Supabase
    const doctorProfile = {
      user_id: createdUser?.id || createdUser?.user?.id,
      specialty: speciality,
      qualifications: degree,
      experience: experience,
      bio: about,
      consultation_fee: fees,
      address: JSON.parse(address),
      image: imageUrl,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { error: profErr } = await supabase.from('doctor_profiles').insert(doctorProfile);
    if (profErr) return res.status(500).json({ success: false, message: profErr.message });

    return res.status(201).json({ success: true, message: 'Doctor added successfully' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API for Admin Login
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // checking for all data to login
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please enter email and password!" });
    }

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(email + password, process.env.JWT_SECRET);
      return res.status(200).json({
        success: true,
        token,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid email or password",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API for getting all doctors
const getAllDoctors = async (req, res) => {
  try {
    const { data, error } = await supabase.from('doctor_profiles').select('*, users(name,email,avatar_url)').order('created_at', { ascending: false });
    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, doctors: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API to get all appointments list
const appointmentsAdmin = async (req, res) => {
  try {
    const { data, error } = await supabase.from('appointments').select('*');
    if (error) return res.status(500).json({ success: false, message: error.message });
    return res.status(200).json({ success: true, appointments: data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// API for appointment cancellation
const appointmentCancelAdmin = async (req, res) => {
  try {
    const { appointmentId } = req.body;
    const { data, error } = await supabase.from('appointments').select('*').eq('id', appointmentId).maybeSingle();
    if (error) return res.status(500).json({ success: false, message: error.message });
    if (!data) return res.status(404).json({ success: false, message: 'Appointment not found.' });
    const { error: upErr } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', appointmentId);
    if (upErr) return res.status(500).json({ success: false, message: upErr.message });
    return res.status(200).json({ success: true, message: 'Appointment cancelled.' });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

// API to get dashboard data for admin dashboard
const adminDashboard = async (req, res) => {
  try {
    const [{ data: doctors }, { data: users }, { data: appointments }] = await Promise.all([
      supabase.from('doctor_profiles').select('id'),
      supabase.from('users').select('id'),
      supabase.from('appointments').select('id'),
    ]);
    const dashData = {
      doctors: doctors?.length || 0,
      patients: users?.length || 0,
      appointments: appointments?.length || 0,
      latestAppointments: [],
    };
    return res.status(200).json({ success: true, dashData });
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }
};

export {
  addDoctor,
  loginAdmin,
  getAllDoctors,
  appointmentsAdmin,
  appointmentCancelAdmin,
  adminDashboard,
};
