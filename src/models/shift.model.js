import mongoose from 'mongoose';

const shiftSchema = new mongoose.Schema({
  facilityId: { type: mongoose.Schema.Types.ObjectId, ref: 'Facility', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Worker' },
  title: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  status: { type: String, enum: ['open', 'assigned', 'completed'], default: 'open' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shift', shiftSchema);
