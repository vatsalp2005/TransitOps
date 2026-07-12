// Tested by Kavish Vachheta (kavishvachhet) for role-safety branching validation
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ShieldCheck, ShieldAlert, AlertOctagon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import AnimatedOdometer from './AnimatedOdometer';
import AnimatedDriverAvatar from './AnimatedDriverAvatar';

const StatCard = ({ title, value, icon: Icon, colorClass, gradientClass, label = "" }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring' }}
        className="glass-panel p-6 flex items-center transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 group"
    >
        <div className={`p-4 rounded-xl ${colorClass} bg-gradient-to-br ${gradientClass} mr-6 shadow-inner group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="w-8 h-8 text-white" />
        </div>
        <div>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-2">{title}</p>
            <div className="scale-75 origin-left">
                <AnimatedOdometer value={value} label={label} padCount={3} />
            </div>
        </div>
    </motion.div>
);

const SafetyDashboard = () => {
    const [drivers, setDrivers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
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
        fetchDrivers();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const totalDrivers = drivers.length;
    const highPerformers = drivers.filter(d => (d.safetyScore || 100) >= 90).length;
    const flaggedDrivers = drivers.filter(d => (d.safetyScore || 100) < 70);
    const expiringLicenses = drivers.filter(d => new Date(d.licenseExpiryDate) < thirtyDaysFromNow);

    // Prepare data for distribution chart
    const distribution = [
        { name: 'Critical (<60)', count: drivers.filter(d => (d.safetyScore || 100) < 60).length, color: '#EF4444' },
        { name: 'Warning (60-79)', count: drivers.filter(d => (d.safetyScore || 100) >= 60 && (d.safetyScore || 100) < 80).length, color: '#F59E0B' },
        { name: 'Good (80-89)', count: drivers.filter(d => (d.safetyScore || 100) >= 80 && (d.safetyScore || 100) < 90).length, color: '#3B82F6' },
        { name: 'Excellent (90+)', count: drivers.filter(d => (d.safetyScore || 100) >= 90).length, color: '#10B981' }
    ];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900 font-heading tracking-tight">Safety & Compliance Center</h1>
            </div>

            <motion.div
                className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.1 }}
            >
                <StatCard
                    title="Total Drivers"
                    value={totalDrivers}
                    icon={Users}
                    colorClass="text-white backdrop-blur-md"
                    gradientClass="from-blue-500 to-indigo-600 shadow-blue-500/50"
                    label="Active"
                />
                <StatCard
                    title="Excellent Safety"
                    value={highPerformers}
                    icon={ShieldCheck}
                    colorClass="text-white backdrop-blur-md"
                    gradientClass="from-emerald-400 to-green-600 shadow-green-500/50"
                    label="Drivers"
                />
                <StatCard
                    title="High Risk (Score < 70)"
                    value={flaggedDrivers.length}
                    icon={AlertOctagon}
                    colorClass="text-white backdrop-blur-md"
                    gradientClass="from-red-500 to-rose-600 shadow-red-500/50"
                    label="Flagged"
                />
                <StatCard
                    title="Expiring < 30 Days"
                    value={expiringLicenses.length}
                    icon={ShieldAlert}
                    colorClass="text-white backdrop-blur-md"
                    gradientClass="from-amber-400 to-orange-500 shadow-orange-500/50"
                    label="Licenses"
                />
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="glass-panel p-6 h-96 flex flex-col">
                    <p className="text-slate-800 font-bold font-heading text-lg mb-6 flex items-center">
                        <span className="w-2 h-6 bg-amber-500 rounded-full mr-3"></span>
                        Attention Required (Low Score / Expiring)
                    </p>
                    <div className="overflow-y-auto pr-2">
                        {flaggedDrivers.length === 0 && expiringLicenses.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <ShieldCheck className="w-12 h-12 text-emerald-400 mb-2" />
                                <p>All drivers are compliant and safe.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {[...new Set([...flaggedDrivers, ...expiringLicenses])].map(driver => {
                                    const isExpiring = new Date(driver.licenseExpiryDate) < thirtyDaysFromNow;
                                    const isLowScore = (driver.safetyScore || 100) < 70;

                                    return (
                                        <div key={driver._id} className="flex items-center p-3 bg-white/50 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                                            <AnimatedDriverAvatar name={driver.name} status={driver.status} className="mr-3 scale-90" />
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800 text-sm">{driver.name}</h4>
                                                <div className="flex space-x-2 mt-1">
                                                    {isLowScore && <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Score: {driver.safetyScore}</span>}
                                                    {isExpiring && <span className="text-[10px] font-bold px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">Exp: {new Date(driver.licenseExpiryDate).toLocaleDateString()}</span>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
                <div className="glass-panel p-6 h-96 flex flex-col">
                    <p className="text-slate-800 font-bold font-heading text-lg mb-6 flex items-center">
                        <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                        Safety Score Distribution
                    </p>
                    <ResponsiveContainer width="100%" height="85%">
                        <BarChart data={distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                            <Tooltip cursor={{ fill: 'transparent' }} />
                            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                {distribution.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default SafetyDashboard;
