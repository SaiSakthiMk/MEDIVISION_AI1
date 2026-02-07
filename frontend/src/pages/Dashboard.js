import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Scan, History, Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [scanType, setScanType] = useState('xray');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recentScans, setRecentScans] = useState([]);
  const [stats, setStats] = useState({ total_scans: 0, completed_scans: 0, scan_types: {} });
  const [dragActive, setDragActive] = useState(false);
  const [currentScan, setCurrentScan] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [scansRes, statsRes] = await Promise.all([
        axios.get(`${API_URL}/scans`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/stats`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setRecentScans(scansRes.data.slice(0, 5));
      setStats(statsRes.data);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
    const loadGSAP = async () => {
      const gsap = (await import('gsap')).default;
      gsap.from('.dashboard-title', { opacity: 0, y: 20, duration: 0.6, ease: 'power3.out' });
      gsap.from('.stat-card', { opacity: 0, y: 20, stagger: 0.1, duration: 0.5, ease: 'power3.out', delay: 0.2 });
      gsap.from('.upload-zone', { opacity: 0, scale: 0.98, duration: 0.6, ease: 'power3.out', delay: 0.4 });
    };
    loadGSAP();
  }, [fetchData]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (selectedFile) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload a JPEG, PNG, or WEBP image');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Please select an image first'); return; }
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('scan_type', scanType);
    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => prev >= 90 ? (clearInterval(progressInterval), 90) : prev + 10);
      }, 200);
      const response = await axios.post(`${API_URL}/process-medical-image`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      });
      clearInterval(progressInterval);
      setUploadProgress(100);
      if (response.data.status === 'completed') {
        toast.success('Analysis complete!');
        setCurrentScan(response.data);
      } else if (response.data.status === 'failed') {
        toast.error('Analysis failed. Please try again.');
      }
      await fetchData();
      setTimeout(() => { setFile(null); setPreview(null); setUploadProgress(0); }, 1000);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(error.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const clearFile = () => { setFile(null); setPreview(null); setCurrentScan(null); };
  const getScanTypeLabel = (type) => ({ xray: 'X-Ray', mri: 'MRI', ct_scan: 'CT Scan' }[type] || type);

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />
      <Sidebar />
      
      <main className="lg:pl-60 pt-20">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-10">
            <h1 className="dashboard-title font-mono text-3xl font-light uppercase tracking-wider mb-2" data-testid="dashboard-title">
              Dashboard
            </h1>
            <p className="text-black/60">Welcome back, <span className="text-black">{user?.name}</span></p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="stat-card" data-testid="stat-total-scans">
              <div className="font-mono text-4xl font-light mb-2">{stats.total_scans}</div>
              <div className="text-xs uppercase tracking-widest text-black/50">Total Scans</div>
            </div>
            <div className="stat-card" data-testid="stat-completed-scans">
              <div className="font-mono text-4xl font-light mb-2">{stats.completed_scans}</div>
              <div className="text-xs uppercase tracking-widest text-black/50">Analyzed</div>
            </div>
            <div className="stat-card" data-testid="stat-scan-types">
              <div className="font-mono text-4xl font-light mb-2">{Object.keys(stats.scan_types).length || 0}</div>
              <div className="text-xs uppercase tracking-widest text-black/50">Scan Types</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="noir-card p-6">
                <h2 className="font-mono text-sm uppercase tracking-wider mb-6" data-testid="upload-section-title">New Analysis</h2>
                <div className="mb-6">
                  <label className="font-mono text-xs uppercase tracking-wider text-black/70 mb-2 block">Scan Type</label>
                  <Select value={scanType} onValueChange={setScanType}>
                    <SelectTrigger className="bg-zinc-100 border border-black/20 text-black" data-testid="scan-type-select">
                      <SelectValue placeholder="Select scan type" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-black/20">
                      <SelectItem value="xray" className="text-black">X-Ray</SelectItem>
                      <SelectItem value="mri" className="text-black">MRI</SelectItem>
                      <SelectItem value="ct_scan" className="text-black">CT Scan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div
                  className={`upload-zone relative min-h-[300px] flex flex-col items-center justify-center p-8 transition-all ${dragActive ? 'border-black/50 bg-zinc-100' : ''} ${preview ? 'border-solid' : 'border-dashed'}`}
                  onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
                  data-testid="upload-zone"
                >
                  <div className="scan-effect" />
                  {preview ? (
                    <div className="relative w-full h-full">
                      <button onClick={clearFile} className="absolute top-2 right-2 z-10 p-2 bg-white/80 hover:bg-white rounded-full border border-black/20" data-testid="clear-file-btn">
                        <X className="w-4 h-4" />
                      </button>
                      <img src={preview} alt="Preview" className="max-h-[250px] mx-auto object-contain" />
                      <div className="text-center mt-4">
                        <p className="font-mono text-sm text-black/70">{file?.name}</p>
                        <p className="text-xs text-black/40 mt-1">{(file?.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-12 h-12 text-black/30 mb-4" />
                      <p className="font-mono text-sm uppercase tracking-wider text-black/70 mb-2">Drop your medical image here</p>
                      <p className="text-xs text-black/40 mb-4">JPEG, PNG, or WEBP up to 10MB</p>
                      <label>
                        <input type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} data-testid="file-input" />
                        <span className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white font-mono text-xs uppercase tracking-wider cursor-pointer hover:bg-zinc-800 transition-colors">Browse Files</span>
                      </label>
                    </>
                  )}
                </div>

                {uploading && (
                  <div className="mt-4">
                    <Progress value={uploadProgress} className="h-1 bg-black/10" />
                    <p className="font-mono text-xs text-black/50 mt-2">{uploadProgress < 90 ? 'Uploading...' : 'Analyzing with AI...'}</p>
                  </div>
                )}

                <Button onClick={handleUpload} disabled={!file || uploading} className="w-full mt-6 font-mono text-xs uppercase tracking-wider bg-black text-white hover:bg-zinc-800 py-6 disabled:opacity-50" data-testid="analyze-btn">
                  {uploading ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Processing...</>) : (<><Scan className="w-4 h-4 mr-2" />Analyze Image</>)}
                </Button>
              </div>

              {currentScan && currentScan.status === 'completed' && (
                <div className="noir-card p-6 mt-6" data-testid="current-scan-result">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-mono text-sm uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />Analysis Complete
                    </h3>
                    <Button variant="ghost" size="sm" className="font-mono text-xs" onClick={() => navigate(`/scan/${currentScan.id}`)} data-testid="view-full-report-btn">View Full Report</Button>
                  </div>
                  <div className="p-4 bg-black/5 border border-black/10">
                    <h4 className="font-mono text-xs uppercase tracking-wider text-black/70 mb-3">Quick Summary</h4>
                    <p className="text-sm text-black/80 leading-relaxed">{currentScan.patient_view?.summary || 'Analysis completed successfully.'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="noir-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-mono text-sm uppercase tracking-wider" data-testid="recent-scans-title">Recent Scans</h2>
                  <Button variant="ghost" size="sm" className="font-mono text-xs text-black/50 hover:text-black" onClick={() => navigate('/history')} data-testid="view-all-scans-btn">
                    <History className="w-4 h-4 mr-2" />View All
                  </Button>
                </div>
                {recentScans.length === 0 ? (
                  <div className="text-center py-12 text-black/40">
                    <Scan className="w-8 h-8 mx-auto mb-3 opacity-50" />
                    <p className="text-sm">No scans yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentScans.map((scan, index) => (
                      <div key={scan.id} className="scan-item" onClick={() => navigate(`/scan/${scan.id}`)} data-testid={`recent-scan-${index}`}>
                        <div className="w-12 h-12 bg-black/5 flex items-center justify-center mr-4 flex-shrink-0">
                          {scan.status === 'completed' ? <CheckCircle className="w-5 h-5 text-green-600" /> : scan.status === 'failed' ? <AlertCircle className="w-5 h-5 text-red-500" /> : <Loader2 className="w-5 h-5 text-black/50 animate-spin" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-mono text-xs uppercase tracking-wider truncate">{getScanTypeLabel(scan.scan_type)}</p>
                          <p className="text-xs text-black/40 truncate mt-1">{scan.file_name}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </main>
    </div>
  );
};

export default Dashboard;
