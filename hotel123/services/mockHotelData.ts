// Mock Hotel Data with Comprehensive Coverage Across India
// This provides instant data while backend loads

export interface MockHotel {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  images: string[];
  description: string;
  amenities: string[];
  rating: number;
  pricePerNight: number;
  totalRooms: number;
}

export const MOCK_HOTELS: MockHotel[] = [
  // Maharashtra
  {
    id: "mh-001",
    name: "Taj Mahal Palace Mumbai",
    address: "Apollo Bunder, Colaba, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    latitude: 18.9220,
    longitude: 72.8332,
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"],
    description: "Iconic luxury hotel overlooking the Gateway of India",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Bar"],
    rating: 4.8,
    pricePerNight: 25000,
    totalRooms: 15
  },
  {
    id: "mh-002",
    name: "The Oberoi Mumbai",
    address: "Nariman Point, Mumbai",
    city: "Mumbai",
    state: "Maharashtra",
    latitude: 18.9254,
    longitude: 72.8235,
    images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"],
    description: "Contemporary luxury with stunning sea views",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym"],
    rating: 4.9,
    pricePerNight: 28000,
    totalRooms: 12
  },
  {
    id: "mh-003",
    name: "Zenbourg Pune",
    address: "Koregaon Park, Pune",
    city: "Pune",
    state: "Maharashtra",
    latitude: 18.5362,
    longitude: 73.8958,
    images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d"],
    description: "Modern boutique hotel in the heart of Pune",
    amenities: ["WiFi", "Restaurant", "Gym", "Parking"],
    rating: 4.5,
    pricePerNight: 8000,
    totalRooms: 20
  },
  // Delhi
  {
    id: "dl-001",
    name: "The Leela Palace New Delhi",
    address: "Diplomatic Enclave, Chanakyapuri",
    city: "New Delhi",
    state: "Delhi",
    latitude: 28.5923,
    longitude: 77.1838,
    images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4"],
    description: "Palatial luxury hotel near diplomatic area",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym", "Bar"],
    rating: 4.9,
    pricePerNight: 32000,
    totalRooms: 18
  },
  {
    id: "dl-002",
    name: "Zenbourg Connaught Place",
    address: "Connaught Place, New Delhi",
    city: "New Delhi",
    state: "Delhi",
    latitude: 28.6315,
    longitude: 77.2167,
    images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa"],
    description: "Central location with modern amenities",
    amenities: ["WiFi", "Restaurant", "Gym", "Parking"],
    rating: 4.6,
    pricePerNight: 9500,
    totalRooms: 25
  },
  // Karnataka
  {
    id: "ka-001",
    name: "Taj West End Bangalore",
    address: "Race Course Road, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    latitude: 12.9897,
    longitude: 77.5936,
    images: ["https://images.unsplash.com/photo-1564501049412-61c2a3083791"],
    description: "Heritage hotel with lush gardens",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym"],
    rating: 4.7,
    pricePerNight: 18000,
    totalRooms: 22
  },
  {
    id: "ka-002",
    name: "Zenbourg Mysore Palace View",
    address: "Near Mysore Palace, Mysore",
    city: "Mysore",
    state: "Karnataka",
    latitude: 12.3051,
    longitude: 76.6551,
    images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b"],
    description: "Boutique hotel with palace views",
    amenities: ["WiFi", "Restaurant", "Parking"],
    rating: 4.4,
    pricePerNight: 7500,
    totalRooms: 18
  },
  // West Bengal
  {
    id: "wb-001",
    name: "The Oberoi Grand Kolkata",
    address: "Jawaharlal Nehru Road, Kolkata",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.5626,
    longitude: 88.3516,
    images: ["https://images.unsplash.com/photo-1578683010236-d716f9a3f461"],
    description: "Colonial grandeur in the City of Joy",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym"],
    rating: 4.8,
    pricePerNight: 22000,
    totalRooms: 16
  },
  {
    id: "wb-002",
    name: "Zenbourg Park Street",
    address: "Park Street, Kolkata",
    city: "Kolkata",
    state: "West Bengal",
    latitude: 22.5535,
    longitude: 88.3516,
    images: ["https://images.unsplash.com/photo-1611892440504-42a792e24d32"],
    description: "Modern hotel on iconic Park Street",
    amenities: ["WiFi", "Restaurant", "Gym"],
    rating: 4.5,
    pricePerNight: 8500,
    totalRooms: 20
  },
  // Tamil Nadu
  {
    id: "tn-001",
    name: "Taj Coromandel Chennai",
    address: "Mahatma Gandhi Road, Chennai",
    city: "Chennai",
    state: "Tamil Nadu",
    latitude: 13.0569,
    longitude: 80.2574,
    images: ["https://images.unsplash.com/photo-1596436889106-be35e843f974"],
    description: "Elegant hotel in the heart of Chennai",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Gym"],
    rating: 4.7,
    pricePerNight: 16000,
    totalRooms: 24
  },
  // Rajasthan
  {
    id: "rj-001",
    name: "Taj Lake Palace Udaipur",
    address: "Pichola Lake, Udaipur",
    city: "Udaipur",
    state: "Rajasthan",
    latitude: 24.5760,
    longitude: 73.6806,
    images: ["https://images.unsplash.com/photo-1582719508461-905c673771fd"],
    description: "Floating palace hotel on Lake Pichola",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Boat Service"],
    rating: 5.0,
    pricePerNight: 45000,
    totalRooms: 10
  },
  {
    id: "rj-002",
    name: "Zenbourg Jaipur Pink City",
    address: "MI Road, Jaipur",
    city: "Jaipur",
    state: "Rajasthan",
    latitude: 26.9124,
    longitude: 75.7873,
    images: ["https://images.unsplash.com/photo-1631049307264-da0ec9d70304"],
    description: "Heritage-style hotel in Pink City",
    amenities: ["WiFi", "Restaurant", "Parking"],
    rating: 4.6,
    pricePerNight: 9000,
    totalRooms: 28
  },
  // Gujarat
  {
    id: "gj-001",
    name: "Zenbourg Ahmedabad",
    address: "SG Highway, Ahmedabad",
    city: "Ahmedabad",
    state: "Gujarat",
    latitude: 23.0225,
    longitude: 72.5714,
    images: ["https://images.unsplash.com/photo-1590490360182-c33d57733427"],
    description: "Business hotel with modern facilities",
    amenities: ["WiFi", "Restaurant", "Gym", "Conference Rooms"],
    rating: 4.4,
    pricePerNight: 7000,
    totalRooms: 30
  },
  // Kerala
  {
    id: "kl-001",
    name: "Taj Malabar Kochi",
    address: "Willingdon Island, Kochi",
    city: "Kochi",
    state: "Kerala",
    latitude: 9.9674,
    longitude: 76.2641,
    images: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9"],
    description: "Waterfront luxury with backwater views",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Ayurveda"],
    rating: 4.8,
    pricePerNight: 19000,
    totalRooms: 20
  },
  // Goa
  {
    id: "ga-001",
    name: "Taj Exotica Goa",
    address: "Calwaddo, Benaulim",
    city: "Benaulim",
    state: "Goa",
    latitude: 15.2632,
    longitude: 73.9299,
    images: ["https://images.unsplash.com/photo-1559827260-dc66d52bef19"],
    description: "Beachfront paradise resort",
    amenities: ["WiFi", "Pool", "Spa", "Beach Access", "Water Sports"],
    rating: 4.9,
    pricePerNight: 24000,
    totalRooms: 35
  },
  // Uttar Pradesh
  {
    id: "up-001",
    name: "The Oberoi Amarvilas Agra",
    address: "Taj East Gate Road, Agra",
    city: "Agra",
    state: "Uttar Pradesh",
    latitude: 27.1751,
    longitude: 78.0421,
    images: ["https://images.unsplash.com/photo-1618773928121-c32242e63f39"],
    description: "Luxury hotel with Taj Mahal views",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Taj View"],
    rating: 5.0,
    pricePerNight: 52000,
    totalRooms: 12
  },
  // Punjab
  {
    id: "pb-001",
    name: "Zenbourg Amritsar Golden Temple",
    address: "Near Golden Temple, Amritsar",
    city: "Amritsar",
    state: "Punjab",
    latitude: 31.6200,
    longitude: 74.8765,
    images: ["https://images.unsplash.com/photo-1625244724120-1fd1d34d00f6"],
    description: "Heritage hotel near Golden Temple",
    amenities: ["WiFi", "Restaurant", "Parking"],
    rating: 4.5,
    pricePerNight: 6500,
    totalRooms: 22
  },
  // Telangana
  {
    id: "tg-001",
    name: "Taj Falaknuma Palace Hyderabad",
    address: "Engine Bowli, Falaknuma",
    city: "Hyderabad",
    state: "Telangana",
    latitude: 17.3297,
    longitude: 78.4673,
    images: ["https://images.unsplash.com/photo-1584132967334-10e028bd69f7"],
    description: "Opulent palace hotel",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant", "Palace Tours"],
    rating: 4.9,
    pricePerNight: 48000,
    totalRooms: 14
  },
  // Odisha
  {
    id: "od-001",
    name: "Mayfair Lagoon Bhubaneswar",
    address: "Jaydev Vihar, Bhubaneswar",
    city: "Bhubaneswar",
    state: "Odisha",
    latitude: 20.2961,
    longitude: 85.8245,
    images: ["https://images.unsplash.com/photo-1587985064135-0366536eab42"],
    description: "Lagoon-side luxury resort",
    amenities: ["WiFi", "Pool", "Spa", "Restaurant"],
    rating: 4.6,
    pricePerNight: 12000,
    totalRooms: 18
  },
  // Himachal Pradesh
  {
    id: "hp-001",
    name: "Wildflower Hall Shimla",
    address: "Chharabra, Shimla",
    city: "Shimla",
    state: "Himachal Pradesh",
    latitude: 31.0927,
    longitude: 77.1727,
    images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d"],
    description: "Mountain retreat with Himalayan views",
    amenities: ["WiFi", "Pool", "Spa", "Mountain Activities"],
    rating: 4.8,
    pricePerNight: 28000,
    totalRooms: 16
  },
  // Andhra Pradesh
  {
    id: "ap-001",
    name: "Novotel Visakhapatnam",
    address: "Beach Road, Visakhapatnam",
    city: "Visakhapatnam",
    state: "Andhra Pradesh",
    latitude: 17.7231,
    longitude: 83.3012,
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945"],
    description: "Beachfront hotel with modern amenities",
    amenities: ["WiFi", "Pool", "Restaurant", "Beach Access"],
    rating: 4.5,
    pricePerNight: 11000,
    totalRooms: 26
  },
  // Madhya Pradesh
  {
    id: "mp-001",
    name: "Jehan Numa Palace Bhopal",
    address: "Shyamla Hills, Bhopal",
    city: "Bhopal",
    state: "Madhya Pradesh",
    latitude: 23.2599,
    longitude: 77.4126,
    images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb"],
    description: "Heritage palace hotel",
    amenities: ["WiFi", "Pool", "Restaurant", "Heritage Tours"],
    rating: 4.6,
    pricePerNight: 13000,
    totalRooms: 20
  },
];

// Helper function to filter hotels by location
export function filterHotelsByLocation(location?: string): MockHotel[] {
  if (!location) return MOCK_HOTELS;
  
  const searchTerm = location.toLowerCase();
  return MOCK_HOTELS.filter(hotel => 
    hotel.city.toLowerCase().includes(searchTerm) ||
    hotel.state.toLowerCase().includes(searchTerm) ||
    hotel.name.toLowerCase().includes(searchTerm)
  );
}

// Helper function to search hotels
export function searchHotels(query: string): MockHotel[] {
  const searchTerm = query.toLowerCase();
  return MOCK_HOTELS.filter(hotel =>
    hotel.name.toLowerCase().includes(searchTerm) ||
    hotel.city.toLowerCase().includes(searchTerm) ||
    hotel.state.toLowerCase().includes(searchTerm) ||
    hotel.description.toLowerCase().includes(searchTerm)
  );
}
