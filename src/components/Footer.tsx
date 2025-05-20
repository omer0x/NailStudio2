import { Instagram, MessageCircle } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-gray-200 py-8">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center justify-center md:justify-start mb-4">
              <span className="text-xl font-semibold bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-pink-700">
                Medina Nails Studio
              </span>
            </div>
            <p className="text-gray-500 text-sm text-center md:text-left">
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
                className="p-2 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://www.threads.com/@medinanails.studio" 
                target="_blank" 
                rel="noopener noreferrer"
                className="p-2 rounded-full bg-pink-100 text-pink-600 hover:bg-pink-200 transition-colors"
                aria-label="Threads"
              >
                <MessageCircle size={20} />
              </a>
            </div>
            <p className="text-gray-500 text-sm">
              Questions? Contact us at <a href="mailto:info@medinanails.com" className="text-pink-600 hover:underline">info@medinanails.com</a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;