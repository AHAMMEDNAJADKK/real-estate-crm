import mongoose from 'mongoose';
import Project from '../../models/Project.js';
import Property from '../../models/Property.js';
import Booking from '../../models/Booking.js';
import AuditLog from '../../models/AuditLog.js';

export class ProjectsService {
  static async getProjects(query = {}) {
    const { page = 1, limit = 20, status, projectType, city, search } = query;
    const filter = {};

    if (status) filter.status = status;
    if (projectType) filter.projectType = projectType;
    if (city) filter['location.city'] = new RegExp(city, 'i');

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
        { developer: { $regex: search, $options: 'i' } },
        { 'location.locality': { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [projects, total] = await Promise.all([
      Project.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Project.countDocuments(filter)
    ]);

    return {
      projects,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async createProject(data, user) {
    const project = new Project(data);
    await project.save();

    await AuditLog.create({
      user: user._id,
      action: 'PROJECT_CREATED',
      entity: 'Project',
      entityId: project._id.toString(),
      details: { name: project.name, code: project.code }
    });

    return project;
  }

  static async getProjectById(id) {
    const project = await Project.findById(id);
    if (!project) throw new Error('Project not found');

    const [totalUnits, availableUnits, reservedUnits, bookedUnits] = await Promise.all([
      Property.countDocuments({ project: id }),
      Property.countDocuments({ project: id, status: 'Available' }),
      Property.countDocuments({ project: id, status: 'Reserved' }),
      Property.countDocuments({ project: id, status: { $in: ['Booked', 'Sold'] } })
    ]);

    return {
      project,
      inventoryStats: { totalUnits, availableUnits, reservedUnits, bookedUnits }
    };
  }

  static async updateProject(id, data, user) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Valid Project ID is required');
    }

    // If project code is updated, check for duplicate code
    if (data.code) {
      const duplicate = await Project.findOne({ code: data.code.toUpperCase(), _id: { $ne: id } });
      if (duplicate) {
        throw new Error(`Project code ${data.code} already exists for project "${duplicate.name}"`);
      }
      data.code = data.code.toUpperCase();
    }

    const project = await Project.findByIdAndUpdate(id, data, { returnDocument: 'after', runValidators: true });
    if (!project) throw new Error('Project not found');

    await AuditLog.create({
      user: user._id,
      action: 'PROJECT_UPDATED',
      entity: 'Project',
      entityId: project._id.toString(),
      details: { changes: Object.keys(data), name: project.name }
    });

    return project;
  }

  static async deleteProject(id, user) {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw new Error('Valid Project ID is required');
    }

    if (!['superadmin', 'super_admin', 'admin', 'property_manager'].includes(user.role)) {
      throw new Error('Unauthorized: Only administrators and property managers can delete projects');
    }

    const project = await Project.findById(id);
    if (!project) throw new Error('Project not found');

    // Referential integrity check: check associated properties and bookings
    const [propertiesCount, bookingsCount] = await Promise.all([
      Property.countDocuments({ project: id }),
      Booking.countDocuments({ project: id })
    ]);

    if (propertiesCount > 0 || bookingsCount > 0) {
      throw new Error(
        `Cannot delete project "${project.name}". It has ${propertiesCount} inventory unit(s) and ${bookingsCount} booking(s) linked to it. Delete or reassign associated units first.`
      );
    }

    await Project.findByIdAndDelete(id);

    await AuditLog.create({
      user: user._id,
      action: 'PROJECT_DELETED',
      entity: 'Project',
      entityId: id.toString(),
      details: { name: project.name, code: project.code }
    });

    return { message: 'Project deleted successfully', id };
  }
}
