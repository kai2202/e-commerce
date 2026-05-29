"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAddress = exports.updateAddress = exports.addAddress = exports.updateUserProfile = exports.getUserProfile = void 0;
const User_1 = __importDefault(require("../models/User"));
// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id).select('-password');
        if (user) {
            res.json(user);
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.getUserProfile = getUserProfile;
// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (user) {
            user.name = req.body.name || user.name;
            user.phone = req.body.phone || user.phone;
            user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar;
            if (req.body.password) {
                user.password = req.body.password;
            }
            const updatedUser = await user.save();
            res.json({
                id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
                role: updatedUser.role,
                active: updatedUser.active,
                addresses: updatedUser.addresses,
            });
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateUserProfile = updateUserProfile;
// @desc    Add new address
// @route   POST /api/users/address
// @access  Private
const addAddress = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (user) {
            const newAddress = {
                id: `addr-${Date.now()}`,
                name: req.body.name,
                phone: req.body.phone,
                label: req.body.label,
                street: req.body.street,
                city: req.body.city,
                isDefault: req.body.isDefault || false
            };
            if (newAddress.isDefault) {
                user.addresses.forEach((addr) => addr.isDefault = false);
            }
            user.addresses.push(newAddress);
            await user.save();
            res.status(201).json(user.addresses);
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.addAddress = addAddress;
// @desc    Update address
// @route   PUT /api/users/address/:id
// @access  Private
const updateAddress = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (user) {
            const addressId = req.params.id;
            const addressIndex = user.addresses.findIndex((addr) => addr.id === addressId);
            if (addressIndex !== -1) {
                user.addresses[addressIndex] = {
                    ...user.addresses[addressIndex].toObject(),
                    name: req.body.name || user.addresses[addressIndex].name,
                    phone: req.body.phone || user.addresses[addressIndex].phone,
                    label: req.body.label || user.addresses[addressIndex].label,
                    street: req.body.street || user.addresses[addressIndex].street,
                    city: req.body.city || user.addresses[addressIndex].city,
                    isDefault: req.body.isDefault !== undefined ? req.body.isDefault : user.addresses[addressIndex].isDefault
                };
                if (req.body.isDefault) {
                    user.addresses.forEach((addr, idx) => {
                        if (idx !== addressIndex)
                            addr.isDefault = false;
                    });
                }
                await user.save();
                res.json(user.addresses);
            }
            else {
                res.status(404).json({ message: 'Address not found' });
            }
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.updateAddress = updateAddress;
// @desc    Delete address
// @route   DELETE /api/users/address/:id
// @access  Private
const deleteAddress = async (req, res) => {
    try {
        const user = await User_1.default.findById(req.user._id);
        if (user) {
            const addressId = req.params.id;
            user.addresses = user.addresses.filter((addr) => addr.id !== addressId);
            await user.save();
            res.json(user.addresses);
        }
        else {
            res.status(404).json({ message: 'User not found' });
        }
    }
    catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};
exports.deleteAddress = deleteAddress;
