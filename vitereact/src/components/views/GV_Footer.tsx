import React from "react";
import { Link } from "react-router-dom";

const GV_Footer: React.FC = () => {
  return (
    <>
      <footer className="bg-gray-800 text-gray-300 py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          {/* Branding and Copyright */}
          <div className="text-sm">
            &copy; {new Date().getFullYear()} ProjectPro. All Rights Reserved.
          </div>
          {/* Legal and Supplementary Links */}
          <div className="mt-2 md:mt-0 space-x-4">
            <Link to="/privacy-policy" className="text-sm hover:text-white">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-sm hover:text-white">
              Terms of Service
            </Link>
            <Link to="/faq" className="text-sm hover:text-white">
              FAQs
            </Link>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GV_Footer;