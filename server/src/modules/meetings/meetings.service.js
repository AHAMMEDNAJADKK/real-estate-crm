import Meeting from '../../models/Meeting.js';
import Notification from '../../models/Notification.js';

export class MeetingsService {
  static async getMeetings(query = {}, user) {
    const { page = 1, limit = 20, status, date } = query;
    const filter = {};

    if (['telecaller', 'sales_executive'].includes(user.role)) {
      filter.assignedEmployee = user._id;
    }

    if (status) filter.status = status;
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      filter.scheduledDate = { $gte: startOfDay, $lte: endOfDay };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [meetings, total] = await Promise.all([
      Meeting.find(filter)
        .populate('assignedEmployee', 'name email role')
        .populate('lead', 'leadName phone status')
        .populate('customer', 'name phone email')
        .populate('project', 'name code')
        .populate('property', 'unitNumber propertyType')
        .sort({ scheduledDate: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Meeting.countDocuments(filter)
    ]);

    return {
      meetings,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), totalPages: Math.ceil(total / parseInt(limit)) }
    };
  }

  static async createMeeting(data, user) {
    const meeting = new Meeting({
      ...data,
      assignedEmployee: data.assignedEmployee || user._id
    });
    await meeting.save();

    if (meeting.assignedEmployee.toString() !== user._id.toString()) {
      await Notification.create({
        recipient: meeting.assignedEmployee,
        title: 'New Meeting Scheduled',
        message: `Meeting "${meeting.title}" scheduled for ${new Date(meeting.scheduledDate).toLocaleDateString()} at ${meeting.time}`,
        type: 'meeting',
        link: '/meetings'
      });
    }

    return meeting;
  }

  static async updateMeeting(id, data) {
    const meeting = await Meeting.findById(id);
    if (!meeting) throw new Error('Meeting not found');

    Object.assign(meeting, data);
    await meeting.save();
    return meeting;
  }
}
