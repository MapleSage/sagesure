"use client";

import { useEffect, useState } from "react";
import {
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaFileAlt,
  FaLinkedin,
  FaFacebook,
  FaInstagram,
  FaTwitter,
} from "react-icons/fa";

interface AnalyticsData {
  overview: {
    totalPosts: number;
    publishedPosts: number;
    scheduledPosts: number;
    draftPosts: number;
  };
  platformCounts: Record<string, number>;
  chartData: { date: string; posts: number }[];
  platformPerformance: {
    platform: string;
    posts: number;
    engagement: number;
    reach: number;
  }[];
}

const platformIcons: Record<string, any> = {
  linkedin: FaLinkedin,
  facebook: FaFacebook,
  instagram: FaInstagram,
  twitter: FaTwitter,
};

const platformColors: Record<string, string> = {
  linkedin: "bg-blue-500",
  facebook: "bg-blue-600",
  instagram: "bg-pink-500",
  twitter: "bg-sky-500",
};

export default function AnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/analytics/overview?days=${timeRange}`
      );
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center text-gray-500 py-12">
        No analytics data available
      </div>
    );
  }

  const maxPosts = Math.max(...analytics.chartData.map((d) => d.posts), 1);

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === days
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {days} days
            </button>
          ))}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Total Posts</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.overview.totalPosts}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <FaChartLine className="text-2xl text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Published</p>
              <p className="text-3xl font-bold text-green-600">
                {analytics.overview.publishedPosts}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <FaCheckCircle className="text-2xl text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Scheduled</p>
              <p className="text-3xl font-bold text-orange-600">
                {analytics.overview.scheduledPosts}
              </p>
            </div>
            <div className="bg-orange-100 rounded-full p-3">
              <FaClock className="text-2xl text-orange-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Drafts</p>
              <p className="text-3xl font-bold text-gray-600">
                {analytics.overview.draftPosts}
              </p>
            </div>
            <div className="bg-gray-100 rounded-full p-3">
              <FaFileAlt className="text-2xl text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Posts Timeline Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Posts Over Time
        </h3>
        <div className="space-y-2">
          <div className="flex items-end gap-1 h-48">
            {analytics.chartData.map((day) => {
              const height = (day.posts / maxPosts) * 100;
              return (
                <div key={day.date} className="flex-1 flex flex-col items-center group">
                  <div className="relative w-full">
                    <div
                      className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                      style={{ height: `${Math.max(height, 2)}px` }}
                      title={`${day.date}: ${day.posts} posts`}
                    ></div>
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {new Date(day.date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                      : {day.posts} posts
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-xs text-gray-500 pt-2 border-t">
            <span>
              {new Date(analytics.chartData[0]?.date).toLocaleDateString(
                "en-US",
                { month: "short", day: "numeric" }
              )}
            </span>
            <span>
              {new Date(
                analytics.chartData[analytics.chartData.length - 1]?.date
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Platform Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(analytics.platformCounts).map(
              ([platform, count]) => {
                const percentage =
                  (count / analytics.overview.totalPosts) * 100;
                const Icon = platformIcons[platform];
                const colorClass = platformColors[platform];

                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {Icon && <Icon className="text-lg" />}
                        <span className="text-sm font-medium capitalize">
                          {platform}
                        </span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`${colorClass} h-2 rounded-full transition-all`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>

        {/* Platform Performance Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Platform Performance
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-500 border-b">
                  <th className="pb-2">Platform</th>
                  <th className="pb-2 text-right">Posts</th>
                  <th className="pb-2 text-right">Engagement</th>
                  <th className="pb-2 text-right">Reach</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {analytics.platformPerformance.map((perf) => {
                  const Icon = platformIcons[perf.platform];
                  return (
                    <tr
                      key={perf.platform}
                      className="border-b last:border-0"
                    >
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          {Icon && <Icon className="text-lg" />}
                          <span className="font-medium capitalize">
                            {perf.platform}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right">{perf.posts}</td>
                      <td className="py-3 text-right">
                        {perf.engagement.toLocaleString()}
                      </td>
                      <td className="py-3 text-right">
                        {perf.reach.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            * Engagement and reach data are estimates. Connect platform analytics
            for accurate metrics.
          </p>
        </div>
      </div>
    </div>
  );
}
