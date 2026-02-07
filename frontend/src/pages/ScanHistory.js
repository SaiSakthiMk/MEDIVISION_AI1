import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Scan, CheckCircle, AlertCircle, Loader2, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ScanHistory = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchScans = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/scans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScans(response.data);
    } catch (error) {
      console.error('Failed to fetch scans:', error);
      toast.error('Failed to load scan history');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchScans();
    
    // GSAP animations
    const loadGSAP = async () => {
      const gsap = (await import('gsap')).default;
      
      gsap.from('.page-title', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power3.out'
      });
    };

    loadGSAP();
  }, [fetchScans]);

  const handleDelete = async (scanId) => {
    try {
      await axios.delete(`${API_URL}/scans/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Scan deleted');
      fetchScans();
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete scan');
    }
  };

  const getScanTypeLabel = (type) => {
    const labels = {
      xray: 'X-Ray',
      mri: 'MRI',
      ct_scan: 'CT Scan'
    };
    return labels[type] || type;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter scans
  const filteredScans = scans.filter((scan) => {
    const matchesSearch = scan.file_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || scan.scan_type === filterType;
    const matchesStatus = filterStatus === 'all' || scan.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Sidebar />
      
      <main className="lg:pl-60 pt-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-10">
            <h1 className="page-title font-mono text-3xl font-light uppercase tracking-wider mb-2" data-testid="history-title">
              Scan History
            </h1>
            <p className="text-white/60">
              View and manage all your medical image analyses
            </p>
          </div>

          {/* Filters */}
          <div className="noir-card p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <Input
                  placeholder="Search by filename..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-transparent border-white/20 text-white placeholder:text-white/30"
                  data-testid="search-input"
                />
              </div>
              <div className="flex gap-4">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[140px] bg-transparent border-white/20 text-white" data-testid="filter-type-select">
                    <Filter className="w-4 h-4 mr-2 text-white/50" />
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/20">
                    <SelectItem value="all" className="text-white">All Types</SelectItem>
                    <SelectItem value="xray" className="text-white">X-Ray</SelectItem>
                    <SelectItem value="mri" className="text-white">MRI</SelectItem>
                    <SelectItem value="ct_scan" className="text-white">CT Scan</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[140px] bg-transparent border-white/20 text-white" data-testid="filter-status-select">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-950 border-white/20">
                    <SelectItem value="all" className="text-white">All Status</SelectItem>
                    <SelectItem value="completed" className="text-white">Completed</SelectItem>
                    <SelectItem value="processing" className="text-white">Processing</SelectItem>
                    <SelectItem value="failed" className="text-white">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Results Count */}
          <p className="text-sm text-white/50 mb-4 font-mono">
            {filteredScans.length} {filteredScans.length === 1 ? 'scan' : 'scans'} found
          </p>

          {/* Scans List */}
          {loading ? (
            <div className="noir-card p-12 text-center">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-white/50" />
              <p className="text-white/50 mt-4 font-mono text-sm">Loading scans...</p>
            </div>
          ) : filteredScans.length === 0 ? (
            <div className="noir-card p-12 text-center">
              <Scan className="w-12 h-12 mx-auto text-white/20 mb-4" />
              <p className="text-white/50 font-mono text-sm">No scans found</p>
              {searchQuery || filterType !== 'all' || filterStatus !== 'all' ? (
                <Button
                  variant="ghost"
                  className="mt-4 font-mono text-xs"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                    setFilterStatus('all');
                  }}
                  data-testid="clear-filters-btn"
                >
                  Clear Filters
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredScans.map((scan, index) => (
                <div
                  key={scan.id}
                  className="noir-card p-4 flex items-center gap-4 hover:border-white/30 transition-colors cursor-pointer group"
                  onClick={() => navigate(`/scan/${scan.id}`)}
                  data-testid={`scan-item-${index}`}
                >
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-white/5 flex-shrink-0 overflow-hidden">
                    {scan.image_base64 ? (
                      <img
                        src={`data:image/jpeg;base64,${scan.image_base64}`}
                        alt={scan.file_name}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scan className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-mono text-xs uppercase tracking-wider px-2 py-1 bg-white/5 border border-white/10">
                        {getScanTypeLabel(scan.scan_type)}
                      </span>
                      {scan.status === 'completed' && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      {scan.status === 'failed' && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                      {scan.status === 'processing' && (
                        <Loader2 className="w-4 h-4 text-white/50 animate-spin" />
                      )}
                    </div>
                    <p className="text-sm text-white/80 truncate">{scan.file_name}</p>
                    <p className="text-xs text-white/40 mt-1 font-mono">
                      {formatDate(scan.created_at)}
                    </p>
                  </div>

                  {/* Actions */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-white/30 hover:text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                        data-testid={`delete-scan-${index}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-zinc-950 border-white/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-white font-mono uppercase tracking-wider">
                          Delete Scan
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-white/60">
                          This will permanently delete this scan and its analysis results. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-transparent border-white/20 text-white hover:bg-white/10">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-500 text-white hover:bg-red-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(scan.id);
                          }}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          )}
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default ScanHistory;
