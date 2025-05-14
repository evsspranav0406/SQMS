
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Clock, Facebook, Instagram, Twitter } from 'lucide-react';
const Footer = () => {
  return (
    <footer className="bg-secondary text-white pt-12 pb-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <img src="/foodtechie logo.jpeg" alt="Food Techie" className="h-10 mb-4" />
            <p className="text-gray-300 mb-4">
              Delicious food served in a welcoming atmosphere. Join us for an unforgettable dining experience.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-primary">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-gray-300 hover:text-primary">
                <Twitter size={20} />
              </a>
            </div>
          </div>
          
          <div>
              <li className="flex items-center">
                <Mail size={16} className="mr-2 text-primary" />
                <span>foodtechie2025@gmail.com</span>
              </li>
              <li className="flex items-center">
                <MapPin size={16} className="mr-2 text-primary" />
                <span>Food Street, Hitech City </span>
              </li>
              <li className="flex items-center">
                <Clock size={16} className="mr-2 text-primary" />
                <span>Mon-Sun: 24/7</span>
              </li>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-primary transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/menu" className="text-gray-300 hover:text-primary transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-primary transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/reserve" className="text-gray-300 hover:text-primary transition-colors">
                  Reserve Table
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-300">
          <p>&copy;  Food Techie. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
