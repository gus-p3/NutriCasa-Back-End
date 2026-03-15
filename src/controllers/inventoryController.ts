import { Request, Response } from 'express';
import Inventory from '../models/Inventory.model';

// @route  GET /api/inventory
// Devuelve items[] ordenados por category
export const getInventory = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;

    let inventory = await Inventory.findOne({ userId });

    // Si no existe aún, crear inventario vacío
    if (!inventory) {
      inventory = await Inventory.create({ userId, items: [] });
    }

    // Ordenar items por category
    const sortedItems = [...inventory.items].sort((a, b) =>
      a.category.localeCompare(b.category)
    );

    res.status(200).json({
      total: sortedItems.length,
      items: sortedItems,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al obtener el inventario',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @route  POST /api/inventory
// Agrega un ingrediente con $push a items[]
export const addItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { name, quantity, unit, category, expiresAt } = req.body;

    if (!name || quantity === undefined || !unit || !category) {
      res.status(400).json({ message: 'name, quantity, unit y category son requeridos' });
      return;
    }

    // Buscar o crear inventario
    let inventory = await Inventory.findOne({ userId });
    if (!inventory) {
      inventory = await Inventory.create({ userId, items: [] });
    }

    // Verificar si el ingrediente ya existe (mismo nombre + unidad)
    const exists = inventory.items.some(
      item => item.name.toLowerCase() === name.toLowerCase() && item.unit === unit
    );
    if (exists) {
      res.status(400).json({ message: `"${name}" ya está en tu alacena con la misma unidad. Usa PUT para actualizar la cantidad.` });
      return;
    }

    // $push con operador de MongoDB
    const updated = await Inventory.findOneAndUpdate(
      { userId },
      {
        $push: {
          items: {
            name,
            quantity,
            unit,
            category,
            expiresAt: expiresAt ? new Date(expiresAt) : undefined,
            addedAt: new Date(),
          },
        },
      },
      { new: true, runValidators: true }
    );

    // Devolver el item recién agregado
    const newItem = updated?.items[updated.items.length - 1];

    res.status(201).json({
      message: 'Ingrediente agregado',
      item: newItem,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al agregar ingrediente',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @route  PUT /api/inventory/:id
// Actualiza un ingrediente con $set y operador posicional
export const updateItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;
    const { name, quantity, unit, category, expiresAt } = req.body;

    // Construir solo los campos enviados con operador posicional $
    const setFields: Record<string, any> = {};
    if (name      !== undefined) setFields['items.$.name']      = name;
    if (quantity  !== undefined) setFields['items.$.quantity']  = quantity;
    if (unit      !== undefined) setFields['items.$.unit']      = unit;
    if (category  !== undefined) setFields['items.$.category']  = category;
    if (expiresAt !== undefined) setFields['items.$.expiresAt'] = new Date(expiresAt);

    if (Object.keys(setFields).length === 0) {
      res.status(400).json({ message: 'No se enviaron campos para actualizar' });
      return;
    }

    const updated = await Inventory.findOneAndUpdate(
      { userId, 'items._id': id },   // filtro con operador posicional
      { $set: setFields },
      { new: true, runValidators: true }
    );

    if (!updated) {
      res.status(404).json({ message: 'Ingrediente no encontrado en tu alacena' });
      return;
    }

    // Devolver el item actualizado
    const updatedItem = updated.items.find(item => item._id?.toString() === id);

    res.status(200).json({
      message: 'Ingrediente actualizado',
      item: updatedItem,
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error al actualizar ingrediente',
      error: error instanceof Error ? error.message : error,
    });
  }
};

// @route  DELETE /api/inventory/:id
// Elimina un ingrediente con $pull del array
export const deleteItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).userId;
    const { id } = req.params;

    // Verificar que existe antes de borrar
    const inventory = await Inventory.findOne({ userId, 'items._id': id });
    if (!inventory) {
      res.status(404).json({ message: 'Ingrediente no encontrado en tu alacena' });
      return;
    }

    // $pull elimina el subdocumento del array
    await Inventory.findOneAndUpdate(
      { userId },
      { $pull: { items: { _id: id } } }
    );

    res.status(200).json({ message: 'Ingrediente eliminado' });
  } catch (error) {
    res.status(500).json({
      message: 'Error al eliminar ingrediente',
      error: error instanceof Error ? error.message : error,
    });
  }
};

export const addInventoryItem = addItem;