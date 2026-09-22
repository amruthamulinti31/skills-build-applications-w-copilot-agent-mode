import 'dotenv/config';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { Activity, Leaderboard, Team, User, Workout } from '../models';

/**
 * Seed the octofit_db database with test data
 */
async function seedDatabase() {
  await connectDatabase();
  await Promise.all([User.deleteMany({}), Team.deleteMany({}), Activity.deleteMany({}), Leaderboard.deleteMany({}), Workout.deleteMany({})]);
  const users = await User.create([
    { username: 'maya', displayName: 'Maya Chen', email: 'maya@example.com', grade: '10th', avatarColor: '#f97316' },
    { username: 'jordan', displayName: 'Jordan Brooks', email: 'jordan@example.com', grade: '11th', avatarColor: '#0f766e' },
    { username: 'sam', displayName: 'Sam Rivera', email: 'sam@example.com', grade: '9th', avatarColor: '#7c3aed' },
    { username: 'alex', displayName: 'Alex Morgan', email: 'alex@example.com', grade: '12th', avatarColor: '#0284c7' }
  ]);
  await Team.create([{ name: 'The Fast Felines', motto: 'Small steps, big strides.', captain: users[0]._id, members: users.slice(0, 2).map((user) => user._id) }, { name: 'Peak Performers', motto: 'Show up. Level up.', captain: users[2]._id, members: users.slice(2).map((user) => user._id) }]);
  const activities = await Activity.create([{ user: users[0]._id, type: 'running', durationMinutes: 28, distanceKm: 4.2, notes: 'Easy loop after school', points: 56 }, { user: users[1]._id, type: 'strength', durationMinutes: 32, notes: 'Full body circuit', points: 96 }, { user: users[2]._id, type: 'walking', durationMinutes: 45, distanceKm: 3.5, notes: 'Walk with the family', points: 45 }, { user: users[3]._id, type: 'cycling', durationMinutes: 40, distanceKm: 12, notes: 'Trail ride', points: 80 }]);
  await Leaderboard.create(users.map((user) => { const userActivities = activities.filter((activity) => String(activity.user) === String(user._id)); return { user: user._id, points: userActivities.reduce((total, activity) => total + activity.points, 0), activities: userActivities.length }; }));
  await User.bulkWrite(users.map((user) => ({ updateOne: { filter: { _id: user._id }, update: { $set: { points: activities.filter((activity) => String(activity.user) === String(user._id)).reduce((total, activity) => total + activity.points, 0) } } } })));
  await Workout.create([{ title: 'Launch Pad', description: 'A friendly full-body circuit to build a steady base.', category: 'Strength', level: 'beginner', durationMinutes: 18, points: 36, equipment: ['mat'] }, { title: 'Quick Feet', description: 'Short intervals that sharpen your pace and confidence.', category: 'Cardio', level: 'intermediate', durationMinutes: 24, points: 48, equipment: ['cones'] }, { title: 'Power Hour', description: 'A challenging mix of strength and conditioning.', category: 'Strength', level: 'advanced', durationMinutes: 42, points: 126, equipment: ['mat', 'dumbbells'] }]);
  console.log(`Seeded ${users.length} users, ${activities.length} activities, and 3 workouts`);
  await disconnectDatabase();
}

seedDatabase().catch(async (error) => { console.error('Error seeding database:', error); await disconnectDatabase(); process.exit(1); });
