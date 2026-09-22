import 'dotenv/config';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import { connectDatabase } from './config/database';
import { Activity, Leaderboard, Team, User, Workout } from './models';

const app = express();
const port = Number(process.env.PORT || 8000);
const pointMultipliers: Record<string, number> = { running: 2, walking: 1, strength: 3, cycling: 2, yoga: 2 };
app.use(cors());
app.use(express.json());
app.get('/api/health', (_request, response) => response.json({ status: 'ok', service: 'octofit-api' }));

app.get('/api/users/', async (_request, response, next) => { try { response.json(await User.find().sort({ points: -1 }).select('-__v')); } catch (error) { next(error); } });
app.post('/api/users/', async (request, response, next) => { try { const user = await User.create(request.body); await Leaderboard.create({ user: user._id }); response.status(201).json(user); } catch (error) { next(error); } });
app.get('/api/users/:id', async (request, response, next) => { try { const user = await User.findById(request.params.id); if (!user) return response.status(404).json({ message: 'User not found' }); response.json(user); } catch (error) { next(error); } });
app.patch('/api/users/:id', async (request, response, next) => { try { const allowedFields = ['displayName', 'email', 'grade', 'avatarColor']; const updates = Object.fromEntries(Object.entries(request.body).filter(([key]) => allowedFields.includes(key))); const user = await User.findByIdAndUpdate(request.params.id, updates, { new: true, runValidators: true }).select('-__v'); if (!user) return response.status(404).json({ message: 'User not found' }); response.json(user); } catch (error) { next(error); } });
app.get('/api/teams/', async (_request, response, next) => { try { response.json(await Team.find().populate('captain members', 'displayName username avatarColor')); } catch (error) { next(error); } });
app.post('/api/teams/', async (request, response, next) => { try { const { name, motto, captain, members = [] } = request.body; const team = await Team.create({ name, motto, captain, members: [...new Set([captain, ...members])] }); response.status(201).json(await team.populate('captain members', 'displayName username avatarColor')); } catch (error) { next(error); } });
app.post('/api/teams/:id/members', async (request, response, next) => { try { const team = await Team.findByIdAndUpdate(request.params.id, { $addToSet: { members: request.body.userId } }, { new: true }).populate('captain members', 'displayName username avatarColor'); if (!team) return response.status(404).json({ message: 'Team not found' }); response.json(team); } catch (error) { next(error); } });
app.get('/api/activities/', async (request, response, next) => { try { const query = request.query.user ? { user: request.query.user } : {}; response.json(await Activity.find(query).populate('user', 'displayName username').sort({ completedAt: -1 })); } catch (error) { next(error); } });
app.post('/api/activities/', async (request, response, next) => { try { const { user, type, durationMinutes, distanceKm, notes, completedAt } = request.body; const points = Math.round(Number(durationMinutes) * (pointMultipliers[type] || 1)); const activity = await Activity.create({ user, type, durationMinutes, distanceKm, notes, completedAt, points }); await User.findByIdAndUpdate(user, { $inc: { points } }); await Leaderboard.findOneAndUpdate({ user }, { $inc: { points, activities: 1 }, $set: { updatedAt: new Date() } }, { upsert: true }); response.status(201).json(await activity.populate('user', 'displayName username')); } catch (error) { next(error); } });
app.get('/api/leaderboard/', async (_request, response, next) => { try { const entries = await Leaderboard.find().populate('user', 'displayName username avatarColor').sort({ points: -1 }).limit(50); response.json(entries.map((entry, index) => ({ rank: index + 1, ...entry.toObject() }))); } catch (error) { next(error); } });
app.get('/api/workouts/', async (request, response, next) => { try { const level = typeof request.query.level === 'string' ? request.query.level : undefined; response.json(await Workout.find(level ? { level } : {}).sort({ points: 1 })); } catch (error) { next(error); } });
app.get('/api/workouts/suggestions/:userId', async (request, response, next) => { try { const user = await User.findById(request.params.userId).select('points'); if (!user) return response.status(404).json({ message: 'User not found' }); const level = user.points >= 200 ? 'advanced' : user.points >= 100 ? 'intermediate' : 'beginner'; const workouts = await Workout.find({ level }).sort({ points: 1 }); response.json({ level, workouts }); } catch (error) { next(error); } });
app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => { console.error(error); response.status(400).json({ message: error.message || 'Request failed' }); });

if (require.main === module) { connectDatabase().then(() => app.listen(port, '0.0.0.0', () => console.log(`OctoFit API listening on port ${port}`))).catch((error) => { console.error('Unable to start API', error); process.exit(1); }); }
export default app;