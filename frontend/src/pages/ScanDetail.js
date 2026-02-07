import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Scan, CheckCircle, AlertCircle, Loader2, Download, Stethoscope, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import Footer from '@/components/Footer';

const API_URL = `${process.env.REACT_APP_BACKEND_URL}/api`;

const ScanDetail = () => {
  const { scanId } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [scan, setScan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('patient');

  const fetchScan = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/scans/${scanId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setScan(response.data);
    } catch (error) {
      console.error('Failed to fetch scan:', error);
      toast.error('Scan not found');
      navigate('/history');
    } finally {
      setLoading(false);
    }
  }, [scanId, token, navigate]);

  useEffect(() => {
    fetchScan();
    
    // GSAP animations
    const loadGSAP = async () => {
      const gsap = (await import('gsap')).default;
      
      gsap.from('.scan-detail-header', {
        opacity: 0,
        y: 20,
        duration: 0.6,
        ease: 'power3.out'
      });
      
      gsap.from('.scan-image-container', {
        opacity: 0,
        scale: 0.98,
        duration: 0.8,
        ease: 'power3.out',
        delay: 0.2
      });
      
      gsap.from('.analysis-panel', {
        opacity: 0,
        x: 20,
        duration: 0.6,
        ease: 'power3.out',
        delay: 0.4
      });
    };

    loadGSAP();
  }, [fetchScan]);

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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDownload = () => {
    if (!scan?.image_base64) return;
    
    const link = document.createElement('a');
    link.href = `data:image/jpeg;base64,${scan.image_base64}`;
    link.download = scan.file_name || 'scan.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Image downloaded');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 mx-auto animate-spin text-white/50" />
          <p className="text-white/50 mt-4 font-mono text-sm">Loading scan details...</p>
        </div>
      </div>
    );
  }

  if (!scan) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <Sidebar />
      
      <main className="lg:pl-60 pt-20">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="scan-detail-header mb-8">
            <Button
              variant="ghost"
              className="mb-4 font-mono text-xs text-white/50 hover:text-white"
              onClick={() => navigate(-1)}
              data-testid="back-btn"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-mono text-2xl font-light uppercase tracking-wider" data-testid="scan-title">
                    {getScanTypeLabel(scan.scan_type)} Analysis
                  </h1>
                  {scan.status === 'completed' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {scan.status === 'failed' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="text-white/50 text-sm">{formatDate(scan.created_at)}</p>
              </div>
              
              <Button
                variant="outline"
                className="font-mono text-xs uppercase tracking-wider border-white/20 text-white hover:bg-white/10"
                onClick={handleDownload}
                data-testid="download-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Image
              </Button>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Image Section */}
            <div className="scan-image-container">
              <div className="noir-card p-4">
                <div className="aspect-square bg-zinc-950 relative overflow-hidden">
                  {scan.image_base64 ? (
                    <>
                      <img
                        src={`data:image/jpeg;base64,${scan.image_base64}`}
                        alt={scan.file_name}
                        className="w-full h-full object-contain"
                      />
                      {/* Corner markers */}
                      <div className="absolute top-4 left-4 w-8 h-8 border-l border-t border-white/40" />
                      <div className="absolute top-4 right-4 w-8 h-8 border-r border-t border-white/40" />
                      <div className="absolute bottom-4 left-4 w-8 h-8 border-l border-b border-white/40" />
                      <div className="absolute bottom-4 right-4 w-8 h-8 border-r border-b border-white/40" />
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Scan className="w-16 h-16 text-white/20" />
                    </div>
                  )}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <p className="font-mono text-xs text-white/50 truncate flex-1">
                    {scan.file_name}
                  </p>
                  <span className="font-mono text-xs uppercase tracking-wider px-2 py-1 bg-white/5 border border-white/10 ml-4">
                    {getScanTypeLabel(scan.scan_type)}
                  </span>
                </div>
              </div>
            </div>

            {/* Analysis Section */}
            <div className="analysis-panel">
              {scan.status === 'failed' ? (
                <div className="noir-card p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-red-500 mb-4" />
                  <h3 className="font-mono text-lg uppercase tracking-wider mb-2">Analysis Failed</h3>
                  <p className="text-white/60 text-sm">
                    The AI could not analyze this image. Please try uploading again.
                  </p>
                </div>
              ) : scan.status === 'processing' ? (
                <div className="noir-card p-8 text-center">
                  <Loader2 className="w-12 h-12 mx-auto animate-spin text-white/50 mb-4" />
                  <h3 className="font-mono text-lg uppercase tracking-wider mb-2">Analyzing...</h3>
                  <p className="text-white/60 text-sm">
                    AI is processing your medical image
                  </p>
                </div>
              ) : (
                <div className="noir-card p-6">
                  <Tabs value={activeView} onValueChange={setActiveView} className="w-full">
                    <TabsList className="w-full bg-white/5 border border-white/10 p-1 mb-6">
                      <TabsTrigger 
                        value="patient" 
                        className="flex-1 font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black"
                        data-testid="patient-view-tab"
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Patient View
                      </TabsTrigger>
                      <TabsTrigger 
                        value="doctor" 
                        className="flex-1 font-mono text-xs uppercase tracking-wider data-[state=active]:bg-white data-[state=active]:text-black"
                        data-testid="doctor-view-tab"
                      >
                        <Stethoscope className="w-4 h-4 mr-2" />
                        Doctor View
                      </TabsTrigger>
                    </TabsList>

                    {/* Patient View */}
                    <TabsContent value="patient" className="space-y-6" data-testid="patient-view-content">
                      {scan.patient_view ? (
                        <>
                          <div>
                            <h3 className="font-mono text-xs uppercase tracking-wider text-white/70 mb-3">
                              Summary
                            </h3>
                            <p className="text-white/90 leading-relaxed">
                              {scan.patient_view.summary}
                            </p>
                          </div>

                          {scan.patient_view.findings && scan.patient_view.findings.length > 0 && (
                            <div>
                              <h3 className="font-mono text-xs uppercase tracking-wider text-white/70 mb-3">
                                What We Found
                              </h3>
                              <ul className="space-y-2">
                                {scan.patient_view.findings.map((finding, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                                    <span className="text-white/80 text-sm">{finding}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {scan.patient_view.what_it_means && (
                            <div>
                              <h3 className="font-mono text-xs uppercase tracking-wider text-white/70 mb-3">
                                What This Means
                              </h3>
                              <p className="text-white/80 text-sm leading-relaxed">
                                {scan.patient_view.what_it_means}
                              </p>
                            </div>
                          )}

                          {scan.patient_view.next_steps && scan.patient_view.next_steps.length > 0 && (
                            <div>
                              <h3 className="font-mono text-xs uppercase tracking-wider text-white/70 mb-3">
                                Recommended Next Steps
                              </h3>
                              <ul className="space-y-2">
                                {scan.patient_view.next_steps.map((step, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <span className="font-mono text-xs text-white/40">{i + 1}.</span>
                                    <span className="text-white/80 text-sm">{step}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {scan.patient_view.reassurance && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20">
                              <p className="text-green-400 text-sm">
                                {scan.patient_view.reassurance}
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-white/50 text-center py-8">
                          Patient view not available
                        </p>
                      )}
                    </TabsContent>

                    {/* Doctor View */}
                    <TabsContent value="doctor" className="space-y-6" data-testid="doctor-view-content">
                      {scan.doctor_view ? (
                        <>
                          <div>
                            <h3 className="font-mono text-xs uppercase tracking-wider text-white/70 mb-3">
                              Clinical Summary
                            </h3>
                            <p className="text-white/90 leading-relaxed">
                              {scan.doctor_view.summary}
                            </p>
                          </div>

                          {scan.doctor_view.confidence_level && (
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10">
                              <span className="font-mono text-xs uppercase tracking-wider text-white/50">
                                Confidence:
                              </span>
                              <span className={`font-mono text-xs uppercase tracking-wider ${
                                scan.doctor_view.confidence_level === 'High' ? 'text-green-400' :
                                scan.doctor_view.confidence_level === 'Medium' ? 'text-yellow-400' :
                                'text-red-400'
                              }`}>
                                {scan.doctor_view.confidence_level}
                              </span>
                            </div>
                          )}

                          {scan.doctor_view.findings && scan.doctor_view.findings.length > 0 && (
                            <div>
                              <h3 className="font-mono text-xs uppercase tracking-wider text-white/70 mb-3">
                                Detailed Findings
                              </h3>
                              <ul className="space-y-2">
                                {scan.doctor_view.findings.map((finding, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 flex-shrink-0" />
                                    <span className="text-white/80 text-sm">{finding}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {scan.doctor_view.observations && scan.doctor_view.observations.length > 0 && (
                            <div>
                              <h3 className="font-mono text-xs uppercase tracking-wider text-white/70 mb-3">
                                Technical Observations
                              </h3>
                              <ul className="space-y-2">
                                {scan.doctor_view.observations.map((obs, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-white/40 mt-2 flex-shrink-0" />
                                    <span className="text-white/80 text-sm">{obs}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {scan.doctor_view.areas_of_concern && scan.doctor_view.areas_of_concern.length > 0 && (
                            <div>
                              <h3 className="font-mono text-xs uppercase tracking-wider text-red-400/70 mb-3">
                                Areas of Concern
                              </h3>
                              <ul className="space-y-2">
                                {scan.doctor_view.areas_of_concern.map((area, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                                    <span className="text-white/80 text-sm">{area}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {scan.doctor_view.recommendations && scan.doctor_view.recommendations.length > 0 && (
                            <div>
                              <h3 className="font-mono text-xs uppercase tracking-wider text-white/70 mb-3">
                                Recommendations
                              </h3>
                              <ul className="space-y-2">
                                {scan.doctor_view.recommendations.map((rec, i) => (
                                  <li key={i} className="flex items-start gap-3">
                                    <span className="font-mono text-xs text-white/40">{i + 1}.</span>
                                    <span className="text-white/80 text-sm">{rec}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        <p className="text-white/50 text-center py-8">
                          Doctor view not available
                        </p>
                      )}
                    </TabsContent>
                  </Tabs>

                  {/* Disclaimer */}
                  <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20">
                    <p className="text-yellow-400/80 text-xs font-mono">
                      DISCLAIMER: This AI analysis is for educational purposes only and should not 
                      replace professional medical advice. Always consult with a qualified healthcare 
                      provider for diagnosis and treatment.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <Footer />
      </main>
    </div>
  );
};

export default ScanDetail;
