import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, DollarSign, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import AnimatedModal from '../components/AnimatedModal';

const Expenses = () => {
    const [logs, setLogs] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    const [isAddOpen, setIsAddOpen] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [editId, setEditId] = useState(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);
    const [formData, setFormData] = useState({ vehicleId: '', tripId: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });

    const fetchData = async () => {
        try {
            const [logsRes, vehiclesRes, tripsRes] = await Promise.all([
                axios.get(`${import.meta.env.VITE_API_URL}/expenses`),
                axios.get(`${import.meta.env.VITE_API_URL}/vehicles`),
                axios.get(`${import.meta.env.VITE_API_URL}/trips`)
            ]);
            setLogs(logsRes.data);
            setVehicles(vehiclesRes.data);
            setTrips(tripsRes.data);
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

        if (Number(formData.liters) <= 0) {
            return toast.error("Liters must be greater than 0");
        }
        if (Number(formData.cost) <= 0) {
            return toast.error("Cost must be greater than 0");
        }

        try {
            const dataToSubmit = { ...formData };
            if (!dataToSubmit.tripId) delete dataToSubmit.tripId;

            if (isEdit) {
                await axios.put(`${import.meta.env.VITE_API_URL}/expenses/${editId}`, dataToSubmit);
            } else {
                await axios.post(`${import.meta.env.VITE_API_URL}/expenses`, dataToSubmit);
            }
            closeModal();
            fetchData();
            toast.success(`Expense ${isEdit ? 'updated' : 'logged'} successfully`);
        } catch (error) {
            toast.error(error.response?.data?.message || `Error ${isEdit ? 'updating' : 'logging'} expense`);
        }
    };

    const handleDelete = async () => {
        if (!deleteConfirmId) return;
        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/expenses/${deleteConfirmId}`);
            fetchData();
            setDeleteConfirmId(null);
            toast.success('Expense log deleted successfully');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error deleting log');
        }
    };

    const handleEdit = (log) => {
        setIsEdit(true);
        setEditId(log._id);
        const date = new Date(log.date).toISOString().split('T')[0];
        setFormData({
            vehicleId: log.vehicleId?._id || '',
            tripId: log.tripId?._id || '',
            liters: log.liters,
            cost: log.cost,
            date: date
        });
        setIsAddOpen(true);
    };

    const closeModal = () => {
        setIsAddOpen(false);
        setIsEdit(false);
        setEditId(null);
        setFormData({ vehicleId: '', tripId: '', liters: '', cost: '', date: new Date().toISOString().split('T')[0] });
    };

    if (loading) return <div>Loading expenses...</div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center bg-white/40 p-4 rounded-xl backdrop-blur-sm border border-white/50 shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900 font-heading tracking-tight drop-shadow-sm">Expense Tracking</h1>
                {user?.role === 'Financial Analyst' && (
                    <button onClick={() => { closeModal(); setIsAddOpen(true); }} className="premium-btn px-4 py-2 rounded-lg flex items-center shadow-sm">
                        <Plus className="w-4 h-4 mr-2" /> Log Expense
                    </button>
                )}
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200/50">
                        <thead className="bg-slate-50/50 backdrop-blur-md">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vehicle</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trip Route</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liters</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost (₹)</th>
                                {user?.role === 'Financial Analyst' && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {logs.map((log) => (
                                <tr key={log._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(log.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {log.vehicleId?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {log.tripId ? `${log.tripId.origin} to ${log.tripId.destination}` : 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{log.liters} L</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                        <div className="flex items-center">
                                            <DollarSign className="w-3 h-3 text-gray-400 mr-1" />
                                            {log.cost.toFixed(2)}
                                        </div>
                                    </td>
                                    {user?.role === 'Financial Analyst' && (
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(log)} className="text-blue-600 hover:text-blue-900 mx-2" title="Edit Log">Edit</button>
                                            <button onClick={() => setDeleteConfirmId(log._id)} className="text-red-600 hover:text-red-900 mx-2 inline-flex items-center" title="Delete Log">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={user?.role === 'Financial Analyst' ? "6" : "5"} className="px-6 py-8 text-center text-gray-500">No expense logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isAddOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl my-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-900">{isEdit ? 'Edit Expense Log' : 'Log Expense / Fuel'}</h2>
                        <form onSubmit={handleAddSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Vehicle</label>
                                <select required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.vehicleId} onChange={e => setFormData({ ...formData, vehicleId: e.target.value })}>
                                    <option value="">Select a vehicle</option>
                                    {vehicles.map(v => <option key={v._id} value={v._id}>{v.name} ({v.licensePlate})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Related Trip (Optional)</label>
                                <select className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.tripId} onChange={e => setFormData({ ...formData, tripId: e.target.value })}>
                                    <option value="">None</option>
                                    {trips.map(t => <option key={t._id} value={t._id}>{t.origin} to {t.destination}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Liters</label>
                                <input type="number" min="0" step="0.01" required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.liters} onChange={e => setFormData({ ...formData, liters: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Cost (₹)</label>
                                <input type="number" min="0" step="0.01" required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.cost} onChange={e => setFormData({ ...formData, cost: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date</label>
                                <input type="date" required className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} />
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{isEdit ? 'Update Expense' : 'Log Expense'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <AnimatedModal
                isOpen={deleteConfirmId !== null}
                onClose={() => setDeleteConfirmId(null)}
                title="Delete Expense Log"
                type="danger"
            >
                <div className="space-y-6">
                    <p className="text-slate-600">Are you sure you want to delete this expense entry? This action cannot be undone.</p>
                    <div className="flex justify-end space-x-3">
                        <button onClick={() => setDeleteConfirmId(null)} className="px-4 py-2 text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors font-medium">Cancel</button>
                        <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium shadow-sm shadow-red-500/30">Delete Expense</button>
                    </div>
                </div>
            </AnimatedModal>
        </div>
    );
};

export default Expenses;
