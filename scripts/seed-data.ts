import 'dotenv/config';
import { db } from '../lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import { restaurants, events, lodges } from '../lib/data';

async function seedRestaurants() {
  const restaurantsCol = collection(db, 'restaurants');
  for (const restaurant of restaurants) {
    const searchTerms = [
      restaurant.name,
      restaurant.cuisine,
      ...restaurant.tags || [],
      ...restaurant.vibes || []
    ].map(term => term.toLowerCase());

    await setDoc(doc(restaurantsCol, restaurant.id), {
      name: restaurant.name,
      rating: restaurant.rating,
      reviews: restaurant.reviews,
      priceRange: restaurant.priceRange,
      cuisine: restaurant.cuisine,
      images: [restaurant.image],
      location: {
        lat: -17.8292,
        lng: 31.0522,
        address: `123 Example St, City`
      },
      tags: [restaurant.cuisine, restaurant.priceRange === '$$$' || restaurant.priceRange === '$$$$' ? 'Fine Dining' : 'Casual'],
      vibes: ['Romantic', 'Foodie'],
      menu: {
        "Main": [
          {
            name: "House Special",
            description: "Chef's signature dish",
            price: parseFloat(restaurant.priceRange.length.toString()) * 10,
            image: restaurant.image
          }
        ]
      },
      searchableText: searchTerms.join(' ')
    });
    console.log(`Seeded restaurant: ${restaurant.name}`);
  }
}

async function seedEvents() {
  const eventsCol = collection(db, 'events');
  for (const event of events) {
    const searchTerms = [
      event.name,
      event.category,
      ...event.tags || []
    ].map(term => term.toLowerCase());

    await setDoc(doc(eventsCol, event.id), {
      title: event.name,
      description: `Join us for an amazing ${event.category} experience`,
      tags: [event.category],
      location: {
        lat: -17.8200,
        lng: 31.0490,
        address: `456 Event Ave, City`
      },
      date: new Date().setDate(new Date().getDate() + 7),
      image: event.image,
      ticketLink: `https://tickets.example.com/${event.id}`,
      price: event.price,
      searchableText: searchTerms.join(' ')
    });
    console.log(`Seeded event: ${event.name}`);
  }
}

async function seedLodges() {
  const lodgesCol = collection(db, 'lodges');
  for (const lodge of lodges) {
    const searchTerms = [
      lodge.name,
      lodge.type,
      ...lodge.tags || []
    ].map(term => term.toLowerCase());

    await setDoc(doc(lodgesCol, lodge.id), {
      name: lodge.name,
      description: `Experience luxury and comfort at ${lodge.name}`,
      location: {
        lat: -17.9100,
        lng: 31.1120,
        address: `789 Lodge Road, City`
      },
      tags: [lodge.type],
      priceRange: `$${lodge.price} per night`,
      rating: lodge.rating,
      contact: {
        phone: "+1234567890",
        email: `booking@${lodge.name.toLowerCase().replace(/\s/g, '')}.com`
      },
      images: [lodge.image],
      searchableText: searchTerms.join(' ')
    });
    console.log(`Seeded lodge: ${lodge.name}`);
  }
}

async function seedDatabase() {
  try {
    await seedRestaurants();
    await seedEvents();
    await seedLodges();
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  }
}

// Execute the seeding
seedDatabase();