import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Flame, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Facebook,
  Send,
  Instagram,
  ChevronDown,
  Target,
  Zap,
  Activity,
  Brain,
  Award,
  BookOpen,
  Map,
  BarChart2,
  MoreHorizontal,
  Lightbulb,
  MessageCircle,
  X,
  User,
  Shield,
  Rocket,
  Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// --- Types ---
type Tab = 'Learn' | 'Courses' | 'Paths' | 'Progress' | 'Memory' | 'More';

interface SideArticleProps {
  title: string;
  tag: string;
  image: string;
  index: number;
  key?: string | number;
}

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
      >
        <motion.div 
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="modal-content"
          onClick={e => e.stopPropagation()}
        >
          <button onClick={onClose} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 transition-colors">
            <X size={24} />
          </button>
          <h2 className="font-display text-4xl font-bold mb-6">{title}</h2>
          <div className="text-slate-600 leading-relaxed text-lg">
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

const ChatWindow = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.9 }}
        className="fixed bottom-32 right-12 w-[450px] h-[600px] liquid-glass z-[60] flex flex-col overflow-hidden"
      >
        <div className="p-8 border-b border-white/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-slate-900">ByteAI</h3>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Always Online</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-900 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 p-8 overflow-y-auto space-y-6">
          <div className="chat-bubble bg-white/60 text-slate-900 self-start">
            Hello Dhani! How can I help you excel in your contact center role today?
          </div>
          <div className="chat-bubble bg-brand-blue text-white self-end ml-auto">
            Can you show me my next best action?
          </div>
          <div className="chat-bubble bg-white/60 text-slate-900 self-start">
            Based on your recent CSAT trends, I recommend the "Efficient Closing Mastery" module. It will help you reduce AHT while maintaining high satisfaction.
          </div>
        </div>
        <div className="p-8 border-t border-white/20 bg-white/20">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Ask Sudar anything..." 
              className="w-full bg-white/60 border border-white/40 rounded-full py-4 px-6 pr-16 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/20 transition-all"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 bg-brand-blue text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const NavPill = ({ label, active, onClick }: { label: Tab, active: boolean, onClick: (t: Tab) => void, key?: string | number }) => (
  <button 
    onClick={() => onClick(label)}
    className={`glass-nav-item ${active ? 'glass-nav-item-active' : ''}`}
  >
    {active && (
      <motion.div 
        layoutId="active-pill"
        className="glass-nav-pill inset-0 w-full h-full"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
    <span className="relative z-30">{label}</span>
  </button>
);

const SideArticle = ({ title, tag, image, index }: SideArticleProps) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    className="side-item group"
  >
    <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" referrerPolicy="no-referrer" />
    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
    <div className="absolute top-4 left-4">
      <span className="glass-pill">{tag}</span>
    </div>
    <div className="absolute bottom-4 left-4 right-12">
      <h4 className="text-white font-bold text-sm leading-tight">{title}</h4>
    </div>
    <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-brand-blue/80 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
      <ArrowUpRight size={16} />
    </div>
  </motion.div>
);

// --- Page Components ---

const Dashboard = ({ greeting, onOpenModal }: { greeting: string, onOpenModal: (title: string, content: React.ReactNode) => void }) => {
  const kpiData = [
    { name: 'Week 1', csat: 82, aht: 340 },
    { name: 'Week 2', csat: 85, aht: 320 },
    { name: 'Week 3', csat: 88, aht: 310 },
    { name: 'Week 4', csat: 92, aht: 280 },
  ];

  const completedCourses = [
    { title: "Advanced Conflict Resolution for BPO", tag: "Soft Skills", img: "https://picsum.photos/seed/conflict/600/400" },
    { title: "Omnichannel Support Mastery", tag: "Technical", img: "https://picsum.photos/seed/omni/600/400" },
    { title: "Data Privacy & GDPR in Contact Centers", tag: "Compliance", img: "https://picsum.photos/seed/gdpr/600/400" },
  ];

  return (
    <div className="flex gap-10">
      {/* Left Column */}
      <div className="flex-[2.2] flex flex-col gap-10">
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-block group cursor-pointer"
          onClick={() => onOpenModal("Your Learning Journey", (
            <div className="space-y-6">
              <p>Welcome to your personalized BPO growth dashboard. Over the last 30 days, you've shown exceptional progress in soft skills.</p>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-slate-50 rounded-3xl">
                  <h4 className="font-bold text-slate-900 mb-2">Current Focus</h4>
                  <p className="text-sm">Technical Troubleshooting & AHT Optimization</p>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl">
                  <h4 className="font-bold text-slate-900 mb-2">Next Milestone</h4>
                  <p className="text-sm">Senior Associate Certification (85% Complete)</p>
                </div>
              </div>
            </div>
          ))}
        >
          <img 
            src="https://picsum.photos/seed/bpo-office/1600/1200" 
            alt="BPO Hero" 
            className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-1000 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900/70 via-slate-900/30 to-transparent" />
          
          <div className="relative z-10 p-20 h-full flex flex-col justify-between">
            <div className="max-w-2xl">
              <motion.h1 
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2, duration: 0.8 }}
                className="font-display text-[5.5rem] font-bold text-white leading-[0.85] tracking-tighter mb-10"
              >
                {greeting},<br />Dhani 🚀
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-white/80 text-2xl font-medium max-w-lg leading-relaxed"
              >
                Your CSAT is up <span className="text-emerald-400 font-bold">5%</span> this month! Sudar recommends: <span className="text-white font-bold underline decoration-brand-blue underline-offset-4">Efficient Closing Mastery</span> to lower AHT.
              </motion.p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-5">
                {[Facebook, Send, Instagram].map((Icon, i) => (
                  <motion.button 
                    key={i}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255,255,255,0.2)' }}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white transition-colors"
                  >
                    <Icon size={22} />
                  </motion.button>
                ))}
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.05, x: 5 }}
                whileTap={{ scale: 0.95 }}
                className="action-button"
              >
                Next Best Action <ChevronRight size={20} />
              </motion.button>
            </div>
          </div>
        </motion.section>

        {/* KPI & Insights Widget */}
        <div className="flex gap-10 h-[380px]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex-[1.5] kpi-card cursor-pointer"
            onClick={() => onOpenModal("Historical KPI Performance", (
              <div className="space-y-6">
                <p>Your performance over the last 4 weeks has been consistently improving. Here's a breakdown of your core metrics:</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                    <span className="font-bold">Week 1 (Baseline)</span>
                    <span className="text-slate-500">82% CSAT | 340s AHT</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                    <span className="font-bold text-emerald-700">Week 4 (Current)</span>
                    <span className="text-emerald-600 font-bold">92% CSAT | 280s AHT</span>
                  </div>
                </div>
              </div>
            ))}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-blue/10 text-brand-blue rounded-2xl flex items-center justify-center">
                  <Activity size={24} />
                </div>
                <div>
                  <h3 className="font-display text-xl font-bold text-slate-900">KPI Performance</h3>
                  <p className="text-slate-400 text-xs font-semibold uppercase tracking-widest">Historical (Last 30 Days)</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-right">
                  <div className="text-emerald-500 font-bold text-lg">92%</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">CSAT</div>
                </div>
                <div className="text-right">
                  <div className="text-indigo-500 font-bold text-lg">280s</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">AHT</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-[150px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpiData}>
                  <defs>
                    <linearGradient id="colorCsat" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="csat" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorCsat)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex-1 kpi-card bg-slate-900 text-white border-none shadow-2xl shadow-slate-900/40 cursor-pointer"
            onClick={() => onOpenModal("AI Performance Insights", (
              <div className="space-y-6">
                <div className="flex items-center gap-4 p-6 bg-indigo-900/50 rounded-3xl border border-indigo-500/30">
                  <Brain className="text-indigo-400" size={32} />
                  <div>
                    <h4 className="font-bold text-white">Pattern Recognition</h4>
                    <p className="text-sm text-indigo-200">ByteAI noticed you perform best during high-volume morning shifts.</p>
                  </div>
                </div>
                <div className="p-6 bg-slate-50 rounded-3xl text-slate-900">
                  <h4 className="font-bold mb-2">Operational Goal Alignment</h4>
                  <p className="text-sm">Your current training path is aligned with the "Q1 Efficiency Drive" goal set by management.</p>
                </div>
              </div>
            ))}
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center">
                <Lightbulb size={24} className="text-white" />
              </div>
              <h3 className="font-display text-xl font-bold text-white">AI Insights</h3>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-white/10 rounded-2xl border border-white/20">
                <p className="text-sm font-medium text-slate-100 leading-relaxed">
                  "Your empathy scores are top-tier. However, your <span className="text-brand-blue font-bold">First Call Resolution</span> dropped by 2%."
                </p>
              </div>
              <div className="p-4 bg-brand-blue/20 rounded-2xl border border-brand-blue/40">
                <div className="text-[10px] font-bold text-brand-blue uppercase tracking-widest mb-1">Recommended Action</div>
                <p className="text-sm font-bold text-white">Complete 'Technical Troubleshooting 101'</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex-1 flex flex-col gap-8">
        <div className="flex items-center justify-between px-4">
          <h3 className="font-display text-2xl font-bold">Recent Learning</h3>
          <button className="text-slate-300 hover:text-slate-900 transition-colors">
            <ChevronRight size={28} />
          </button>
        </div>
        
        <div className="flex flex-col gap-6">
          {completedCourses.map((course, i) => (
            <SideArticle 
              key={i}
              index={i}
              title={course.title}
              tag={course.tag}
              image={course.img}
            />
          ))}
        </div>

        <motion.button 
          whileHover={{ scale: 1.02, backgroundColor: '#f8fafc' }}
          className="mt-auto w-full py-5 rounded-full border-2 border-slate-100 text-slate-500 font-bold text-base flex items-center justify-center gap-3 transition-all"
        >
          View all history <ArrowUpRight size={20} />
        </motion.button>
      </div>
    </div>
  );
};

const CoursesPage = () => {
  const courses = [
    { title: "Advanced Conflict Resolution", level: "Intermediate", duration: "2h 30m", rating: 4.9, img: "https://picsum.photos/seed/conflict/800/600" },
    { title: "Omnichannel Mastery", level: "Advanced", duration: "4h 15m", rating: 4.8, img: "https://picsum.photos/seed/omni/800/600" },
    { title: "Data Privacy in BPO", level: "Beginner", duration: "1h 45m", rating: 4.7, img: "https://picsum.photos/seed/privacy/800/600" },
    { title: "Emotional Intelligence", level: "Beginner", duration: "3h 00m", rating: 5.0, img: "https://picsum.photos/seed/eq/800/600" },
    { title: "Technical Troubleshooting", level: "Intermediate", duration: "5h 20m", rating: 4.6, img: "https://picsum.photos/seed/tech/800/600" },
    { title: "Leadership for Team Leads", level: "Advanced", duration: "6h 10m", rating: 4.9, img: "https://picsum.photos/seed/lead/800/600" },
  ];

  return (
    <div className="grid grid-cols-3 gap-8">
      {courses.map((course, i) => (
        <motion.div 
          key={i}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer"
        >
          <div className="h-48 relative overflow-hidden">
            <img src={course.img} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
            <div className="absolute top-4 left-4">
              <span className="glass-pill">{course.level}</span>
            </div>
          </div>
          <div className="p-8">
            <h3 className="font-display text-xl font-bold mb-4 group-hover:text-brand-blue transition-colors">{course.title}</h3>
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <Clock size={14} /> {course.duration}
              </div>
              <div className="flex items-center gap-2">
                <Award size={14} className="text-amber-500" /> {course.rating}
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

const PathsPage = () => {
  const [selectedPath, setSelectedPath] = useState(0);

  const paths = [
    { 
      id: 0, 
      name: "Customer Experience Excellence", 
      icon: User,
      nodes: [
        { id: 1, title: "Onboarding", x: 100, y: 100, status: 'completed' },
        { id: 2, title: "Empathy Training", x: 300, y: 250, status: 'completed' },
        { id: 3, title: "Advanced Soft Skills", x: 500, y: 100, status: 'current' },
        { id: 4, title: "CX Specialist Cert", x: 700, y: 250, status: 'locked' },
      ]
    },
    { 
      id: 1, 
      name: "Technical Support Tier 2", 
      icon: Shield,
      nodes: [
        { id: 1, title: "Basic Troubleshooting", x: 100, y: 100, status: 'completed' },
        { id: 2, title: "Network Protocols", x: 300, y: 250, status: 'current' },
        { id: 3, title: "System Administration", x: 500, y: 100, status: 'locked' },
        { id: 4, title: "Tier 2 Certification", x: 700, y: 250, status: 'locked' },
      ]
    },
    { 
      id: 2, 
      name: "Operational Leadership", 
      icon: Briefcase,
      nodes: [
        { id: 1, title: "Team Lead Basics", x: 100, y: 100, status: 'completed' },
        { id: 2, title: "Performance Coaching", x: 300, y: 250, status: 'locked' },
        { id: 3, title: "Operational Metrics", x: 500, y: 100, status: 'locked' },
        { id: 4, title: "Operations Manager", x: 700, y: 250, status: 'locked' },
      ]
    },
  ];

  const activeNodes = paths[selectedPath].nodes;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        {paths.map((path, i) => (
          <button 
            key={i}
            onClick={() => setSelectedPath(i)}
            className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-sm transition-all whitespace-nowrap ${selectedPath === i ? 'bg-brand-blue text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
          >
            <path.icon size={18} />
            {path.name}
          </button>
        ))}
      </div>

      <div className="relative h-[500px] bg-slate-50 rounded-5xl border border-slate-100 overflow-hidden flex items-center justify-center">
        <svg className="absolute inset-0 w-full h-full">
          {activeNodes.map((node, i) => {
            if (i === activeNodes.length - 1) return null;
            const next = activeNodes[i + 1];
            return (
              <motion.line 
                key={`line-${selectedPath}-${i}`}
                x1={node.x} y1={node.y}
                x2={next.x} y2={next.y}
                stroke={node.status === 'completed' ? '#0ea5e9' : '#e2e8f0'}
                strokeWidth="4"
                strokeDasharray="8 8"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              />
            );
          })}
        </svg>
        
        {activeNodes.map((node, i) => (
          <motion.div 
            key={`${selectedPath}-${node.id}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: i * 0.2 }}
            style={{ left: node.x - 32, top: node.y - 32 }}
            className="absolute"
          >
            <div className={`node-circle ${node.status === 'completed' ? 'border-emerald-500' : node.status === 'current' ? 'border-brand-blue animate-pulse' : 'border-slate-200'}`}>
              {node.status === 'completed' ? <CheckCircle2 className="text-emerald-500" /> : <BookOpen className={node.status === 'current' ? 'text-brand-blue' : 'text-slate-300'} />}
            </div>
            <div className="absolute top-20 left-1/2 -translate-x-1/2 whitespace-nowrap text-sm font-bold text-slate-600">
              {node.title}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const ProgressPage = () => {
  const data = [
    { name: 'CSAT', value: 92, color: '#0ea5e9' },
    { name: 'AHT', value: 85, color: '#6366f1' },
    { name: 'FCR', value: 78, color: '#10b981' },
    { name: 'QA', value: 95, color: '#f59e0b' },
  ];

  return (
    <div className="grid grid-cols-2 gap-10">
      <div className="kpi-card h-[400px]">
        <h3 className="font-display text-2xl font-bold mb-8">Learner Progress</h3>
        <div className="space-y-8">
          {data.map((item, i) => (
            <div key={i}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-bold text-slate-600 uppercase tracking-widest">{item.name}</span>
                <span className="text-sm font-bold text-slate-900">{item.value}%</span>
              </div>
              <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${item.value}%` }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: item.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="kpi-card h-[400px] flex items-center justify-center">
        <div className="w-full h-full">
          <h3 className="font-display text-2xl font-bold mb-8">KPI Distribution</h3>
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const MemoryPage = () => {
  const insights = [
    { icon: Zap, title: "Fast Learner", desc: "You complete technical modules 30% faster than average." },
    { icon: Brain, title: "Conceptual Thinker", desc: "You excel in conflict resolution and empathy-based scenarios." },
    { icon: Target, title: "Goal Oriented", desc: "You consistently hit your weekly learning targets." },
  ];

  return (
    <div className="flex flex-col gap-10">
      <div className="hero-block h-[300px] bg-indigo-900 text-white p-16 flex items-center justify-between border-none">
        <div className="max-w-xl">
          <h2 className="font-display text-5xl font-bold mb-4">Sudar's Memory</h2>
          <p className="text-indigo-200 text-xl">Here's what I've learned about your unique learning style and performance patterns.</p>
        </div>
        <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center">
          <Brain size={64} className="text-white" />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8">
        {insights.map((insight, i) => (
          <motion.div 
            key={i}
            whileHover={{ y: -10 }}
            className="kpi-card p-10"
          >
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
              <insight.icon size={28} />
            </div>
            <h3 className="font-display text-2xl font-bold mb-2">{insight.title}</h3>
            <p className="text-slate-500 font-medium leading-relaxed">{insight.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const MorePage = () => {
  const settings = [
    { icon: Target, title: "Goals", desc: "Set your weekly learning and KPI targets." },
    { icon: Award, title: "Certifications", desc: "View and download your earned BPO certificates." },
    { icon: MoreHorizontal, title: "Preferences", desc: "Customize your learning experience and notifications." },
  ];

  return (
    <div className="grid grid-cols-3 gap-8">
      {settings.map((item, i) => (
        <motion.div 
          key={i}
          whileHover={{ scale: 1.05, rotate: 1 }}
          className="kpi-card p-10 cursor-pointer"
        >
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-600 mb-6">
            <item.icon size={28} />
          </div>
          <h3 className="font-display text-2xl font-bold mb-2">{item.title}</h3>
          <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
        </motion.div>
      ))}
    </div>
  );
};

// --- Main App ---

const GREETINGS = [
  "Right back at you",
  "Welcome back",
  "Happy learning",
  "Ready to learn?",
  "Good Afternoon",
  "Great to see you"
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Learn');
  const [greeting, setGreeting] = useState(GREETINGS[0]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string, content: React.ReactNode } | null>(null);

  useEffect(() => {
    const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
    setGreeting(randomGreeting);
  }, []);

  const renderContent = () => {
    switch (activeTab) {
      case 'Learn': return <Dashboard greeting={greeting} onOpenModal={(title, content) => setModalContent({ title, content })} />;
      case 'Courses': return <CoursesPage />;
      case 'Paths': return <PathsPage />;
      case 'Progress': return <ProgressPage />;
      case 'Memory': return <MemoryPage />;
      case 'More': return <MorePage />;
      default: return <Dashboard greeting={greeting} onOpenModal={(title, content) => setModalContent({ title, content })} />;
    }
  };

  return (
    <div className="main-container relative">
      {/* Header */}
      <header className="px-16 py-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-brand-blue rounded-2xl flex items-center justify-center shadow-lg shadow-brand-blue/20">
            <Sparkles className="text-white" size={28} />
          </div>
          <span className="font-display text-3xl font-bold tracking-tighter text-slate-800">ByteOS</span>
        </div>

        <nav className="glass-nav-container">
          {(['Learn', 'Courses', 'Paths', 'Progress', 'Memory'] as Tab[]).map(tab => (
            <NavPill 
              key={tab} 
              label={tab} 
              active={activeTab === tab} 
              onClick={setActiveTab} 
            />
          ))}
          <button className="glass-nav-item flex items-center gap-1">
            <span className="relative z-30 flex items-center gap-1">More <ChevronDown size={14} /></span>
          </button>
        </nav>

        <div className="flex items-center gap-6">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-blue transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search" 
              className="bg-slate-50 border border-slate-100 rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue/10 focus:bg-white transition-all w-56 focus:w-72"
            />
          </div>
          <div className="w-12 h-12 bg-slate-200 rounded-full border-2 border-white shadow-sm flex items-center justify-center font-bold text-slate-600 text-sm">
            DK
          </div>
        </div>
      </header>

      {/* Content Area */}
      <div className="scroll-container">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Floating Chat Button */}
      <motion.button 
        whileHover={{ scale: 1.1, rotate: 5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-12 right-12 w-20 h-20 bg-brand-blue text-white rounded-full flex items-center justify-center shadow-2xl z-50"
      >
        <MessageCircle size={32} />
      </motion.button>

      {/* Chat Window */}
      <ChatWindow isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Modal System */}
      <Modal 
        isOpen={!!modalContent} 
        onClose={() => setModalContent(null)} 
        title={modalContent?.title || ""}
      >
        {modalContent?.content}
      </Modal>

      {/* SVG Filters for Liquid Glass */}
      <div className="absolute h-0 w-0 overflow-hidden" aria-hidden="true">
        <svg>
          <filter id="switcher" primitiveUnits="objectBoundingBox">
            <feImage result="map" width="100%" height="100%" x="0" y="0" href="data:image/webp;base64,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" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="0.04" result="blur" />
            <feDisplacementMap id="disp" in="blur" in2="map" scale="0.5" xChannelSelector="R" yChannelSelector="G">
            </feDisplacementMap>
          </filter>
        </svg>
      </div>
    </div>
  );
}
