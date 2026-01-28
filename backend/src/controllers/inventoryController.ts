import { Request, Response } from 'express';
import InventoryItem from '../models/InventoryItem';
import InventoryMovement from '../models/InventoryMovement';
import Location from '../models/Location';
import ItemCategory from '../models/ItemCategory';
import { Op } from 'sequelize';
import DocumentService from '../services/documentService';
import fs from 'fs/promises';
import path from 'path';

// GET /api/inventory/items
export const getAllItems = async (req: Request, res: Response) => {
  try {
    const { category, status, search, page = 1, limit = 25 } = req.query;

    const where: any = {};
    if (category) where.categoryId = category;
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { serialNumber: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await InventoryItem.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching items:', error);
    res.status(500).json({ success: false, error: 'Error al obtener artículos' });
  }
};

// GET /api/inventory/items/:id
export const getItemById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Artículo no encontrado' });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching item:', error);
    res.status(500).json({ success: false, error: 'Error al obtener artículo' });
  }
};

// POST /api/inventory/items
export const createItem = async (req: Request, res: Response) => {
  try {
    const itemData = req.body;

    const item = await InventoryItem.create(itemData);

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error creating item:', error);
    res.status(500).json({ success: false, error: 'Error al crear artículo' });
  }
};

// PUT /api/inventory/items/:id
export const updateItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Artículo no encontrado' });
    }

    await item.update(updateData);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar artículo' });
  }
};

// DELETE /api/inventory/items/:id
export const deleteItem = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const item = await InventoryItem.findByPk(id);

    if (!item) {
      return res.status(404).json({ success: false, error: 'Artículo no encontrado' });
    }

    await item.destroy();

    res.json({
      success: true,
      message: 'Artículo eliminado correctamente',
    });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar artículo' });
  }
};

// POST /api/inventory/movements
export const createMovement = async (req: Request, res: Response) => {
  try {
    const {
      itemId,
      movementType,
      movementSubtype,
      toLocationId,
      fromLocationId,
      customerId,
      expectedReturnDate,
      notes,
    } = req.body;

    const userId = (req as any).user.id;
    const userName = (req as any).user.name;

    // 1. Obtener info del artículo
    const item = await InventoryItem.findByPk(itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Artículo no encontrado' });
    }

    // 2. Obtener ubicación destino
    const toLocation = await Location.findByPk(toLocationId);
    if (!toLocation) {
      return res.status(404).json({ success: false, error: 'Ubicación destino no encontrada' });
    }

    // 3. Generar número de movimiento único
    const count = await InventoryMovement.count();
    const movementNumber = `MOV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    // 4. Crear movimiento
    const movement = await InventoryMovement.create({
      movementNumber,
      itemId,
      itemName: item.name,
      itemCategory: item.categoryName,
      itemSerialNumber: item.serialNumber,
      movementType,
      movementSubtype,
      fromLocationId,
      toLocationId,
      toLocationName: toLocation.name,
      toLocationAddress: toLocation.address,
      toLocationCity: toLocation.city,
      toLocationState: toLocation.state,
      toLocationCoordinates: toLocation.coordinates,
      customerId,
      movementDate: new Date(),
      expectedReturnDate,
      notes,
      userId,
      userName,
      documentGenerated: false, // Fase 3
    });

    // 5. Actualizar ubicación actual del artículo
    await item.update({
      currentLocationId: toLocationId,
      currentLocationName: toLocation.name,
      currentLocationCity: toLocation.city,
      currentLocationState: toLocation.state,
      currentLocationCoordinates: toLocation.coordinates,
      lastMovementDate: new Date(),
      status: movementType === 'exit' ? 'rented' : 'available',
    });

    res.json({
      success: true,
      data: movement,
    });
  } catch (error) {
    console.error('Error creating movement:', error);
    res.status(500).json({ success: false, error: 'Error al crear movimiento' });
  }
};

// GET /api/inventory/movements
export const getAllMovements = async (req: Request, res: Response) => {
  try {
    const {
      page = 1,
      limit = 25,
      movementType,
      movementSubtype,
      dateFrom,
      dateTo,
      locationId,
      categoryId,
      customerId,
      itemId,
      documentGenerated,
      sortBy = 'movementDate',
      sortOrder = 'DESC'
    } = req.query;

    // Construir WHERE dinámico
    const where: any = {};

    if (movementType) where.movementType = movementType;
    if (movementSubtype) where.movementSubtype = movementSubtype;
    if (documentGenerated === 'true') where.documentGenerated = true;
    if (documentGenerated === 'false') where.documentGenerated = false;
    if (customerId) where.customerId = customerId;
    if (itemId) where.itemId = itemId;

    // Filtro de ubicación (origen o destino)
    if (locationId) {
      where[Op.or] = [
        { fromLocationId: locationId },
        { toLocationId: locationId }
      ];
    }

    // Filtro de fechas
    if (dateFrom || dateTo) {
      where.movementDate = {};
      if (dateFrom) where.movementDate[Op.gte] = new Date(dateFrom as string);
      if (dateTo) where.movementDate[Op.lte] = new Date(dateTo as string);
    }

    // Filtro por categoría del artículo (se usa campo denormalizado)
    if (categoryId) {
      const category = await ItemCategory.findByPk(Number(categoryId));
      if (category) {
        where.itemCategory = category.name;
      }
    }

    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows } = await InventoryMovement.findAndCountAll({
      where,
      limit: Number(limit),
      offset,
      order: [[sortBy as string, sortOrder as string]],
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(count / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching movements:', error);
    res.status(500).json({ success: false, error: 'Error al obtener movimientos' });
  }
};

// GET /api/inventory/movements/:itemId/history
export const getItemHistory = async (req: Request, res: Response) => {
  try {
    const { itemId } = req.params;

    const movements = await InventoryMovement.findAll({
      where: { itemId },
      order: [['movementDate', 'DESC']],
    });

    res.json({
      success: true,
      data: movements,
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, error: 'Error al obtener historial' });
  }
};

// GET /api/inventory/categories
export const getAllCategories = async (req: Request, res: Response) => {
  try {
    const categories = await ItemCategory.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, error: 'Error al obtener categorías' });
  }
};

// GET /api/inventory/locations
export const getAllLocations = async (req: Request, res: Response) => {
  try {
    const locations = await Location.findAll({
      where: { isActive: true },
      order: [['name', 'ASC']],
    });

    res.json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ success: false, error: 'Error al obtener ubicaciones' });
  }
};

// GET /api/inventory/movements/:id/document
export const downloadMovementDocument = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // 1. Buscar movimiento
    const movement = await InventoryMovement.findByPk(id);
    if (!movement) {
      return res.status(404).json({ success: false, error: 'Movimiento no encontrado' });
    }

    // 2. Buscar artículo
    const item = await InventoryItem.findByPk(movement.itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: 'Artículo no encontrado' });
    }

    // 3. Generar PDF
    const pdfBuffer = await DocumentService.generateMovementDocument({
      movement,
      item,
    });

    // 4. Actualizar registro de documento generado
    await movement.update({
      documentGenerated: true,
      documentType: movement.movementType as 'entry' | 'exit',
      documentNumber: movement.movementNumber,
    });

    // 5. Enviar PDF
    const filename = `${movement.movementNumber}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating document:', error);
    res.status(500).json({ success: false, error: 'Error al generar documento' });
  }
};

// GET /api/inventory/stats
export const getInventoryStats = async (req: Request, res: Response) => {
  try {
    // Stats básicos de artículos
    const totalItems = await InventoryItem.count();
    const inWarehouse = await InventoryItem.count({
      where: { status: 'available' }
    });
    const rented = await InventoryItem.count({
      where: { status: 'rented' }
    });
    const maintenance = await InventoryItem.count({
      where: { status: 'maintenance' }
    });

    // Valor total del inventario
    const totalValue = await InventoryItem.sum('currentValue') || 0;

    // Movimientos recientes
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const movementsToday = await InventoryMovement.count({
      where: {
        movementDate: {
          [Op.gte]: today
        }
      }
    });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const movementsThisWeek = await InventoryMovement.count({
      where: {
        movementDate: {
          [Op.gte]: weekAgo
        }
      }
    });

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    monthAgo.setHours(0, 0, 0, 0);

    const movementsThisMonth = await InventoryMovement.count({
      where: {
        movementDate: {
          [Op.gte]: monthAgo
        }
      }
    });

    // Stats por categoría
    const categories = await ItemCategory.findAll({
      where: { isActive: true },
      attributes: ['id', 'name']
    });

    const byCategory: any = {};
    for (const category of categories) {
      const total = await InventoryItem.count({ where: { categoryId: category.id } });
      const available = await InventoryItem.count({
        where: { categoryId: category.id, status: 'available' }
      });
      const rentedCount = await InventoryItem.count({
        where: { categoryId: category.id, status: 'rented' }
      });

      byCategory[category.name] = {
        total,
        available,
        rented: rentedCount
      };
    }

    res.json({
      success: true,
      data: {
        totalItems,
        inWarehouse,
        rented,
        maintenance,
        totalValue,
        movementsToday,
        movementsThisWeek,
        movementsThisMonth,
        byCategory
      }
    });
  } catch (error) {
    console.error('Error getting inventory stats:', error);
    res.status(500).json({ success: false, error: 'Error al obtener las estadísticas de inventario' });
  }
};

// POST /api/inventory/locations
export const createLocation = async (req: Request, res: Response) => {
  try {
    const { name, address, city, state, country = 'México', coordinates, isActive = true } = req.body;

    const location = await Location.create({
      name,
      address,
      city,
      state,
      country,
      coordinates: coordinates || { lat: 19.4326, lng: -99.1332 },
      type: 'warehouse',
      isActive,
    });

    res.status(201).json({
      success: true,
      data: location,
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ success: false, error: 'Error al crear la ubicación' });
  }
};
