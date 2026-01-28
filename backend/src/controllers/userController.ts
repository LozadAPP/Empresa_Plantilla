import { Request, Response } from 'express';
import { Op } from 'sequelize';
import User from '../models/User';
import Role from '../models/Role';
import UserRole from '../models/UserRole';
import Location from '../models/Location';
import bcrypt from 'bcryptjs';

// ====================================
// GET ALL USERS
// ====================================

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { search, role, isActive, page = 1, limit = 10 } = req.query;

    const where: any = {};

    // Search filter
    if (search) {
      where[Op.or] = [
        { first_name: { [Op.iLike]: `%${search}%` } },
        { last_name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    // Active filter
    if (isActive !== undefined) {
      where.is_active = isActive === 'true';
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { rows: users, count: total } = await User.findAndCountAll({
      where,
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        },
        {
          model: Location,
          as: 'location',
          attributes: ['id', 'name', 'city'],
        },
      ],
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset,
      distinct: true,
    });

    // Filter by role if specified
    let filteredUsers = users;
    if (role) {
      filteredUsers = users.filter((user: any) =>
        user.roles.some((r: any) => r.name === role)
      );
    }

    res.json({
      success: true,
      data: filteredUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: 'Error interno del servidor',
    });
  }
};

// ====================================
// GET USER BY ID
// ====================================

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        },
        {
          model: Location,
          as: 'location',
        },
      ],
      attributes: { exclude: ['password_hash'] },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: 'Error interno del servidor',
    });
  }
};

// ====================================
// CREATE USER
// ====================================

export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, password, first_name, last_name, phone, location_id, roles } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email already registered',
      });
    }

    // Create user (password will be hashed by model hook)
    const user = await User.create({
      email,
      password_hash: password,
      first_name,
      last_name,
      phone,
      location_id,
      is_active: true,
    });

    // Assign roles
    if (roles && roles.length > 0) {
      const roleRecords = await Role.findAll({
        where: { name: { [Op.in]: roles } },
      });

      for (const role of roleRecords) {
        await UserRole.create({
          user_id: user.id,
          role_id: role.id,
          location_id,
        });
      }
    }

    // Fetch created user with roles
    const createdUser = await User.findByPk(user.id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        },
        {
          model: Location,
          as: 'location',
        },
      ],
      attributes: { exclude: ['password_hash'] },
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: createdUser,
    });
  } catch (error: any) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: 'Error interno del servidor',
    });
  }
};

// ====================================
// UPDATE USER
// ====================================

export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, first_name, last_name, phone, location_id, roles } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check email uniqueness if changed
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already in use',
        });
      }
    }

    // Update user fields
    await user.update({
      email: email || user.email,
      first_name: first_name || user.first_name,
      last_name: last_name || user.last_name,
      phone: phone !== undefined ? phone : user.phone,
      location_id: location_id !== undefined ? location_id : user.location_id,
    });

    // Update roles if provided
    if (roles && Array.isArray(roles)) {
      // Remove existing roles
      await UserRole.destroy({ where: { user_id: id } });

      // Add new roles
      const roleRecords = await Role.findAll({
        where: { name: { [Op.in]: roles } },
      });

      for (const role of roleRecords) {
        await UserRole.create({
          user_id: user.id,
          role_id: role.id,
          location_id: user.location_id,
        });
      }
    }

    // Fetch updated user
    const updatedUser = await User.findByPk(id, {
      include: [
        {
          model: Role,
          as: 'roles',
          through: { attributes: [] },
        },
        {
          model: Location,
          as: 'location',
        },
      ],
      attributes: { exclude: ['password_hash'] },
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error: any) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user',
      error: 'Error interno del servidor',
    });
  }
};

// ====================================
// TOGGLE USER STATUS (Activate/Deactivate)
// ====================================

export const toggleUserStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    await user.update({
      is_active: !user.is_active,
    });

    res.json({
      success: true,
      message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
      data: {
        id: user.id,
        is_active: user.is_active,
      },
    });
  } catch (error: any) {
    console.error('Error toggling user status:', error);
    res.status(500).json({
      success: false,
      message: 'Error toggling user status',
      error: 'Error interno del servidor',
    });
  }
};

// ====================================
// RESET USER PASSWORD
// ====================================

export const resetUserPassword = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Update password (will be hashed by model hook)
    await user.update({
      password_hash: newPassword,
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error: any) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password',
      error: 'Error interno del servidor',
    });
  }
};

// ====================================
// GET USER STATS
// ====================================

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.count();
    const activeUsers = await User.count({ where: { is_active: true } });
    const inactiveUsers = await User.count({ where: { is_active: false } });

    // Get users by role
    const roles = await Role.findAll({
      include: [
        {
          model: User,
          as: 'users',
          attributes: ['id'],
          through: { attributes: [] },
        },
      ],
    });

    const usersByRole = roles.map((role: any) => ({
      role: role.name,
      count: role.users?.length || 0,
    }));

    res.json({
      success: true,
      data: {
        total: totalUsers,
        active: activeUsers,
        inactive: inactiveUsers,
        byRole: usersByRole,
      },
    });
  } catch (error: any) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats',
      error: 'Error interno del servidor',
    });
  }
};

// ====================================
// GET ALL ROLES (for dropdown)
// ====================================

export const getRoles = async (req: Request, res: Response) => {
  try {
    const roles = await Role.findAll({
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: roles,
    });
  } catch (error: any) {
    console.error('Error fetching roles:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching roles',
      error: 'Error interno del servidor',
    });
  }
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  toggleUserStatus,
  resetUserPassword,
  getUserStats,
  getRoles,
};
