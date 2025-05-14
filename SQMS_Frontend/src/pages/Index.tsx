import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Utensils, CalendarDays, Star, Clock, Award } from 'lucide-react';
import axios from 'axios';

const Index = () => {
  const [featuredItems, setFeaturedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeaturedMenu = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/menu/featured');
        setFeaturedItems(res.data);
      } catch (err) {
        setError('Failed to load featured menu.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedMenu();
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section 
        className="relative flex items-center justify-center min-h-screen bg-cover bg-center"
        style={{ backgroundImage: "url('/White-Sauce pasta.jpg')" }}
      >
        <div className="absolute inset-0 hero-overlay"></div>
        <div className="container mx-auto px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 animate-fadeIn">
            Welcome to Food Techie
          </h1>
          <p className="text-xl md:text-2xl text-gray-200 mb-8">
            Blending refined tradition with intelligent elegance — our AI discreetly curates your dining journey, where time flows effortlessly and service feels timeless.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/menu">
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg flex items-center">
                <Utensils className="mr-2" />
                Explore Menu
              </Button>
            </Link>
            <Link to="/reserve">
              <Button variant="outline" className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-6 text-lg flex items-center">
                <CalendarDays className="mr-2" />
                Reserve Table
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Utensils className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Delicious Food</h3>
              <p className="text-gray-600">Our expert chefs create mouth-watering dishes using the freshest ingredients.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Award className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Quality Service</h3>
              <p className="text-gray-600">We pride ourselves on providing exceptional service to all our guests.</p>
            </div>
            <div className="bg-white p-8 rounded-lg shadow-md text-center">
              <div className="bg-primary/10 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                <Clock className="text-primary h-8 w-8" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Fast Booking</h3>
              <p className="text-gray-600">Reserve your table quickly and easily with our modern booking system.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Menu Items */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-6">Featured Menu</h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            Discover our chef's special selection of dishes that our customers love.
          </p>

          {loading ? (
            <p className="text-center text-gray-500">Loading featured items...</p>
          ) : error ? (
            <p className="text-center text-red-500">{error}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredItems.map((item, index) => (
                <div key={index} className="bg-white rounded-lg overflow-hidden shadow-md transition-transform hover:scale-[1.02]">
                  <img src={item.image} alt={item.name} className="w-full h-48 object-cover" />
                  <div className="p-6">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-xl font-semibold">{item.name}</h3>
                      <span className="text-lg font-bold text-primary">₹{item.price}</span>
                    </div>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16} className="fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="text-center mt-12">
            <Link to="/menu">
              <Button className="bg-primary hover:bg-primary/90 text-white px-8">
                View Full Menu
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/10">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Experience Food Techie?</h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Reserve your table now and enjoy our delicious menu in a welcoming atmosphere.
          </p>
          <Link to="/reserve">
            <Button className="bg-primary hover:bg-primary/90 text-white px-8 py-6 rounded-full text-lg">
              Reserve Your Table
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;
