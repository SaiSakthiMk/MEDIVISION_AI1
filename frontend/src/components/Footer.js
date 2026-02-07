import { Scan } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="border-t border-black/10 py-10 mt-20 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-black/20 flex items-center justify-center">
              <Scan className="w-4 h-4 text-black/50" />
            </div>
            <span className="font-mono text-xs uppercase tracking-widest text-black/50">
              MediVision AI
            </span>
          </div>

          {/* Developer Credits */}
          <div className="text-center" data-testid="developer-credits">
            <p className="text-xs uppercase tracking-[0.2em] text-black/40 font-mono">
              Developed by
            </p>
            <p className="text-xs uppercase tracking-[0.15em] text-black/60 font-mono mt-1">
              SAISAKTHI, Prasunambika, Mohammad Basit Wani
            </p>
          </div>

          {/* Copyright */}
          <p className="text-xs text-black/30 font-mono">
            © {new Date().getFullYear()} MediVision
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
