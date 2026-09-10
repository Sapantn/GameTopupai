import React, { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { AuditLog } from '../../types';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const data = await api.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const safeLogs = Array.isArray(logs) ? logs : [];
  const filteredLogs = safeLogs.filter(l =>
    !search ||
    (l.action || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.performedByName || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.targetId && l.targetId.toLowerCase().includes(search.toLowerCase())) ||
    (l.details && JSON.stringify(l.details).toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-heading font-extrabold text-white">
            Administrative Audit Trail
          </h2>
          <p className="text-xs text-slate-400">
            Immutable log of all staff actions, payment approvals, price changes, and customer dispatches.
          </p>
        </div>

        <div className="w-full sm:w-64 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            placeholder="Search audit actions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111424] border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      <div className="bg-[#111424] rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#141829] text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Staff Member</th>
                <th className="p-3.5">Action Executed</th>
                <th className="p-3.5">Target Entity</th>
                <th className="p-3.5">Audit Snapshot Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No audit logs found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#14182a] transition-colors">
                    <td className="p-3.5 font-mono text-slate-400 whitespace-nowrap">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : '—'}
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-white block">{log.performedByName}</span>
                      <span className="text-[10px] text-purple-400 font-mono">{log.role}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-purple-950 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-cyan-300">
                      {log.targetId || 'SYSTEM'}
                    </td>
                    <td className="p-3.5 text-slate-400 text-[11px] font-mono max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
