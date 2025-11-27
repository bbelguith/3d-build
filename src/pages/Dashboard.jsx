import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  LogOut,
  Home,
  MessageSquare,
  CheckCircle2,
  XCircle,
  LayoutDashboard,
  Search,
  ArrowLeft
} from "lucide-react";
import { toast } from "react-toastify";

// --- TOGGLE SWITCH COMPONENT ---
const ToggleSwitch = ({ checked, onChange, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    onClick={onChange}
    className={`
      relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
      transition-colors duration-200 ease-in-out focus:outline-none 
      ${checked ? 'bg-emerald-500' : 'bg-gray-200'}
      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
    `}
  >
    <span
      className={`
        pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
        transition duration-200 ease-in-out
        ${checked ? 'translate-x-5' : 'translate-x-0'}
      `}
    />
  </button>
);

const Dashboard = ({ email }) => {
  const navigate = useNavigate();

  // 1. DATA STATE
  const [houseList, setHouseList] = useState([]);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // 2. UI STATE
  const [filter, setFilter] = useState("all"); // 'all', 'actif', 'inactif'
  const [search, setSearch] = useState("");

  // 3. MODAL STATE
  const [selectedHouseComments, setSelectedHouseComments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [activeHouseId, setActiveHouseId] = useState(null);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [housesRes, commentsRes] = await Promise.all([
          axios.get("http://localhost:5000/api/houses"),
          axios.get("http://localhost:5000/api/comments")
        ]);
        setHouseList(housesRes.data);
        setComments(commentsRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- ACTIONS ---
  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin", { replace: true });
    toast.info("Logged out successfully");
  };

  const handleShowComments = async (houseId) => {
    const houseComments = comments.filter((c) => c.houseId === houseId);
    setSelectedHouseComments(houseComments);
    setShowModal(true);
    setActiveHouseId(houseId);

    // Optimistic Update for "Seen" status
    const hasUnseen = houseComments.some(c => !c.seen);
    if (hasUnseen) {
      const updatedComments = comments.map((c) =>
        c.houseId === houseId ? { ...c, seen: true } : c
      );
      setComments(updatedComments);

      try {
        await axios.put(`http://localhost:5000/api/comments/mark-seen/${houseId}`);
      } catch (err) {
        console.error("Failed to sync 'seen' status", err);
      }
    }
  };

  const toggleHouseState = async (houseId, currentState) => {
    const newState = currentState === "actif" ? "inactif" : "actif";

    // Optimistic Update
    const updatedHouses = houseList.map((h) =>
      h.id === houseId ? { ...h, state: newState } : h
    );
    setHouseList(updatedHouses);

    try {
      await axios.put(`http://localhost:5000/api/houses/${houseId}`, { state: newState });
      toast.success(`Unit ${houseId} updated to ${newState === "actif" ? "Active" : "Sold"}`);
    } catch (err) {
      console.error("Failed to update house state", err);
      toast.error("Failed to update status");
      // Revert if needed (omitted for brevity)
    }
  };

  // --- FILTERING LOGIC ---
  const filteredHouses = useMemo(() => {
    const searchLower = search.toLowerCase();

    return houseList.filter(house => {
      // 1. Status Filter
      const matchesStatus = filter === "all" || house.state === filter;

      // 2. Search Filter (House Number OR Comment Name)
      // Find if ANY comment for this house has a name matching the search
      const houseComments = comments.filter(c => c.houseId === house.id);
      const hasMatchingComment = houseComments.some(c =>
        c.name.toLowerCase().includes(searchLower)
      );

      const matchesSearch =
        house.number.toLowerCase().includes(searchLower) || // Match Unit Number (e.g. "1R")
        hasMatchingComment; // Match Commenter Name (e.g. "John")

      return matchesStatus && matchesSearch;
    });
  }, [houseList, comments, filter, search]);

  const stats = {
    total: houseList.length,
    active: houseList.filter(h => h.state === "actif").length,
    sold: houseList.filter(h => h.state !== "actif").length,
    newRequests: comments.filter(c => !c.seen).length
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4">
        <div className="w-8 h-8 border-4 border-black border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium">Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-800 font-sans">

      {/* --- HEADER --- */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/")} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <LayoutDashboard className="text-emerald-600" size={20} />
                Admin Dashboard
              </h1>
              <p className="text-xs text-gray-500 font-medium hidden sm:block">Logged in as {email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* --- STATS OVERVIEW --- */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><Home size={24} /></div>
            <div><p className="text-2xl font-bold">{stats.total}</p><p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Total Units</p></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg"><CheckCircle2 size={24} /></div>
            <div><p className="text-2xl font-bold">{stats.active}</p><p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Active</p></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-50 text-red-600 rounded-lg"><XCircle size={24} /></div>
            <div><p className="text-2xl font-bold">{stats.sold}</p><p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Sold</p></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-yellow-50 text-yellow-600 rounded-lg"><MessageSquare size={24} /></div>
            <div><p className="text-2xl font-bold">{stats.newRequests}</p><p className="text-xs text-gray-500 uppercase font-bold tracking-wider">New Msgs</p></div>
          </div>
        </div>

        {/* --- FILTERS & CONTROLS --- */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          <div className="flex bg-gray-200 p-1 rounded-lg">
            {['all', 'actif', 'inactif'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${filter === f ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                {f === 'all' ? 'All' : f === 'actif' ? 'Active' : 'Sold'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search Unit # or Client Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 text-sm"
            />
          </div>
        </div>

        {/* --- HOUSE GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredHouses.map((house) => {
            const houseComments = comments.filter((c) => c.houseId === house.id);
            const unseenCount = houseComments.filter(c => !c.seen).length;
            const isActif = house.state === "actif";

            return (
              <div key={house.id} className={`bg-white border rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-lg transition-all duration-300 group ${isActif ? 'border-gray-200' : 'border-red-100 bg-red-50/30'}`}>

                {/* Card Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold text-gray-900">Unit {house.number}</h3>
                      {!isActif && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded uppercase">Sold</span>}
                    </div>
                    <p className="text-xs text-gray-400 font-mono mt-1">ID: #{house.id}</p>
                  </div>

                  {/* TOGGLE SWITCH */}
                  <div className="flex flex-col items-end gap-1">
                    <ToggleSwitch
                      checked={isActif}
                      onChange={() => toggleHouseState(house.id, house.state)}
                    />
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isActif ? 'text-emerald-600' : 'text-gray-400'}`}>
                      {isActif ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleShowComments(house.id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gray-900 text-white hover:bg-black transition-colors text-sm font-medium relative"
                  >
                    <MessageSquare size={16} />
                    View Inquiries
                    {unseenCount > 0 && (
                      <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
                        {unseenCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredHouses.length === 0 && (
          <div className="text-center py-20 text-gray-400">
            <Search size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium">No units found matching "{search}"</p>
          </div>
        )}
      </main>

      {/* --- COMMENTS MODAL --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setShowModal(false)} />

          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col animate-[fadeIn_0.2s_ease-out]">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold">
                  #{activeHouseId}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">Unit Inquiries</h3>
                  <p className="text-xs text-gray-500">{selectedHouseComments.length} messages found</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                <XCircle size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
              {selectedHouseComments.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <MessageSquare size={48} className="mx-auto mb-3 opacity-20" />
                  <p>No messages for this unit yet.</p>
                </div>
              ) : (
                selectedHouseComments.map((comment) => (
                  <div key={comment.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-bold text-gray-900">{comment.name}</p>
                        <p className="text-xs text-gray-500">{new Date(comment.date || comment.createdAt).toLocaleString()}</p>
                      </div>
                      <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded uppercase tracking-wider">
                        {comment.request}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                      "{comment.text}"
                    </p>
                    <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      {comment.phone}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;