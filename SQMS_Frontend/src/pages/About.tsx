import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Users, Star, Clock, Award, Utensils, Eye } from 'lucide-react';

const About = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow pt-20">
        {/* About Section */}
        <div id="about" className="container mx-auto px-4 mb-16">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-6">About Food Techie</h1>
            <p className="text-gray-600 max-w-3xl mx-auto text-lg">
              We integrate smart AI-driven queue management with 
              modern dining to minimize wait times and elevate every guest's experience.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-2xl font-bold mb-5">Our Story</h1>
              <p className="text-gray-600 mb-4">
                At Food Techie Restaurant, we blend culinary excellence with cutting-edge
                technology to redefine the modern dining experience. Our Restaurant Queue
                Management System (RQMS) eliminates long wait times, streamlines table
                reservations, and enhances guest satisfaction through real-time updates and
                intelligent scheduling.
              </p>
              <p className="text-gray-600 mb-4">
                A hospitality visionary with a background in restaurant
                management and software engineering, Food Techie was built on the belief that
                technology should enhance—not replace—the human connection at the heart of
                dining.
              </p>
              <ul className="text-gray-600 list-disc pl-5 space-y-1 mb-4">
                <li>Smart Reservations: Book your table effortlessly and receive confirmation.</li>
                <li>Digital Queue Tracking: Live wait time updates and table-ready alerts.</li>
                <li>Interactive Menu: View and order from our full menu via QR code.</li>
                <li>Smart Service Alerts: Pre-arrival, feedback, cleaning, and more.</li>
              </ul>
              <p className="text-gray-600 mb-8">
                Join us and experience the future of dining—where every moment matters.
              </p>
            </div>

            <div className="rounded-lg overflow-hidden shadow-lg max-h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&h=600"
                alt="Modern restaurant interior with warm ambiance"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="bg-primary/5 py-16">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="bg-primary/10 p-4 inline-block rounded-full mb-4">
                <Star className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Our Mission</h3>
              <p className="text-gray-600">
                To serve exceptional cuisine in an environment where technology
                enhances—not replaces—the joy of dining.
              </p>
            </div>

            <div className="bg-white p-8 rounded-lg shadow-md">
              <div className="bg-primary/10 p-4 inline-block rounded-full mb-4">
                <Eye className="text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">Our Vision</h3>
              <p className="text-gray-600">
                To pioneer a future where restaurants combine hospitality with AI-driven
                efficiency to create seamless dining experiences.
              </p>
            </div>
          </div>
        </div>

        {/* Team */}
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Meet Our Team</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The passionate individuals behind Food Techie who ensure an amazing dining
              experience.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[ 
              {
                name: 'Anusha',
                role: 'Staff Manager',
                image:
                  '/team/Anusha.jpg',
              },
              {
                name: 'Bharath Chandra',
                role: 'Head Chef',
                image:
                  '/team/Bharath.jpg',
              },
              {
                name: 'Saironak',
                role: 'Customer Relationship Manager',
                image:
                  '/team/Ronak.jpg',
              },
{
  name: 'Pranav',
  role: 'Operations Manager',
  image:
    '/team/unnamed.jpg',
},
            ].map((member, index) => (
              <div
                key={index}
                className="bg-white rounded-lg overflow-hidden shadow-md text-center"
              >
                <img
                  src={member.image}
                  alt={`${member.name} - ${member.role}`}
                  className="w-full h-60 object-cover object-center"
                />
                <div className="p-6">
                  <h3 className="text-xl font-semibold">{member.name}</h3>
                  <p className="text-gray-600">{member.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Values */}
        <div className="bg-secondary text-white py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Values</h2>
              <p className="max-w-2xl mx-auto text-gray-300">
                The principles that guide everything we do at Food Techie.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[ 
                {
                  icon: <Utensils className="h-8 w-8" />,
                  title: 'Quality Food',
                  description:
                    'We never compromise on the quality of our ingredients or preparations.',
                },
                {
                  icon: <Users className="h-8 w-8" />,
                  title: 'Exceptional Service',
                  description:
                    'We believe in creating memorable experiences through attentive service.',
                },
                {
                  icon: <Award className="h-8 w-8" />,
                  title: 'Innovation',
                  description: 'We constantly seek new ways to improve our food and service.',
                },
                {
                  icon: <Clock className="h-8 w-8" />,
                  title: 'Efficiency',
                  description: 'We respect your time while never rushing the dining experience.',
                },
              ].map((value, index) => (
                <div key={index} className="bg-secondary/50 p-6 rounded-lg text-center">
                  <div className="bg-primary/20 p-4 rounded-full inline-flex items-center justify-center mb-4">
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                  <p className="text-gray-300">{value.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <br></br>
      <Footer />
    </div>
  );
};

export default About;
