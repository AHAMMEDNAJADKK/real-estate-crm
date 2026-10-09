import Property from '../../models/Property.js';
import Project from '../../models/Project.js';
import AuditLog from '../../models/AuditLog.js';

export class PropertiesService {
  static async getProperties(query = {}) {
    const {
      page = 1,
      limit = 20,
      project,
      status,
      propertyType,
      minPrice,
      maxPrice,
      search
    } = query;

    const filter = {};
    if (project) filter.project = project;
    if (status) filter.status = status;
    if (propertyType) filter.propertyType = propertyType;

    if (minPrice || maxPrice) {
      filter.listedPrice = {};
      if (minPrice) filter.listedPrice.$gte = Number(minPrice);
      if (maxPrice) filter.listedPrice.$lte = Number(maxPrice);
    }

    if (search) {
      filter.$or = [
        { unitNumber: { $regex: search, $options: 'i' } },
        { blockOrTower: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [properties, total] = await Promise.all([
      Property.find(filter)
        .populate('project', 'name code location developer')
        .sort({ unitNumber: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Property.countDocuments(filter)
    ]);

    return {
      properties,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async createProperty(data, user) {
    const block = data.blockOrTower || 'Tower A';
    const existing = await Property.findOne({
      project: data.project,
      blockOrTower: block,
      unitNumber: data.unitNumber
    });
    if (existing) {
      const err = new Error(`Unit ${data.unitNumber} in ${block} already exists for this project.`);
      err.statusCode = 409;
      throw err;
    }

    const property = new Property(data);
    await property.save();

    // Increment project total units and available units
    await Project.findByIdAndUpdate(data.project, {
      $inc: { totalUnits: 1, availableUnits: 1 }
    });

    await AuditLog.create({
      user: user._id,
      action: 'PROPERTY_CREATED',
      entity: 'Property',
      entityId: property._id.toString(),
      details: { unitNumber: property.unitNumber, project: property.project, listedPrice: property.listedPrice }
    });

    return property;
  }

  static async getPropertyById(id) {
    const property = await Property.findById(id)
      .populate('project', 'name code developer location amenities')
      .populate({
        path: 'currentBooking',
        populate: { path: 'customer', select: 'name phone email' }
      });

    if (!property) throw new Error('Property unit not found');
    return property;
  }

  static async updateProperty(id, data, user) {
    const property = await Property.findById(id);
    if (!property) throw new Error('Property unit not found');

    const previousStatus = property.status;
    Object.assign(property, data);
    await property.save();

    // If status changed to/from Available, update project availableUnits count
    if (data.status && data.status !== previousStatus) {
      if (previousStatus === 'Available' && data.status !== 'Available') {
        await Project.findByIdAndUpdate(property.project, { $inc: { availableUnits: -1 } });
      } else if (previousStatus !== 'Available' && data.status === 'Available') {
        await Project.findByIdAndUpdate(property.project, { $inc: { availableUnits: 1 } });
      }
    }

    await AuditLog.create({
      user: user._id,
      action: 'PROPERTY_UPDATED',
      entity: 'Property',
      entityId: property._id.toString(),
      details: { changes: Object.keys(data), previousStatus, newStatus: property.status }
    });

    return property;
  }
}
