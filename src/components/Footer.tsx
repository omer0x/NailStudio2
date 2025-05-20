import { Instagram, Video } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-[#d4c8a9]/30 border-t border-[#6e5d46]/10 py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <span className="text-2xl font-semibold text-[#6e5d46]">
                Medina Nails Studio
              </span>
            </div>
            <p className="text-[#6e5d46]/70 text-sm text-center md:text-left">
              Professional nail care and beauty services. <br />
              © {currentYear} Medina Nails. All rights reserved. Developed by Omer Musliu.
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end">
            <div className="flex space-x-4 mb-4">
              <a 
                href="https://www.instagram.com/medinanails.studio/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-[#6e5d46] text-[#d4c8a9] hover:bg-[#6e5d46]/90 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.tiktok.com/@medinanails.studio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-3 rounded-full bg-[#6e5d46] text-[#d4c8a9] hover:bg-[#6e5d46]/90 transition-colors"
                aria-label="Threads"
              >
                <Video size={20} />
              </a>
            </div>
            <p className="text-[#6e5d46]/70 text-sm">
              Questions? Contact us at <a href="mailto:info@medinanails.com" className="text-[#6e5d46] font-medium hover:underline">info@medinanails.com</a> <a href="tel:+38971949746" className="text-[#6e5d46] font-medium hover:underline">+38971949746</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;