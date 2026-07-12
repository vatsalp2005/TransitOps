import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, Edit2, Trash2, ShieldAlert, Activity, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import AnimatedDriverAvatar from '../components/AnimatedDriverAvatar';
import AnimatedModal from '../components/AnimatedModal';

const Drivers = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [ratingDriverId, setRatingDriverId] = useState(null);
    const [newSafetyScore, setNewSafetyScore] = useState(100);
    const [formData, setFormData] = useState({ name: '', licenseNumber: '', licenseExpiryDate: '', licenseCategory: 'Van', contactNumber: '', status: 'Available' });

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEdit) {
                await axios.put(`${import.meta.env.VITE_API_URL}/drivers/${editId}`, formData);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/drivers`, formData);
            }
            closeModal();
            fetchDrivers();
            toast.success(`Driver ${isEdit ? 'updated' : 'added'} successfully`);
        } catch (error) {
            toast.error(error.response?.data?.message || `Error ${isEdit ? 'updating' : 'adding'} driver`);
        }
    };

    const confirmDelete = (id) => setDeleteConfirmId(id);

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/drivers/${deleteConfirmId}`);
            fetchDrivers();
            setDeleteConfirmId(null);
            toast.success('Driver deleted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error deleting driver');
        }
    };

    const handleEdit = (driver) => {
        setIsEdit(true);
        setEditId(driver._id);
        const date = new Date(driver.licenseExpiryDate).toISOString().split('T')[0];
        setFormData({
            name: driver.name,
            licenseNumber: driver.licenseNumber,
            licenseExpiryDate: date,
            licenseCategory: driver.licenseCategory || 'Van',
            contactNumber: driver.contactNumber || '',
            status: driver.status
        });
        setIsAddOpen(true);
    };

    const closeModal = () => {
        setIsAddOpen(false);
        setIsEdit(false);
        setEditId(null);
        setFormData({ name: '', licenseNumber: '', licenseExpiryDate: '', licenseCategory: 'Van', contactNumber: '', status: 'Available' });
    };

    const handleUpdateScore = async () => {
        if (!ratingDriverId) return;
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/drivers/${ratingDriverId}`, { safetyScore: newSafetyScore });
            fetchDrivers();
            setRatingDriverId(null);
            toast.success(`Safety rating updated to ${newSafetyScore}%! 🛡️`);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error updating safety rating');
        }
    };

    const fetchDrivers = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/drivers`);
            setDrivers(res.data);
        } catch (error) {
            console.error('Error fetching drivers', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDrivers();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Available': return 'bg-green-100 text-green-800';
            case 'On Trip': return 'bg-blue-100 text-blue-800';
            case 'Off Duty': return 'bg-gray-100 text-gray-800';
            case 'Suspended': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const isLicenseExpired = (dateString) => {
        return new Date(dateString) < new Date();
    };

    if (loading) return <div>Loading drivers...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center bg-white/40 p-4 rounded-xl backdrop-blur-sm border border-white/50 shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900 font-heading tracking-tight drop-shadow-sm">Driver Profiles</h1>
                {user?.role === 'Safety Officer' && (
                    <button onClick={() => { closeModal(); setIsAddOpen(true); }} className="premium-btn px-4 py-2 rounded-lg flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Add Driver
                    </button>
                )}
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200/50">
                        <thead className="bg-slate-50/50 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name & Trips</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License info</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Safety Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                {user?.role === 'Safety Officer' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            <AnimatePresence>
                                {drivers.map((driver) => {
                                    const expired = isLicenseExpired(driver.licenseExpiryDate);
                                    return (
                                        <motion.tr
                                            key={driver._id}
                                            initial={{ x: -50, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: 50, opacity: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="hover:bg-gray-50 transition-colors"
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                <div className="flex items-center space-x-3">
                                                    <AnimatedDriverAvatar name={driver.name} status={driver.status} />
                                                    <div>
                                                        <div>{driver.name}</div>
                                                        <div className="text-xs text-gray-400 font-normal">{driver.completedTrips || 0} / {driver.totalTrips || 0} Trips Completed</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                                <div className="font-semibold text-slate-800">[{driver.licenseCategory || 'Van'}] {driver.licenseNumber}</div>
                                                <div className={`flex items-center text-xs mt-1 ${expired ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                                                    {expired && <ShieldAlert className="w-3 h-3 mr-1" />}
                                                    Exp: {new Date(driver.licenseExpiryDate).toLocaleDateString()}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex items-center group cursor-pointer" onClick={() => { if (user?.role === 'Safety Officer') { setRatingDriverId(driver._id); setNewSafetyScore(driver.safetyScore || 100); } }}>
                                                    <div className="w-full bg-gray-200 rounded-full h-2.5 mr-2 max-w-[100px] overflow-hidden relative">
                                                        <div className={`h-2.5 rounded-full transition-all duration-500 ${driver.safetyScore >= 90 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.7)]' : driver.safetyScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${driver.safetyScore || 100}%` }}></div>
                                                    </div>
                                                    <span className="font-bold w-8 text-right">{driver.safetyScore || 100}</span>
                                                    {user?.role === 'Safety Officer' && <Star className="w-4 h-4 ml-2 text-yellow-400 opacity-0 group-hover:opacity-100 transition-opacity" />}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(driver.status)}`}>
                                                    {driver.status}
                                                </span>
                                            </td>
                                            {user?.role === 'Safety Officer' && (
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                    <button onClick={() => handleEdit(driver)} className="text-blue-600 hover:text-blue-900 mx-2" title="Edit Driver"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => confirmDelete(driver._id)} className="text-red-600 hover:text-red-900 mx-2" title="Delete Driver"><Trash2 className="w-4 h-4" /></button>
                                                </td>
                                            )}
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                            {drivers.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No drivers found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">{isEdit ? 'Edit Driver' : 'Add New Driver'}</h2>

                        {/* Interactive UI Card */}
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-800 text-white rounded-xl p-5 shadow-inner mb-6 relative overflow-hidden ring-4 ring-blue-500/20">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mt-10 -mr-10"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <div>
                                    <p className="text-[10px] uppercase tracking-wider text-blue-200">State Commercial License</p>
                                    <h3 className="font-bold text-xl leading-tight uppercase font-heading">{formData.name || 'JOHN DOE'}</h3>
                                </div>
                                <div className="w-12 h-16 bg-white/20 rounded shadow-inner flex items-center justify-center border border-white/30 backdrop-blur-sm">
                                    <span className="text-2xl">👤</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 relative z-10 text-sm">
                                <div>
                                    <p className="text-[10px] text-blue-200 uppercase">License No.</p>
                                    <p className="font-mono tracking-widest">{formData.licenseNumber || 'DL-XXXX-XXXX'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-blue-200 uppercase">Class</p>
                                    <p className="font-bold text-amber-300">[{formData.licenseCategory}]</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] text-blue-200 uppercase">Expires</p>
                                    <p className={`font-mono ${isLicenseExpired(formData.licenseExpiryDate) ? 'text-red-300' : ''}`}>{formData.licenseExpiryDate || 'MM/DD/YYYY'}</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2"><label className="block text-sm font-medium text-gray-700">Full Name</label><input required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 uppercase" placeholder="e.g. Alex Johnson" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700">License Number</label><input required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500 uppercase" placeholder="DL-1234-5678" value={formData.licenseNumber} onChange={e => setFormData({ ...formData, licenseNumber: e.target.value.toUpperCase() })} /></div>
                                <div><label className="block text-sm font-medium text-gray-700">Expiry Date</label><input type="date" required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.licenseExpiryDate} onChange={e => setFormData({ ...formData, licenseExpiryDate: e.target.value })} /></div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">License Category</label>
                                <select className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.licenseCategory} onChange={e => setFormData({ ...formData, licenseCategory: e.target.value })}>
                                    <option value="Van">Van</option>
                                    <option value="Truck">Truck</option>
                                    <option value="Heavy Truck">Heavy Truck</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contact Number</label>
                                <input className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" placeholder="+91 98765 43210" value={formData.contactNumber} onChange={e => setFormData({ ...formData, contactNumber: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Initial Status</label>
                                <select className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                    <option value="Available">Available</option>
                                    <option value="Off Duty">Off Duty</option>
                                </select>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">{isEdit ? 'Update Driver' : 'Save Driver'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AnimatedModal
                isOpen={!!deleteConfirmId}
                onClose={() => setDeleteConfirmId(null)}
                title="Delete Driver Profile"
                type="danger"
            >
                <div className="space-y-6">
                    <p className="text-slate-600">Are you sure you want to permanently delete this driver's profile? This action will remove all their historical performance data and cannot be undone.</p>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium">Cancel</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm shadow-red-500/30">Delete Driver</button>
                    </div>
                </div>
            </AnimatedModal>
            <AnimatedModal
                isOpen={!!ratingDriverId}
                onClose={() => setRatingDriverId(null)}
                title="Update Driver Safety Score"
                type="info"
            >
                <div className="space-y-6">
                    <p className="text-slate-600">Adjust the safety compliance and driving behavior score for this driver. This affects their fleet standing.</p>

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

export default Drivers;
