'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { dishes, venues } from '@/lib/demoData';

interface Report {
  id: number;
  dish_id: number;
  dish_name: string;
  issue_type: string;
  description: string;
  reported_by: string;
  reported_at: string;
  status: 'pending' | 'reviewed' | 'resolved';
}

interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  reviews_count: number;
  joined_at: string;
  status: 'active' | 'suspended';
}

interface Review {
  id: number;
  dish_name: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
  flagged: boolean;
}

// Demo data
const demoReports: Report[] = [
  { id: 1, dish_id: 5, dish_name: 'Caesar Salad', issue_type: 'wrong_info', description: 'The calorie count seems incorrect. Should be around 200 not 350.', reported_by: 'john@gsu.edu', reported_at: '2024-12-01T10:30:00Z', status: 'pending' },
  { id: 2, dish_id: 12, dish_name: 'Pepperoni Pizza', issue_type: 'allergen_missing', description: 'Missing soy allergen - the dough contains soy lecithin.', reported_by: 'maria@gsu.edu', reported_at: '2024-11-30T14:20:00Z', status: 'reviewed' },
  { id: 3, dish_id: 8, dish_name: 'Grilled Chicken Bowl', issue_type: 'unavailable', description: 'This dish hasnt been available for 2 weeks but still shows on menu.', reported_by: 'alex@gsu.edu', reported_at: '2024-11-28T09:15:00Z', status: 'resolved' },
];

const demoUsers: User[] = [
  { id: 1, email: 'john.smith@gsu.edu', name: 'John Smith', role: 'user', reviews_count: 12, joined_at: '2024-09-01', status: 'active' },
  { id: 2, email: 'maria.garcia@gsu.edu', name: 'Maria Garcia', role: 'user', reviews_count: 28, joined_at: '2024-08-15', status: 'active' },
  { id: 3, email: 'admin@gsu.edu', name: 'Admin User', role: 'admin', reviews_count: 5, joined_at: '2024-01-01', status: 'active' },
  { id: 4, email: 'spam.user@gsu.edu', name: 'Spam Account', role: 'user', reviews_count: 0, joined_at: '2024-11-28', status: 'suspended' },
];

const demoFlaggedReviews: Review[] = [
  { id: 101, dish_name: 'Buddha Bowl', user_name: 'Anonymous', rating: 1, comment: 'This is spam content that should be removed...', created_at: '2024-12-01', flagged: true },
  { id: 102, dish_name: 'Impossible Burger', user_name: 'TrollUser', rating: 1, comment: 'Inappropriate content here...', created_at: '2024-11-30', flagged: true },
];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'menu' | 'reports' | 'users' | 'reviews'>('overview');
  const [reports, setReports] = useState<Report[]>(demoReports);
  const [users, setUsers] = useState<User[]>(demoUsers);
  const [flaggedReviews, setFlaggedReviews] = useState<Review[]>(demoFlaggedReviews);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [editingDish, setEditingDish] = useState<number | null>(null);

  // Simple admin auth (in production, use proper auth)
  const handleLogin = () => {
    if (adminPassword === 'admin123' || adminPassword === 'demo') {
      setIsAuthenticated(true);
    } else {
      alert('Invalid password. Hint: try "demo"');
    }
  };

  // Stats
  const stats = {
    totalDishes: dishes.length,
    totalVenues: venues.length,
    pendingReports: reports.filter(r => r.status === 'pending').length,
    totalUsers: users.length,
    flaggedReviews: flaggedReviews.length,
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen mesh-gradient flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 w-full max-w-md animate-slide-up">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4 animate-float">🔐</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Access</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Enter admin password to continue</p>
          </div>
          <div className="relative mb-6">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">🔑</span>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              placeholder="Password"
              className="w-full pl-12 pr-4 py-3.5 bg-white/50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
            />
          </div>
          <button
            onClick={handleLogin}
            className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-orange-500/30 transition-all hover:scale-[1.02]"
          >
            Login
          </button>
          <p className="text-center text-gray-500 dark:text-gray-400 text-sm mt-6">
            Demo password: <code className="bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded font-mono">demo</code>
          </p>
        </div>
      </div>
    );
  }

  const handleReportStatusChange = (reportId: number, status: Report['status']) => {
    setReports(reports.map(r => r.id === reportId ? { ...r, status } : r));
  };

  const handleUserStatusToggle = (userId: number) => {
    setUsers(users.map(u => 
      u.id === userId 
        ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } 
        : u
    ));
  };

  const handleDeleteReview = (reviewId: number) => {
    setFlaggedReviews(flaggedReviews.filter(r => r.id !== reviewId));
  };

  const handleApproveReview = (reviewId: number) => {
    setFlaggedReviews(flaggedReviews.filter(r => r.id !== reviewId));
    // In production, this would unflag the review
  };

  return (
    <div className="min-h-screen mesh-gradient">
      {/* Top Bar */}
      <div className="glass border-b border-gray-200 dark:border-gray-700 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-orange-500 hover:text-orange-600 font-medium transition-colors">
              ← Back to Site
            </Link>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">🛡️ Admin Dashboard</h1>
          </div>
          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-white text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: '📊 Overview', count: null },
            { id: 'menu', label: '🍽️ Menu Management', count: stats.totalDishes },
            { id: 'reports', label: '🚨 Reports', count: stats.pendingReports },
            { id: 'users', label: '👥 Users', count: stats.totalUsers },
            { id: 'reviews', label: '⚠️ Flagged Reviews', count: stats.flaggedReviews },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`px-5 py-2.5 rounded-xl font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/25'
                  : 'bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:shadow-lg border border-gray-200 dark:border-gray-700'
              }`}
            >
              {tab.label}
              {tab.count !== null && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Dashboard Overview</h2>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <div className="glass-card rounded-2xl p-6 hover-lift">
                <div className="text-4xl font-bold gradient-text">{stats.totalDishes}</div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">Total Dishes</div>
              </div>
              <div className="glass-card rounded-2xl p-6 hover-lift">
                <div className="text-4xl font-bold text-blue-500">{stats.totalVenues}</div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">Dining Venues</div>
              </div>
              <div className="glass-card rounded-2xl p-6 hover-lift">
                <div className="text-4xl font-bold text-yellow-500">{stats.pendingReports}</div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">Pending Reports</div>
              </div>
              <div className="glass-card rounded-2xl p-6 hover-lift">
                <div className="text-4xl font-bold text-purple-500">{stats.totalUsers}</div>
                <div className="text-gray-600 dark:text-gray-400 mt-1">Registered Users</div>
              </div>
            </div>

            {/* Quick Actions */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button
                onClick={() => setActiveTab('menu')}
                className="glass-card p-5 rounded-2xl hover-lift transition-all text-left group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">➕</div>
                <div className="font-semibold text-gray-900 dark:text-white">Add New Dish</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">Add to menu</div>
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className="glass-card p-5 rounded-2xl hover-lift transition-all text-left group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📋</div>
                <div className="font-semibold text-gray-900 dark:text-white">Review Reports</div>
                <div className="text-sm text-orange-500 font-medium">{stats.pendingReports} pending</div>
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className="glass-card p-5 rounded-2xl hover-lift transition-all text-left group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">👤</div>
                <div className="font-semibold text-gray-900 dark:text-white">Manage Users</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">{stats.totalUsers} users</div>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className="glass-card p-5 rounded-2xl hover-lift transition-all text-left group"
              >
                <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">🚫</div>
                <div className="font-semibold text-gray-900 dark:text-white">Moderate Reviews</div>
                <div className="text-sm text-red-500 font-medium">{stats.flaggedReviews} flagged</div>
              </button>
            </div>

            {/* Recent Activity */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-8 mb-4">Recent Activity</h3>
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/30">
                <span className="text-yellow-500">🚨</span>
                <span className="text-gray-700 dark:text-gray-300">New report submitted for Caesar Salad</span>
                <span className="text-gray-400 ml-auto">2 hours ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/30">
                <span className="text-green-500">✅</span>
                <span className="text-gray-700 dark:text-gray-300">Report resolved: Grilled Chicken Bowl</span>
                <span className="text-gray-400 ml-auto">5 hours ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/30">
                <span className="text-blue-500">👤</span>
                <span className="text-gray-700 dark:text-gray-300">New user registered: john.smith@gsu.edu</span>
                <span className="text-gray-400 ml-auto">1 day ago</span>
              </div>
              <div className="flex items-center gap-3 text-sm p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30">
                <span className="text-red-500">🗑️</span>
                <span className="text-gray-700 dark:text-gray-300">Spam review deleted from Buddha Bowl</span>
                <span className="text-gray-400 ml-auto">2 days ago</span>
              </div>
            </div>
          </div>
        )}

        {/* Menu Management Tab */}
        {activeTab === 'menu' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Menu Management</h2>
              <button className="btn-primary">
                + Add New Dish
              </button>
            </div>

            {/* Venue Filter */}
            <div className="flex gap-2 mb-6 flex-wrap">
              <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-orange-500/25">All Venues</button>
              {venues.map(venue => (
                <button key={venue.venue_id} className="px-4 py-2 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-medium hover:shadow-lg border border-gray-200 dark:border-gray-700 transition-all">
                  {venue.name}
                </button>
              ))}
            </div>

            {/* Dishes Table */}
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Dish</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Venue</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Calories</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Rating</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dishes.slice(0, 15).map(dish => (
                    <tr key={dish.dish_id} className="hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{dish.name}</div>
                        <div className="text-sm text-gray-500">{dish.meal_type}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{dish.venue_name}</td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{dish.calories}</td>
                      <td className="px-4 py-3">
                        <span className="text-yellow-500 font-semibold">★ {dish.avg_rating}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setEditingDish(dish.dish_id)}
                            className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium transition-colors"
                          >
                            Edit
                          </button>
                          <button className="px-3 py-1.5 text-xs bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium transition-colors">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-gray-500 text-sm mt-4">Showing 15 of {dishes.length} dishes</p>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Menu Reports</h2>
            
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="glass-card rounded-2xl p-6 hover-lift">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white text-lg">{report.dish_name}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          report.issue_type === 'wrong_info' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                          report.issue_type === 'allergen_missing' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' :
                          'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        }`}>
                          {report.issue_type.replace('_', ' ')}
                        </span>
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          report.status === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' :
                          report.status === 'reviewed' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                          'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                        }`}>
                          {report.status}
                        </span>
                      </div>
                    </div>
                    <span className="text-gray-500 text-sm bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                      {new Date(report.reported_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">{report.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500 text-sm">Reported by: <span className="text-orange-500">{report.reported_by}</span></span>
                    <div className="flex gap-2">
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleReportStatusChange(report.id, 'reviewed')}
                            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-xl font-medium hover:bg-blue-600 transition-colors"
                          >
                            Mark Reviewed
                          </button>
                          <button
                            onClick={() => handleReportStatusChange(report.id, 'resolved')}
                            className="px-4 py-2 bg-green-500 text-white text-sm rounded-xl font-medium hover:bg-green-600 transition-colors"
                          >
                            Resolve
                          </button>
                        </>
                      )}
                      {report.status === 'reviewed' && (
                        <button
                          onClick={() => handleReportStatusChange(report.id, 'resolved')}
                          className="px-4 py-2 bg-green-500 text-white text-sm rounded-xl font-medium hover:bg-green-600 transition-colors"
                        >
                          Mark Resolved
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">User Management</h2>
            
            <div className="glass-card rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-100 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">User</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Role</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Reviews</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Joined</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map(user => (
                    <tr key={user.id} className="hover:bg-orange-50/50 dark:hover:bg-orange-900/10 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          user.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{user.reviews_count}</td>
                      <td className="px-4 py-3 text-gray-500">{user.joined_at}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                          user.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleUserStatusToggle(user.id)}
                          className={`px-4 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                            user.status === 'active' 
                              ? 'bg-red-500 text-white hover:bg-red-600' 
                              : 'bg-green-500 text-white hover:bg-green-600'
                          }`}
                        >
                          {user.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Flagged Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Flagged Reviews</h2>
            
            {flaggedReviews.length === 0 ? (
              <div className="glass-card text-center py-16 rounded-2xl">
                <div className="text-6xl mb-4 animate-float">✅</div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">All Clear!</h3>
                <p className="text-gray-500 dark:text-gray-400">No flagged reviews to moderate</p>
              </div>
            ) : (
              <div className="space-y-4">
                {flaggedReviews.map(review => (
                  <div key={review.id} className="glass-card rounded-2xl p-6 border-l-4 border-red-500 hover-lift">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{review.dish_name}</h3>
                        <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                          <span>By: <span className="text-orange-500">{review.user_name}</span></span>
                          <span>•</span>
                          <span className="text-yellow-500 font-medium">★ {review.rating}</span>
                          <span>•</span>
                          <span>{review.created_at}</span>
                        </div>
                      </div>
                      <span className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-full font-medium">
                        Flagged
                      </span>
                    </div>
                    
                    <p className="text-gray-700 dark:text-gray-300 mb-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-l-4 border-gray-300 dark:border-gray-600 italic">
                      &ldquo;{review.comment}&rdquo;
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleApproveReview(review.id)}
                        className="px-4 py-2 bg-green-500 text-white text-sm rounded-xl font-medium hover:bg-green-600 transition-colors"
                      >
                        ✓ Approve (Unflag)
                      </button>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        className="px-4 py-2 bg-red-500 text-white text-sm rounded-xl font-medium hover:bg-red-600 transition-colors"
                      >
                        🗑️ Delete Review
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
