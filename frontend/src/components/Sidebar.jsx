import { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Home, Truck, Users, Map, Wrench, FileText, PieChart, LogOut } from 'lucide-react';

const Sidebar = () => {
    const { user, logout } = useContext(AuthContext);

    const links = [
        { to: '/', icon: Home, label: 'Dashboard', roles: ['Manager', 'Driver', 'Safety Officer', 'Financial Analyst'] },
        { to: '/vehicles', icon: Truck, label: 'Vehicles', roles: ['Manager', 'Driver'] },
        { to: '/drivers', icon: Users, label: 'Drivers', roles: ['Manager', 'Driver', 'Safety Officer'] },
        { to: '/trips', icon: Map, label: 'Trips', roles: ['Manager', 'Driver'] },
        { to: '/maintenance', icon: Wrench, label: 'Maintenance', roles: ['Manager', 'Driver', 'Financial Analyst'] },
        { to: '/expenses', icon: FileText, label: 'Expenses', roles: ['Manager', 'Financial Analyst'] },
        { to: '/analytics', icon: PieChart, label: 'Analytics', roles: ['Financial Analyst'] },
    ];

    return (
        <div className="w-64 glass-sidebar flex flex-col min-h-screen relative z-20 shadow-2xl shadow-slate-900/50">
            <div className="p-6 text-2xl font-bold border-b border-slate-700/50 tracking-wider font-heading flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-indigo-500 mr-3 flex items-center justify-center shadow-lg shadow-blue-500/30">
                    <Truck className="w-5 h-5 text-white" />
                </div>
                <span className="text-blue-400">Transit</span><span className="text-white">Ops</span>
            </div>
            <nav className="flex-1 py-4">
                {links.map((link) => {
                    if (!link.roles.includes(user?.role)) return null;
                    return (
                        <NavLink
                            key={link.to}
                            to={link.to}
                            className={({ isActive }) =>
                                `flex items-center px-6 py-3.5 mx-3 my-1 rounded-xl transition-all duration-300 font-medium ${isActive ? 'bg-gradient-to-r from-blue-600/90 to-indigo-600/90 text-white shadow-md shadow-blue-900/50 translate-x-1' : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 hover:translate-x-1'
                                }`
                            }
                        >
                            <link.icon className="w-5 h-5 mr-3" />
                            {link.label}
                        </NavLink>
                    );
                })}
            </nav>
            <div className="p-4 border-t border-slate-700/50 m-4 rounded-xl bg-slate-800/30 backdrop-blur-md">
                <div className="mb-4 px-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Logged in as</p>
                    <p className="font-semibold text-sm truncate bg-clip-text text-transparent bg-gradient-to-r from-blue-200 to-slate-100">{user?.email}</p>
                    <p className="text-xs text-blue-400 mt-1 inline-flex items-center px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20">{user?.role}</p>
                </div>
                <button
                    onClick={logout}
                    className="flex items-center w-full px-3 py-2 text-sm text-slate-300 hover:text-white transition-all hover:bg-red-500/10 hover:text-red-400 rounded-lg group"
                >
                    <LogOut className="w-4 h-4 mr-3 group-hover:block transition-transform" />
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
