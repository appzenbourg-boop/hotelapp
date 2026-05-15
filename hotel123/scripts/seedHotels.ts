// Comprehensive Hotel Seed Data for All Indian States
// Run this to populate the database with hotels across India

const INDIAN_STATES_HOTELS = {
  "Maharashtra": [
    {
      name: "Taj Mahal Palace Mumbai",
      address: "Apollo Bunder, Colaba, Mumbai, Maharashtra 400001",
      city: "Mumbai",
      state: "Maharashtra",
      latitude: 18.9220,
      longitude: 72.8332,
      images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"],
      description: "Iconic luxury hotel overlooking the Gateway of India",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Bar"],
      rating: 4.8,
      pricePerNight: 25000,
      rooms: [
        { roomNumber: "101", type: "Deluxe", capacity: 2, pricePerNight: 25000 },
        { roomNumber: "102", type: "Suite", capacity: 4, pricePerNight: 45000 },
        { roomNumber: "103", type: "Premium", capacity: 3, pricePerNight: 35000 }
      ]
    },
    {
      name: "The Oberoi Mumbai",
      address: "Nariman Point, Mumbai, Maharashtra 400021",
      city: "Mumbai",
      state: "Maharashtra",
      latitude: 18.9254,
      longitude: 72.8235,
      images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"],
      description: "Contemporary luxury with stunning sea views",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Concierge"],
      rating: 4.9,
      pricePerNight: 28000,
      rooms: [
        { roomNumber: "201", type: "Deluxe", capacity: 2, pricePerNight: 28000 },
        { roomNumber: "202", type: "Suite", capacity: 4, pricePerNight: 48000 }
      ]
    },
    {
      name: "Zenbourg Pune",
      address: "Koregaon Park, Pune, Maharashtra 411001",
      city: "Pune",
      state: "Maharashtra",
      latitude: 18.5362,
      longitude: 73.8958,
      images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d"],
      description: "Modern boutique hotel in the heart of Pune",
      amenities: ["WiFi", "Restaurant", "Gym", "Parking"],
      rating: 4.5,
      pricePerNight: 8000,
      rooms: [
        { roomNumber: "301", type: "Standard", capacity: 2, pricePerNight: 8000 },
        { roomNumber: "302", type: "Deluxe", capacity: 3, pricePerNight: 12000 }
      ]
    }
  ],
  "Delhi": [
    {
      name: "The Leela Palace New Delhi",
      address: "Diplomatic Enclave, Chanakyapuri, New Delhi 110023",
      city: "New Delhi",
      state: "Delhi",
      latitude: 28.5923,
      longitude: 77.1838,
      images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4"],
      description: "Palatial luxury hotel near diplomatic area",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Bar", "Concierge"],
      rating: 4.9,
      pricePerNight: 32000,
      rooms: [
        { roomNumber: "401", type: "Royal Suite", capacity: 4, pricePerNight: 55000 },
        { roomNumber: "402", type: "Deluxe", capacity: 2, pricePerNight: 32000 }
      ]
    },
    {
      name: "Zenbourg Connaught Place",
      address: "Connaught Place, New Delhi 110001",
      city: "New Delhi",
      state: "Delhi",
      latitude: 28.6315,
      longitude: 77.2167,
      images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa"],
      description: "Central location with modern amenities",
      amenities: ["WiFi", "Restaurant", "Gym", "Parking", "24/7 Service"],
      rating: 4.6,
      pricePerNight: 9500,
      rooms: [
        { roomNumber: "501", type: "Standard", capacity: 2, pricePerNight: 9500 },
        { roomNumber: "502", type: "Premium", capacity: 3, pricePerNight: 14000 }
      ]
    }
  ],
  "Karnataka": [
    {
      name: "Taj West End Bangalore",
      address: "Race Course Road, Bangalore, Karnataka 560001",
      city: "Bangalore",
      state: "Karnataka",
      latitude: 12.9897,
      longitude: 77.5936,
      images: ["https://images.unsplash.com/photo-1564501049412-61c2a3083791"],
      description: "Heritage hotel with lush gardens",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Garden"],
      rating: 4.7,
      pricePerNight: 18000,
      rooms: [
        { roomNumber: "601", type: "Heritage Room", capacity: 2, pricePerNight: 18000 },
        { roomNumber: "602", type: "Suite", capacity: 4, pricePerNight: 32000 }
      ]
    },
    {
      name: "Zenbourg Mysore Palace View",
      address: "Near Mysore Palace, Mysore, Karnataka 570001",
      city: "Mysore",
      state: "Karnataka",
      latitude: 12.3051,
      longitude: 76.6551,
      images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"],
      description: "Boutique hotel with palace views",
      amenities: ["WiFi", "Restaurant", "Parking", "Tour Desk"],
      rating: 4.4,
      pricePerNight: 7500,
      rooms: [
        { roomNumber: "701", type: "Standard", capacity: 2, pricePerNight: 7500 },
        { roomNumber: "702", type: "Deluxe", capacity: 3, pricePerNight: 11000 }
      ]
    }
  ],
  "West Bengal": [
    {
      name: "The Oberoi Grand Kolkata",
      address: "15 Jawaharlal Nehru Road, Kolkata, West Bengal 700013",
      city: "Kolkata",
      state: "West Bengal",
      latitude: 22.5626,
      longitude: 88.3516,
      images: ["https://images.unsplash.com/photo-1578683010236-d716f9a3f461"],
      description: "Colonial grandeur in the City of Joy",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Bar"],
      rating: 4.8,
      pricePerNight: 22000,
      rooms: [
        { roomNumber: "801", type: "Luxury Room", capacity: 2, pricePerNight: 22000 },
        { roomNumber: "802", type: "Suite", capacity: 4, pricePerNight: 38000 }
      ]
    },
    {
      name: "Zenbourg Park Street",
      address: "Park Street, Kolkata, West Bengal 700016",
      city: "Kolkata",
      state: "West Bengal",
      latitude: 22.5535,
      longitude: 88.3516,
      images: ["https://images.unsplash.com/photo-1611892440504-42a792e24d32"],
      description: "Modern hotel on iconic Park Street",
      amenities: ["WiFi", "Restaurant", "Gym", "Parking"],
      rating: 4.5,
      pricePerNight: 8500,
      rooms: [
        { roomNumber: "901", type: "Standard", capacity: 2, pricePerNight: 8500 }
      ]
    }
  ],
  "Tamil Nadu": [
    {
      name: "Taj Coromandel Chennai",
      address: "37 Mahatma Gandhi Road, Chennai, Tamil Nadu 600034",
      city: "Chennai",
      state: "Tamil Nadu",
      latitude: 13.0569,
      longitude: 80.2574,
      images: ["https://images.unsplash.com/photo-1596436889106-be35e843f974"],
      description: "Elegant hotel in the heart of Chennai",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Bar"],
      rating: 4.7,
      pricePerNight: 16000,
      rooms: [
        { roomNumber: "1001", type: "Deluxe", capacity: 2, pricePerNight: 16000 },
        { roomNumber: "1002", type: "Executive Suite", capacity: 3, pricePerNight: 28000 }
      ]
    }
  ],
  "Rajasthan": [
    {
      name: "Taj Lake Palace Udaipur",
      address: "Pichola Lake, Udaipur, Rajasthan 313001",
      city: "Udaipur",
      state: "Rajasthan",
      latitude: 24.5760,
      longitude: 73.6806,
      images: ["https://images.unsplash.com/photo-1582719508461-905c673771fd"],
      description: "Floating palace hotel on Lake Pichola",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Boat Service"],
      rating: 5.0,
      pricePerNight: 45000,
      rooms: [
        { roomNumber: "1101", type: "Palace Room", capacity: 2, pricePerNight: 45000 },
        { roomNumber: "1102", type: "Royal Suite", capacity: 4, pricePerNight: 85000 }
      ]
    },
    {
      name: "Zenbourg Jaipur Pink City",
      address: "MI Road, Jaipur, Rajasthan 302001",
      city: "Jaipur",
      state: "Rajasthan",
      latitude: 26.9124,
      longitude: 75.7873,
      images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304"],
      description: "Heritage-style hotel in Pink City",
      amenities: ["WiFi", "Restaurant", "Parking", "Cultural Programs"],
      rating: 4.6,
      pricePerNight: 9000,
      rooms: [
        { roomNumber: "1201", type: "Heritage Room", capacity: 2, pricePerNight: 9000 }
      ]
    }
  ],
  "Gujarat": [
    {
      name: "Zenbourg Ahmedabad",
      address: "SG Highway, Ahmedabad, Gujarat 380015",
      city: "Ahmedabad",
      state: "Gujarat",
      latitude: 23.0225,
      longitude: 72.5714,
      images: ["https://images.unsplash.com/photo-1590490360182-c33d57733427"],
      description: "Business hotel with modern facilities",
      amenities: ["WiFi", "Restaurant", "Gym", "Parking", "Conference Rooms"],
      rating: 4.4,
      pricePerNight: 7000,
      rooms: [
        { roomNumber: "1301", type: "Business Room", capacity: 2, pricePerNight: 7000 }
      ]
    }
  ],
  "Kerala": [
    {
      name: "Taj Malabar Kochi",
      address: "Willingdon Island, Kochi, Kerala 682009",
      city: "Kochi",
      state: "Kerala",
      latitude: 9.9674,
      longitude: 76.2641,
      images: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9"],
      description: "Waterfront luxury with backwater views",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Ayurveda Center"],
      rating: 4.8,
      pricePerNight: 19000,
      rooms: [
        { roomNumber: "1401", type: "Harbor View", capacity: 2, pricePerNight: 19000 }
      ]
    }
  ],
  "Goa": [
    {
      name: "Taj Exotica Goa",
      address: "Calwaddo, Benaulim, Goa 403716",
      city: "Benaulim",
      state: "Goa",
      latitude: 15.2632,
      longitude: 73.9299,
      images: ["https://images.unsplash.com/photo-1559827260-dc66d52bef19"],
      description: "Beachfront paradise resort",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Beach Access", "Water Sports"],
      rating: 4.9,
      pricePerNight: 24000,
      rooms: [
        { roomNumber: "1501", type: "Sea View", capacity: 2, pricePerNight: 24000 },
        { roomNumber: "1502", type: "Villa", capacity: 4, pricePerNight: 42000 }
      ]
    }
  ],
  "Uttar Pradesh": [
    {
      name: "The Oberoi Amarvilas Agra",
      address: "Taj East Gate Road, Agra, Uttar Pradesh 282001",
      city: "Agra",
      state: "Uttar Pradesh",
      latitude: 27.1751,
      longitude: 78.0421,
      images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39"],
      description: "Luxury hotel with Taj Mahal views",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Taj View"],
      rating: 5.0,
      pricePerNight: 52000,
      rooms: [
        { roomNumber: "1601", type: "Premier Room", capacity: 2, pricePerNight: 52000 }
      ]
    }
  ],
  "Punjab": [
    {
      name: "Zenbourg Amritsar Golden Temple",
      address: "Near Golden Temple, Amritsar, Punjab 143001",
      city: "Amritsar",
      state: "Punjab",
      latitude: 31.6200,
      longitude: 74.8765,
      images: ["https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6"],
      description: "Heritage hotel near Golden Temple",
      amenities: ["WiFi", "Restaurant", "Parking", "Temple Tours"],
      rating: 4.5,
      pricePerNight: 6500,
      rooms: [
        { roomNumber: "1701", type: "Standard", capacity: 2, pricePerNight: 6500 }
      ]
    }
  ],
  "Telangana": [
    {
      name: "Taj Falaknuma Palace Hyderabad",
      address: "Engine Bowli, Falaknuma, Hyderabad, Telangana 500053",
      city: "Hyderabad",
      state: "Telangana",
      latitude: 17.3297,
      longitude: 78.4673,
      images: ["https://images.unsplash.com/photo-1584132967334-10e028bd69f7"],
      description: "Opulent palace hotel",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Palace Tours"],
      rating: 4.9,
      pricePerNight: 48000,
      rooms: [
        { roomNumber: "1801", type: "Palace Room", capacity: 2, pricePerNight: 48000 }
      ]
    }
  ],
  "Odisha": [
    {
      name: "Mayfair Lagoon Bhubaneswar",
      address: "8-B Jaydev Vihar, Bhubaneswar, Odisha 751013",
      city: "Bhubaneswar",
      state: "Odisha",
      latitude: 20.2961,
      longitude: 85.8245,
      images: ["https://images.unsplash.com/photo-1587985064135-0366536eab42"],
      description: "Lagoon-side luxury resort",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym"],
      rating: 4.6,
      pricePerNight: 12000,
      rooms: [
        { roomNumber: "1901", type: "Lagoon View", capacity: 2, pricePerNight: 12000 }
      ]
    }
  ],
  "Himachal Pradesh": [
    {
      name: "Wildflower Hall Shimla",
      address: "Chharabra, Shimla, Himachal Pradesh 171012",
      city: "Shimla",
      state: "Himachal Pradesh",
      latitude: 31.0927,
      longitude: 77.1727,
      images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d"],
      description: "Mountain retreat with Himalayan views",
      amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Mountain Activities"],
      rating: 4.8,
      pricePerNight: 28000,
      rooms: [
        { roomNumber: "2001", type: "Mountain View", capacity: 2, pricePerNight: 28000 }
      ]
    }
  ]
};

export default INDIAN_STATES_HOTELS;
