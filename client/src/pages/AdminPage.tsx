import React, { useState, useEffect } from 'react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
// Custom styling for DatePicker to match dark theme
import '../components/datepicker-custom.css';

const AdminPage = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [eventTitle, setEventTitle] = useState("");
    const [eventStartTime, setEventStartTime] = useState<Date | null>(null);
    const [eventDuration, setEventDuration] = useState(30);
    const [currentEvent, setCurrentEvent] = useState<any>(null);
    const [statusMessage, setStatusMessage] = useState("");

    // Use VITE_API_URL from environment (set to '/' in production)
    // If not set, default to localhost:3000 for local dev
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Simple client-side check for UX, but real check is on API
        if (username === "admin123" && password === "duytuan123") {
            setIsLoggedIn(true);
            fetchStatus();
        } else {
            setStatusMessage("Invalid credentials (try admin123 / duytuan123)");
        }
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/status`);
            const data = await res.json();
            setCurrentEvent(data.event);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (isLoggedIn) {
            const interval = setInterval(fetchStatus, 5000);
            return () => clearInterval(interval);
        }
    }, [isLoggedIn]);

    const handleStartEvent = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/start-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password, title: eventTitle, startTime: eventStartTime, duration: eventDuration })
            });
            const data = await res.json();
            if (data.success) {
                setCurrentEvent(data.event);
                setStatusMessage("Event started successfully!");
                setEventTitle("");
            } else {
                setStatusMessage(`Error: ${data.error}`);
            }
        } catch (err) {
            setStatusMessage("Failed to connect to server");
        }
    };

    const handleEndEvent = async () => {
        try {
            const res = await fetch(`${API_URL}/api/admin/end-event`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (data.success) {
                setCurrentEvent(null);
                setStatusMessage("Event ended.");
            } else {
                setStatusMessage(`Error: ${data.error}`);
            }
        } catch (err) {
            setStatusMessage("Failed to connect to server");
        }
    };

    if (!isLoggedIn) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white font-sans p-4">
                <div className="bg-gray-800 p-8 rounded-lg shadow-xl w-full max-w-md border border-gray-700">
                    <h1 className="text-2xl font-bold mb-6 text-purple-400 text-center">Pixel Office Admin</h1>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm mb-1 text-gray-400">Username</label>
                            <input
                                type="text"
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm mb-1 text-gray-400">Password</label>
                            <input
                                type="password"
                                className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                            />
                        </div>
                        {statusMessage && <p className="text-red-400 text-sm">{statusMessage}</p>}
                        <button className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded transition-colors">
                            Login
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-gray-900 text-white font-sans p-8">
            <div className="w-full max-w-4xl">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-purple-400">Admin Dashboard</h1>
                    <button
                        onClick={() => setIsLoggedIn(false)}
                        className="text-gray-400 hover:text-white underline"
                    >
                        Logout
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Status Panel */}
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-300">Live Status</h2>
                        {currentEvent ? (() => {
                            const startTime = new Date(currentEvent.startTime).getTime();
                            const endTime = startTime + (currentEvent.duration * 60 * 1000);
                            const now = Date.now();
                            const isEnded = now > endTime;
                            const timeLeftMinutes = Math.ceil((endTime - now) / 60000);

                            return (
                                <div className={`${isEnded ? 'bg-red-900/30 border-red-500/50' : 'bg-green-900/30 border-green-500/50'} border p-4 rounded text-center`}>
                                    {isEnded ? (
                                        <div className="text-red-500 font-bold text-lg mb-2">● EVENT ENDED</div>
                                    ) : (
                                        <div className="text-green-400 font-bold text-lg mb-2 animate-pulse">● EVENT LIVE</div>
                                    )}

                                    <div className="text-2xl font-bold text-white mb-1">{currentEvent.title}</div>
                                    <div className="text-sm text-gray-400">Room: {currentEvent.roomId}</div>
                                    <div className="text-sm text-gray-400">Host: {currentEvent.hostName}</div>

                                    <div className={`mt-2 font-mono text-sm ${isEnded ? 'text-red-400' : 'text-green-300'}`}>
                                        {isEnded ? `Expired ${Math.abs(timeLeftMinutes)} mins ago` : `Ends in ${timeLeftMinutes} mins`}
                                    </div>

                                    <div className="flex gap-2 justify-center mt-4">
                                        <a
                                            href="/"
                                            target="_blank"
                                            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded font-bold transition-colors"
                                        >
                                            Go to Stage
                                        </a>
                                        <button
                                            onClick={handleEndEvent}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded font-bold transition-colors"
                                        >
                                            End Event
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        * To broadcast: Join game, go to stage, type <span className="text-purple-400 font-mono">/host duytuan123</span> in chat.
                                    </p>
                                </div>
                            );
                        })() : (
                            <div className="bg-gray-700/30 border border-gray-600 p-4 rounded text-center text-gray-400">
                                No event active. Stage is empty.
                            </div>
                        )}
                        {statusMessage && <p className="mt-4 text-yellow-400 text-center">{statusMessage}</p>}
                    </div>

                    {/* Controls Panel */}
                    <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
                        <h2 className="text-xl font-bold mb-4 text-gray-300">Schedule New Event</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm mb-1 text-gray-400">Event Title</label>
                                <input
                                    type="text"
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                    placeholder="e.g. Weekly All-Hands"
                                    value={eventTitle}
                                    onChange={e => setEventTitle(e.target.value)}
                                    disabled={!!currentEvent}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm mb-1 text-gray-400">Launch Time</label>
                                    <DatePicker
                                        selected={eventStartTime}
                                        onChange={(date: Date | null) => setEventStartTime(date)}
                                        showTimeSelect
                                        minDate={new Date()}
                                        filterTime={(date) => new Date() < date}
                                        dateFormat="MMMM d, yyyy h:mm aa"
                                        placeholderText="Select Launch Time"
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none text-white appearance-none"
                                        disabled={!!currentEvent}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Leave empty for "Start Now"</p>
                                </div>
                                <div>
                                    <label className="block text-sm mb-1 text-gray-400">Duration (mins)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={eventDuration}
                                        onChange={e => setEventDuration(Number(e.target.value))}
                                        min={1}
                                        disabled={!!currentEvent}
                                    />
                                </div>
                            </div>

                            <div className="text-sm text-gray-500">
                                * Starting an event will generate a secure Jitsi room and notify all connected players.
                            </div>
                            <button
                                onClick={handleStartEvent}
                                disabled={!eventTitle || !!currentEvent}
                                className={`w-full py-2 rounded font-bold transition-colors ${!eventTitle || !!currentEvent
                                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                    : "bg-purple-600 hover:bg-purple-500 text-white"
                                    }`}
                            >
                                {eventStartTime ? "Schedule Event" : "Start Live Event"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default AdminPage;
