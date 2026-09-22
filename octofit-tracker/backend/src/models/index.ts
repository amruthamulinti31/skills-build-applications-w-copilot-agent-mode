import mongoose, { Schema } from 'mongoose';

const userSchema = new Schema({ username: { type: String, required: true, unique: true, trim: true }, displayName: { type: String, required: true, trim: true }, email: { type: String, required: true, unique: true, lowercase: true, trim: true }, grade: { type: String, required: true }, avatarColor: { type: String, default: '#f97316' }, points: { type: Number, default: 0 }, createdAt: { type: Date, default: Date.now } });
const teamSchema = new Schema({ name: { type: String, required: true, trim: true }, motto: { type: String, default: '' }, captain: { type: Schema.Types.ObjectId, ref: 'User', required: true }, members: [{ type: Schema.Types.ObjectId, ref: 'User' }], createdAt: { type: Date, default: Date.now } });
const activitySchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, type: { type: String, enum: ['running', 'walking', 'strength', 'cycling', 'yoga'], required: true }, durationMinutes: { type: Number, required: true, min: 1 }, distanceKm: { type: Number, default: 0, min: 0 }, notes: { type: String, default: '' }, points: { type: Number, required: true }, completedAt: { type: Date, default: Date.now } });
const leaderboardSchema = new Schema({ user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, points: { type: Number, default: 0 }, activities: { type: Number, default: 0 }, updatedAt: { type: Date, default: Date.now } });
const workoutSchema = new Schema({ title: { type: String, required: true }, description: { type: String, required: true }, category: { type: String, required: true }, level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], required: true }, durationMinutes: { type: Number, required: true }, points: { type: Number, required: true }, equipment: [{ type: String }] });

export const User = mongoose.models.User || mongoose.model('User', userSchema);
export const Team = mongoose.models.Team || mongoose.model('Team', teamSchema);
export const Activity = mongoose.models.Activity || mongoose.model('Activity', activitySchema);
export const Leaderboard = mongoose.models.Leaderboard || mongoose.model('Leaderboard', leaderboardSchema);
export const Workout = mongoose.models.Workout || mongoose.model('Workout', workoutSchema);