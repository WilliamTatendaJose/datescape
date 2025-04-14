1. /users
Each document represents a user.

json
{
  "displayName": "Tariro Moyo",
  "email": "tariro@email.com",
  "interests": ["Restaurants", "Events", "Lodges"],
  "vibes": ["Romantic", "Foodie"],
  "savedPlans": ["plan_123"],
  "likedRestaurants": ["restaurant_001"],
  "likedEvents": ["event_001"],
  "likedLodges": ["lodge_001"]
}
2. /restaurants
Each document represents a restaurant.

json
Copy
Edit
{
  "name": "The Bistro Garden",
  "location": {
    "lat": -17.8292,
    "lng": 31.0522,
    "address": "123 Borrowdale Rd, Harare"
  },
  "tags": ["Romantic", "Fine Dining", "Outdoor"],
  "rating": 4.7,
  "images": [
    "https://url.to/image1.jpg",
    "https://url.to/image2.jpg"
  ],
  "vibes": ["Chill", "Romantic"],
  "menu": {
    "Breakfast": [
      {
        "name": "Avocado Toast",
        "description": "Sourdough with smashed avocado & poached egg",
        "price": 5.50,
        "image": "https://url.to/avocado.jpg"
      }
    ],
    "Lunch": [
      {
        "name": "Grilled Chicken Sandwich",
        "description": "Served with fries and coleslaw",
        "price": 8.00,
        "image": "https://url.to/sandwich.jpg"
      }
    ],
    "Drinks": [
      {
        "name": "Berry Smoothie",
        "description": "Berries, banana, and yogurt",
        "price": 3.00,
        "image": "https://url.to/smoothie.jpg"
      }
    ]
  }
}
3. /events
Each document represents a date-friendly event.

json

{
  "title": "Live Jazz Night",
  "description": "Evening of smooth jazz with local artists",
  "tags": ["Music", "Nightlife"],
  "location": {
    "lat": -17.8200,
    "lng": 31.0490,
    "address": "XYZ Jazz Club, Harare"
  },
  "date": "2025-05-04T19:00:00Z",
  "image": "https://url.to/jazz.jpg",
  "ticketLink": "https://tickets.example.com"
}
4. /lodges
Each document represents a lodge or getaway.

json

{
  "name": "Stonehill Hideaway",
  "description": "Private lodge with garden views and a plunge pool.",
  "location": {
    "lat": -17.9100,
    "lng": 31.1120,
    "address": "Nyanga, Zimbabwe"
  },
  "tags": ["Cozy", "Private", "Luxury"],
  "priceRange": "$60 - $120",
  "rating": 4.6,
  "contact": {
    "phone": "+263772000123",
    "email": "book@stonehill.co.zw"
  },
  "images": [
    "https://url.to/lodge1.jpg",
    "https://url.to/lodge2.jpg"
  ]
}
5. /plans
Each document represents a saved or upcoming date plan.

json
{
  "userId": "uid_123456",
  "title": "Anniversary Date Plan",
  "createdAt": "2025-04-12T08:45:00Z",
  "restaurantId": "restaurant_001",
  "eventId": "event_001",
  "lodgeId": "lodge_001",
  "date": "2025-05-10T18:00:00Z",
  "notes": "Surprise evening—book table by the window!"
}