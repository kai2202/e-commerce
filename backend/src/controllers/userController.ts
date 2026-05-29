import { Request, Response } from 'express';
import User from '../models/User';

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
export const getUserProfile = async (req: Request | any, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
export const updateUserProfile = async (req: Request | any, res: Response) => {
  try {
    const user: any = await User.findById(req.user._id);

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
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Add new address
// @route   POST /api/users/address
// @access  Private
export const addAddress = async (req: Request | any, res: Response) => {
  try {
    const user: any = await User.findById(req.user._id);
    if (user) {
      const newAddress = {
        name: req.body.name,
        phone: req.body.phone,
        label: req.body.label,
        street: req.body.street,
        city: req.body.city,
        isDefault: req.body.isDefault || false
      };

      if (newAddress.isDefault) {
        user.addresses.forEach((addr: any) => addr.isDefault = false);
      }

      user.addresses.push(newAddress);
      await user.save();
      res.status(201).json(user.addresses);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Update address
// @route   PUT /api/users/address/:id
// @access  Private
export const updateAddress = async (req: Request | any, res: Response) => {
  try {
    const user: any = await User.findById(req.user._id);
    if (user) {
      const addressId = req.params.id;
      const addressIndex = user.addresses.findIndex((addr: any) => addr._id.toString() === addressId || addr.id === addressId);
      
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
          user.addresses.forEach((addr: any, idx: number) => {
            if (idx !== addressIndex) addr.isDefault = false;
          });
        }
        
        await user.save();
        res.json(user.addresses);
      } else {
        res.status(404).json({ message: 'Address not found' });
      }
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Delete address
// @route   DELETE /api/users/address/:id
// @access  Private
export const deleteAddress = async (req: Request | any, res: Response) => {
  try {
    const user: any = await User.findById(req.user._id);
    if (user) {
      const addressId = req.params.id;
      user.addresses = user.addresses.filter((addr: any) => addr._id.toString() !== addressId && addr.id !== addressId);
      await user.save();
      res.json(user.addresses);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Get user cart and wishlist
// @route   GET /api/users/cart-wishlist
// @access  Private
export const getCartAndWishlist = async (req: Request | any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      res.json({
        cart: user.cart || [],
        wishlist: user.wishlist || []
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @desc    Sync user cart and wishlist
// @route   PUT /api/users/cart-wishlist
// @access  Private
export const syncCartAndWishlist = async (req: Request | any, res: Response) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.cart = req.body.cart || [];
      user.wishlist = req.body.wishlist || [];
      await user.save();
      res.json({
        cart: user.cart,
        wishlist: user.wishlist
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
