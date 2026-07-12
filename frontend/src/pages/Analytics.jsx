import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { TrendingUp, TrendingDown, DollarSign, Activity, Flame, Download } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useReactToPrint } from 'react-to-print';

const Analytics = () => {
    const componentRef = useRef();
    const [financials, setFinancials] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    const fetchFinancials = async () => {
        try {
            const res = await axios.get(`${import.meta.env.VITE_API_URL}/analytics/financials`);
            setFinancials(res.data);
        } catch (error) {
            console.error('Error fetching financials', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFinancials();
    }, []);

    const exportPDF = useReactToPrint({
        contentRef: componentRef,
        documentTitle: `TransitOps_Analytics_Report_${new Date().toISOString().split('T')[0]}`,
        bodyClass: 'print-bg-fix'
    });

    const exportCSV = () => {
        if (!financials) return;
        const rows = [
            ['Metric', 'Value'],
            ['Total Fuel Cost (₹)', financials.totalFuelCost],
            ['Total Maintenance Cost (₹)', financials.totalMaintenanceCost],
            ['Total Operational Cost (₹)', financials.totalOperationalCost],
            ['Cost Per Km (₹)', financials.costPerKm],
            ['Fuel Efficiency (km/L)', financials.fuelEfficiency],
            ['Average ROI (%)', financials.avgRoi],
            [],
            ['Month', 'Revenue (₹)', 'Operational Cost (₹)'],
            ...(financials.roiData || []).map(r => [r.month, r.revenue || 0, r.cost || 0])
        ];
        const csv = rows.map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `TransitOps_Report_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <div>Loading reports...</div>;

    const costData = [
        { name: 'Fuel Costs', value: financials?.totalFuelCost || 0, color: '#3b82f6' },
        { name: 'Maintenance', value: financials?.totalMaintenanceCost || 0, color: '#f59e0b' }
    ];

    const roiData = financials?.roiData || [];

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex justify-between items-center bg-white/40 p-4 rounded-xl backdrop-blur-sm border border-white/50 shadow-sm">
                <h1 className="text-3xl font-bold text-slate-900 font-heading tracking-tight drop-shadow-sm">Operational Analytics & Reports</h1>
                {user?.role === 'Financial Analyst' && (
                <div className="flex gap-3">
                    <button onClick={exportCSV} className="px-5 py-2.5 rounded-xl shadow-md flex items-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition-colors">
                        <Download className="w-4 h-4 mr-2" /> Export CSV
                    </button>
                    <button onClick={() => exportPDF()} className="premium-btn px-5 py-2.5 rounded-xl shadow-md flex items-center">
                        Export PDF Report
                    </button>
                </div>
                )}
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl w-full">
                <div ref={componentRef} id="analytics-report" className="w-full relative bg-slate-50 p-2 md:p-6" style={{ background: '#f8fafc' }}>
                    {/* Print Header that only shows in PDF */}
                    <div className="hidden pdf-print-header mb-8 text-center pb-6 border-b border-slate-200">
                        <h1 className="text-4xl font-bold text-slate-900 font-heading mb-2">TransitOps Operational Analytics</h1>
                        <p className="text-slate-500 font-medium">Generated on {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
                        <div className="glass-panel p-6 flex items-center group hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg shadow-blue-500/30 text-white mr-5 group-hover:scale-110 transition-transform">
                                <DollarSign className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Total Operational Cost</p>
                                <p className="text-3xl font-bold font-heading text-slate-800">₹{financials?.totalOperationalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</p>
                            </div>
                        </div>
                        <div className="glass-panel p-6 flex items-center group hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 shadow-lg shadow-green-500/30 text-white mr-5 group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Average Vehicle ROI</p>
                                <p className="text-3xl font-bold font-heading text-slate-800">{financials ? `${financials.avgRoi}%` : '0%'}</p>
                            </div>
                        </div>
                        <div className="glass-panel p-6 flex items-center group hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-purple-500/30 text-white mr-5 group-hover:scale-110 transition-transform">
                                <Activity className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Fleet Cost-per-km</p>
                                <p className="text-3xl font-bold font-heading text-slate-800">₹{financials?.costPerKm || 0}</p>
                            </div>
                        </div>
                        <div className="glass-panel p-6 flex items-center group hover:-translate-y-1 transition-all duration-300" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
                            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-orange-500/30 text-white mr-5 group-hover:scale-110 transition-transform">
                                <Flame className="w-8 h-8" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">Fuel Efficiency</p>
                                <p className="text-3xl font-bold font-heading text-slate-800">{financials?.fuelEfficiency || 0} <span className="text-sm font-normal text-slate-500">km/L</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                        <div className="glass-panel p-6 h-96 flex flex-col" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
                            <h3 className="text-lg font-bold font-heading text-slate-800 mb-6 flex items-center">
                                <span className="w-2 h-6 bg-blue-500 rounded-full mr-3"></span>
                                Cost Distribution
                            </h3>
                            <ResponsiveContainer width="100%" height="80%">
                                <PieChart>
                                    <Pie
                                        data={costData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {costData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `₹${value}`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="glass-panel p-6 h-96 flex flex-col" style={{ backgroundColor: 'white', border: '1px solid #e2e8f0' }}>
                            <h3 className="text-lg font-bold font-heading text-slate-800 mb-6 flex items-center">
                                <span className="w-2 h-6 bg-emerald-500 rounded-full mr-3"></span>
                                Revenue vs Cost (Monthly)
                            </h3>
                            <ResponsiveContainer width="100%" height="80%">
                                <BarChart data={roiData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                    <YAxis axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip formatter={(value) => `₹${value}`} />
                                    <Legend />
                                    <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} name="Revenue" />
                                    <Bar dataKey="cost" fill="#EF4444" radius={[4, 4, 0, 0]} name="Operational Cost" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
