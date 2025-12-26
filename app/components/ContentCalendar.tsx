"use client";

import { useEffect, useState } from "react";
import {
  FaChevronLeft,
  FaChevronRight,
  FaLinkedin,
  FaFacebook,
  FaInstagram,
  FaTwitter,
  FaPlus,
} from "react-icons/fa";

interface CalendarPost {
  id: string;
  content: string;
  platforms: string[];
  scheduledFor: string;
  status: string;
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

export default function ContentCalendar({
  onCreatePost,
  onEditPost,
}: {
  onCreatePost?: (date: Date) => void;
  onEditPost?: (post: CalendarPost) => void;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [posts, setPosts] = useState<CalendarPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"month" | "week">("month");

  useEffect(() => {
    fetchPosts();
  }, [currentDate]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/posts/list");
      const data = await response.json();
      const scheduledPosts = (data.posts || []).filter(
        (p: any) => p.status === "scheduled" && p.scheduledFor
      );
      setPosts(scheduledPosts);
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    // Add empty days for the start of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days in the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getPostsForDate = (date: Date | null) => {
    if (!date) return [];
    const dateStr = date.toISOString().split("T")[0];
    return posts.filter((post) => {
      const postDate = new Date(post.scheduledFor).toISOString().split("T")[0];
      return postDate === dateStr;
    });
  };

  const previousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const nextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const monthName = currentDate.toLocaleString("default", { month: "long" });
  const year = currentDate.getFullYear();
  const days = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Calendar Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Content Calendar</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("month")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setView("week")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                view === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Week
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaChevronLeft className="text-gray-600" />
            </button>
            <h3 className="text-xl font-semibold text-gray-900 min-w-[200px] text-center">
              {monthName} {year}
            </h3>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <FaChevronRight className="text-gray-600" />
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-6">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-semibold text-gray-600 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2">
          {days.map((date, index) => {
            const dayPosts = getPostsForDate(date);
            const isToday =
              date && date.toDateString() === today.toDateString();
            const isPast = date && date < today;

            return (
              <div
                key={index}
                className={`min-h-[120px] border rounded-lg p-2 transition-all ${
                  date
                    ? isPast
                      ? "bg-gray-50 border-gray-200"
                      : "bg-white border-gray-300 hover:border-blue-400 hover:shadow-md cursor-pointer"
                    : "bg-transparent border-transparent"
                } ${isToday ? "ring-2 ring-blue-500" : ""}`}
                onClick={() => {
                  if (date && !isPast && onCreatePost) {
                    onCreatePost(date);
                  }
                }}
              >
                {date && (
                  <>
                    <div
                      className={`text-sm font-medium mb-2 ${
                        isToday
                          ? "text-blue-600 font-bold"
                          : isPast
                          ? "text-gray-400"
                          : "text-gray-700"
                      }`}
                    >
                      {date.getDate()}
                    </div>

                    {/* Posts for this day */}
                    <div className="space-y-1">
                      {dayPosts.slice(0, 3).map((post) => (
                        <div
                          key={post.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onEditPost) {
                              onEditPost(post);
                            }
                          }}
                          className="text-xs p-1.5 rounded bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-1 mb-1">
                            {post.platforms.map((platform) => {
                              const Icon = platformIcons[platform];
                              return Icon ? (
                                <Icon
                                  key={platform}
                                  className="text-xs text-gray-600"
                                />
                              ) : null;
                            })}
                          </div>
                          <div className="text-gray-700 line-clamp-2 font-medium">
                            {new Date(post.scheduledFor).toLocaleTimeString(
                              "en-US",
                              { hour: "numeric", minute: "2-digit" }
                            )}
                          </div>
                          <div className="text-gray-600 line-clamp-1">
                            {post.content.substring(0, 30)}...
                          </div>
                        </div>
                      ))}

                      {dayPosts.length > 3 && (
                        <div className="text-xs text-gray-500 text-center py-1">
                          +{dayPosts.length - 3} more
                        </div>
                      )}

                      {dayPosts.length === 0 && !isPast && (
                        <div className="text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <FaPlus className="text-gray-400 mx-auto" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded ring-2 ring-blue-500"></div>
            <span className="text-gray-600">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-50 border border-blue-200"></div>
            <span className="text-gray-600">Scheduled Post</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-50 border border-gray-200"></div>
            <span className="text-gray-600">Past</span>
          </div>
        </div>
      </div>
    </div>
  );
}
