import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, CheckCircle2, Trash2, Edit2, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';
import AnimatedVehicleBadge from '../components/AnimatedVehicleBadge';
import AnimatedDriverAvatar from '../components/AnimatedDriverAvatar';
import AnimatedModal from '../components/AnimatedModal';

const Trips = () => {
    const [trips, setTrips] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [completeTripId, setCompleteTripId] = useState(null);
    const [finalOdometer, setFinalOdometer] = useState('');
    const [ratingDriverId, setRatingDriverId] = useState(null);
    const [newSafetyScore, setNewSafetyScore] = useState(100);
    const [formData, setFormData] = useState({ vehicleId: '', driverId: '', cargoWeight: '', origin: '', destination: '', plannedDistance: '', revenue: '' });

    const fetchData = async () => {
        try {
            const [tripsRes, vehiclesRes, driversRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/trips`),
                axios.get(`${import.meta.env.VITE_API_URL}/vehicles`),
                axios.get(`${import.meta.env.VITE_API_URL}/drivers`)
            ]);
            setTrips(tripsRes.data);
            setVehicles(vehiclesRes.data);
            setDrivers(driversRes.data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching data', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddSubmit = async (e) => {
        e.preventDefault();

        // Client-side Business Logic Validations
        const selectedVehicle = vehicles.find(v => v._id === formData.vehicleId);
        const selectedDriver = drivers.find(d => d._id === formData.driverId);

        if (selectedVehicle && Number(formData.cargoWeight) > selectedVehicle.maxCapacity) {
            toast.error(`Cargo weight (${formData.cargoWeight}kg) exceeds vehicle capacity (${selectedVehicle.maxCapacity}kg)`);
            return;
        }

        if (selectedVehicle && selectedDriver && selectedVehicle.category !== selectedDriver.licenseCategory) {
            toast.error(`Driver license class [${selectedDriver.licenseCategory}] does not match vehicle class [${selectedVehicle.category}]`);
            return;
        }

        if (selectedDriver && new Date(selectedDriver.licenseExpiryDate || selectedDriver.licenseValidUntil) < new Date()) {
            toast.error(`Driver license has expired! Cannot dispatch.`);
            return;
        }

        try {
            if (isEdit) {
                await axios.put(`${import.meta.env.VITE_API_URL}/trips/${editId}`, formData);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/trips`, formData);
            }
            closeModal();
            fetchData();
            toast.success(`Trip ${isEdit ? 'updated' : 'dispatched'} successfully`);
        } catch (error) {
            toast.error(error.response?.data?.message || `Error ${isEdit ? 'updating' : 'dispatching'} trip`);
        }
    };

    const confirmDelete = (id) => setDeleteConfirmId(id);

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/trips/${deleteConfirmId}`);
            fetchData();
            setDeleteConfirmId(null);
            toast.success('Trip deleted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error deleting trip');
        }
    };

    const handleEdit = (trip) => {
        setIsEdit(true);
        setEditId(trip._id);
        setFormData({
            vehicleId: trip.vehicleId?._id || '',
            driverId: trip.driverId?._id || '',
            cargoWeight: trip.cargoWeight,
            origin: trip.origin,
            destination: trip.destination,
            plannedDistance: trip.plannedDistance || 0,
            revenue: trip.revenue || 0
        });
        setIsAddOpen(true);
    };

    const closeModal = () => {
        setIsAddOpen(false);
        setIsEdit(false);
        setEditId(null);
        setFormData({ vehicleId: '', driverId: '', cargoWeight: '', origin: '', destination: '', plannedDistance: '', revenue: '' });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Dispatched': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'Draft': return 'bg-gray-100 text-gray-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const confirmComplete = (id) => setCompleteTripId(id);

    const handleComplete = async () => {
        if (!completeTripId || !finalOdometer) return;
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/trips/${completeTripId}/complete`, { finalOdometer: Number(finalOdometer) });
            fetchData();
            setCompleteTripId(null);
            setFinalOdometer('');
            toast.success('Trip marked as completed');

            // Celebration Animation
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#10b981', '#f59e0b']
            });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error completing trip');
        }
    };

    const handleUpdateScore = async () => {
        if (!ratingDriverId) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/drivers/${ratingDriverId}`, { safetyScore: newSafetyScore });
            setRatingDriverId(null);
            fetchData();
            toast.success(`Safety rating updated to ${newSafetyScore}%! 🛡️`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating safety rating');
        }
    };

    if (loading) return <div>Loading trips...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center bg-white/40 p-4 rounded-xl backdrop-blur-sm border border-white/50 shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900 font-heading tracking-tight drop-shadow-sm">Trip Dispatch Management</h1>
                {user?.role === 'Driver' && (
                    <button onClick={() => { closeModal(); setIsAddOpen(true); }} className="premium-btn px-4 py-2 rounded-lg flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Dispatch New Trip
                    </button>
                )}
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200/50">
                        <thead className="bg-slate-50/50 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Driver</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cargo Weight</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                {(user?.role === 'Driver' || user?.role === 'Safety Officer') && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <AnimatePresence>
                                {trips.map((trip) => (
                                    <motion.tr
                                        key={trip._id}
                                        initial={{ x: -50, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        exit={{ x: 50, opacity: 0 }}
                                        transition={{ duration: 0.3 }}
                                        className="hover:bg-gray-50 transition-colors"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            <div className="font-semibold">{trip.origin}</div>
                                            <div className="text-gray-400 text-xs mt-1">to {trip.destination}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {trip.vehicleId ? (
                                                <div className="flex items-center space-x-2">
                                                    <AnimatedVehicleBadge type={trip.vehicleId.category} status={trip.vehicleId.status} className="scale-75 origin-left" />
                                                    <span className="font-medium text-slate-800">{trip.vehicleId.name}</span>
                                                </div>
                                            ) : 'Unassigned'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {trip.driverId ? (
                                                <div className="flex items-center space-x-2">
                                                    <AnimatedDriverAvatar name={trip.driverId.name} status={trip.driverId.status} className="scale-75 origin-left" />
                                                    <span className="font-medium text-slate-800">{trip.driverId.name}</span>
                                                </div>
                                            ) : 'Unassigned'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <div>{trip.cargoWeight} kg</div>
                                            <div className="text-xs text-green-600 font-semibold mt-1">${trip.revenue?.toLocaleString() || 0} REV</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(trip.status)}`}>
                                                {trip.status}
                                            </span>
                                        </td>
                                        {(user?.role === 'Driver' || user?.role === 'Safety Officer') && (
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end space-x-3">
                                                    {user?.role === 'Safety Officer' && trip.status === 'Completed' && trip.driverId && (
                                                        <button
                                                            onClick={() => { setRatingDriverId(trip.driverId._id); setNewSafetyScore(trip.driverId.safetyScore || 100); }}
                                                            className="text-yellow-600 hover:text-yellow-900 group relative flex items-center"
                                                            title="Review Driver Safety"
                                                        >
                                                            <span className="absolute right-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded w-max">Rate Driver</span>
                                                            <ShieldAlert className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {user?.role === 'Driver' && trip.status === 'Dispatched' && (
                                                        <button
                                                            onClick={() => confirmComplete(trip._id)}
                                                            className="text-green-600 hover:text-green-900"
                                                            title="Mark Complete"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                    )}
                                                    {user?.role === 'Driver' && (
                                                        <>
                                                            <button onClick={() => handleEdit(trip)} className="text-blue-600 hover:text-blue-900" title="Edit Trip"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={() => confirmDelete(trip._id)} className="text-red-600 hover:text-red-900" title="Delete Trip"><Trash2 className="w-4 h-4" /></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                            {trips.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">No active trips found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl my-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">{isEdit ? 'Edit Trip' : 'Dispatch New Trip'}</h2>
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Origin</label>
                                <input required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.origin} onChange={e => setFormData({ ...formData, origin: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Destination</label>
                                <input required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vehicle (Available)</label>
                                <select required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}>
                                    <option value="">Select a vehicle</option>
                                    {vehicles.filter(v => v.status === 'Available' || v._id === formData.vehicleId).map(v => <option key={v._id} value={v._id}>[{v.category || 'Van'}] {v.name} ({v.licensePlate}) - Cap: {v.maxCapacity}kg</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Driver (Available)</label>
                                <select required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.driverId} onChange={e => setFormData({ ...formData, driverId: e.target.value })}>
                                    <option value="">Select a driver</option>
                                    {drivers.filter(d => d.status === 'Available' || d._id === formData.driverId).map(d => <option key={d._id} value={d._id}>[{d.licenseCategory || 'Van'}] {d.name}</option>)}
                                </select>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cargo Weight (kg)</label>
                                    <input type="number" required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.cargoWeight} onChange={e => setFormData({ ...formData, cargoWeight: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Distance (km)</label>
                                    <input type="number" required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.plannedDistance} onChange={e => setFormData({ ...formData, plannedDistance: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Revenue (₹)</label>
                                    <input type="number" required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.revenue} onChange={e => setFormData({ ...formData, revenue: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{isEdit ? 'Update Trip' : 'Dispatch'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AnimatedModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                title="Delete Trip"
                type="danger"
            >
                <div className="space-y-6">
                    <p className="text-slate-600">Are you sure you want to permanently delete this trip? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium">Cancel</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm shadow-red-500/30">Delete Trip</button>
                    </div>
                </div>
            </AnimatedModal>

            <AnimatedModal
                isOpen={!!completeTripId}
                onClose={() => { setCompleteTripId(null); setFinalOdometer(''); }}
                title="Complete Trip"
                type="info"
            >
                <div className="space-y-6">
                    <p className="text-slate-600">Please enter the final odometer reading for the assigned vehicle to complete this trip.</p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Final Odometer (km)</label>
                        <input
                            type="number"
                            required
                            className="w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                            value={finalOdometer}
                            onChange={e => setFinalOdometer(e.target.value)}
                            placeholder="e.g. 150240"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => { setCompleteTripId(null); setFinalOdometer(''); }} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium">Cancel</button>
                        <button onClick={handleComplete} disabled={!finalOdometer} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors font-medium shadow-sm shadow-green-500/30">Mark Completed</button>
                    </div>
                </div>
            </AnimatedModal>

            <AnimatedModal
                isOpen={!!ratingDriverId}
                onClose={() => setRatingDriverId(null)}
                title="Update Post-Trip Safety Score"
                type="info"
            >
                <div className="space-y-6">
                    <p className="text-slate-600">Review the driver's performance on this completed trip and adjust their safety score. Lower score if there were traffic violations or harsh braking.</p>

                    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="text-5xl font-black font-heading mb-4 text-slate-800 drop-shadow-sm">
                            {newSafetyScore} <span className="text-2xl text-slate-400 font-normal">%</span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={newSafetyScore}
                            onChange={(e) => setNewSafetyScore(Number(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/30 transition-all"
                        />
                        <div className="flex justify-between w-full text-xs font-bold text-slate-400 mt-2 px-1 uppercase tracking-wider">
                            <span>High Risk</span>
                            <span>Warning</span>
                            <span>Excellent</span>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                        <button onClick={() => setRatingDriverId(null)} className="px-5 py-2.5 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors font-medium">Cancel</button>
                        <button onClick={handleUpdateScore} className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all font-bold shadow-blue-500/30 flex items-center">
                            <ShieldAlert className="w-4 h-4 mr-2" />
                            Update Rating
                        </button>
                    </div>
                </div>
            </AnimatedModal>
        </div>
    );
};

export default Trips;
