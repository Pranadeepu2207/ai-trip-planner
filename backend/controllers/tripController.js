const Trip = require('../models/Trip');

// Helper for Exponential Backoff and rate limit retries
async function fetchWithRetry(url, options, retries = 5, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      console.warn(`API response warning: Status ${response.status} - ${errorText}`);
      
      // If rate limited, wait and retry
      if ((response.status === 429 || response.status === 503) && retries > 0) {
        console.log(`Rate limit or server busy. Retrying in ${delay}ms... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return fetchWithRetry(url, options, retries - 1, delay * 2);
      }
      throw new Error(`API Error (Status ${response.status}): ${errorText}`);
    }
    return await response.json();
  } catch (error) {
    if (retries > 0) {
      console.log(`Fetch error: ${error.message}. Retrying in ${delay}ms... (${retries} retries left)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(url, options, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Local mock trip generator helper for testing without API keys
function generateMockTrip(destination, durationDays, budgetTier, interests) {
  const isLow = budgetTier === 'Low';
  const isHigh = budgetTier === 'High';
  
  const transportCost = isLow ? 25 : isHigh ? 180 : 70;
  const hotelCost = isLow ? 45 : isHigh ? 240 : 95;
  const foodCost = isLow ? 18 : isHigh ? 95 : 40;
  
  const itinerary = [];
  const activitiesList = interests && interests.length > 0 ? interests : ['Sightseeing', 'Exploration'];
  
  for (let i = 1; i <= durationDays; i++) {
    const primaryInterest = activitiesList[(i - 1) % activitiesList.length];
    itinerary.push({
      dayNumber: i,
      activities: [
        {
          title: `Morning Sightseeing: ${primaryInterest} Landmarks`,
          description: `A guided walking tour showcasing historical sights and ${primaryInterest} spots in ${destination}.`,
          estimatedCostUSD: isLow ? 5 : isHigh ? 50 : 20,
          timeOfDay: 'Morning'
        },
        {
          title: `Afternoon Walk & Culinary Tasting`,
          description: `Stroll through old town markets, try local street food specialities, and shop for souvenirs.`,
          estimatedCostUSD: isLow ? 10 : isHigh ? 45 : 18,
          timeOfDay: 'Afternoon'
        },
        {
          title: `Evening Scenic Dining`,
          description: `Dine at a highly-rated local restaurant offering traditional cuisine of ${destination}.`,
          estimatedCostUSD: isLow ? 15 : isHigh ? 80 : 30,
          timeOfDay: 'Evening'
        }
      ]
    });
  }

  const budget = {
    transport: transportCost,
    accommodation: hotelCost * durationDays,
    food: foodCost * durationDays,
    activities: itinerary.reduce((sum, day) => 
      sum + day.activities.reduce((dSum, act) => dSum + act.estimatedCostUSD, 0), 0
    ),
    total: 0
  };
  budget.total = budget.transport + budget.accommodation + budget.food + budget.activities;

  const hotels = [
    {
      name: `${destination} Heritage Hotel`,
      tier: isLow ? 'Budget Friendly' : isHigh ? 'Luxury' : 'Mid Range',
      estimatedCostNightUSD: hotelCost,
      rating: '4.6/5'
    },
    {
      name: `Grand ${destination} Resort`,
      tier: isLow ? 'Budget Friendly' : isHigh ? 'Luxury' : 'Mid Range',
      estimatedCostNightUSD: Math.round(hotelCost * 1.25),
      rating: '4.8/5'
    }
  ];

  const packingList = [
    { item: 'Passport, Visa, and ID Copies', category: 'Documents', isPacked: false },
    { item: 'Local Cash and Credit Cards', category: 'Documents', isPacked: false },
    { item: 'Comfortable Hiking/Walking Shoes', category: 'Clothing', isPacked: false },
    { item: 'Climate-layered clothing and rain gear', category: 'Clothing', isPacked: false },
    { item: 'Universal Power Plug Adapter', category: 'Gear', isPacked: false },
    { item: 'Portable Battery Charger', category: 'Gear', isPacked: false },
    { item: 'First-aid kit and personal prescription medicines', category: 'Other', isPacked: false },
    { item: 'Reusable drinking bottle and sunscreen', category: 'Other', isPacked: false }
  ];

  return {
    itinerary,
    hotels,
    estimatedBudget: budget,
    packingList
  };
}

// Helper to sanitize timeOfDay values to match Mongoose schema enums
function sanitizeTimeOfDay(val) {
  if (!val || typeof val !== 'string') return 'Afternoon';
  const lower = val.trim().toLowerCase();
  if (lower.includes('morning')) return 'Morning';
  if (lower.includes('evening') || lower.includes('night')) return 'Evening';
  return 'Afternoon'; // default fallback for 'afternoon', 'noon', 'late morning', 'late afternoon', etc.
}

// Generate new travel plan
exports.generateNewTrip = async (req, res) => {
  const { destination, durationDays, budgetTier, interests } = req.body;
  const userId = req.user.id; // From JWT middleware

  if (!destination || !durationDays || !budgetTier) {
    return res.status(400).json({ message: 'Missing required trip preferences.' });
  }

  const prompt = `
    Create a detailed travel plan for a ${durationDays}-day trip to ${destination}.
    Budget preference: ${budgetTier}.
    Interests: ${interests && interests.length > 0 ? interests.join(', ') : 'General Sightseeing'}.

    You must output ONLY a valid JSON object matching this structure (no markdown wrapper, no extra text, just raw JSON):
    {
      "itinerary": [
        {
          "dayNumber": 1,
          "activities": [
            { "title": "Activity Title", "description": "Detailed activity description", "estimatedCostUSD": 25, "timeOfDay": "Morning" }
          ]
        }
      ],
      "hotels": [
        { "name": "Recommended Hotel", "tier": "Budget", "estimatedCostNightUSD": 85, "rating": "4.5/5" }
      ],
      "estimatedBudget": {
        "transport": 120,
        "accommodation": 300,
        "food": 150,
        "activities": 100,
        "total": 670
      },
      "packingList": [
        { "item": "Passport", "category": "Documents", "isPacked": false },
        { "item": "Light Jacket", "category": "Clothing", "isPacked": false }
      ]
    }

    Please ensure:
    1. The number of days in the itinerary matches exactly ${durationDays}.
    2. Estimated costs match typical local rates at the destination for a ${budgetTier} budget tier.
    3. The packing list is customized for ${destination}'s general climate and activities. Divide items into categories: Documents, Clothing, Gear, or Other.
    4. Provide 2-3 specific hotel options matching the budget profile.
    5. The total in the estimatedBudget matches the sum of transport, accommodation, food, and activities.
    6. The "timeOfDay" property for every activity MUST be exactly one of: "Morning", "Afternoon", or "Evening". Do not use any other values (like "Late Afternoon", "Late Morning", or "Night").
  `;

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    let cleanResult;

    if (!apiKey) {
      console.log('No GEMINI_API_KEY configured. Fallback: generating a mock travel itinerary...');
      cleanResult = generateMockTrip(destination, parseInt(durationDays), budgetTier, interests);
    } else {
      // Try Gemini 2.5 Flash first, fall back to 1.5 Flash if needed
      let model = 'gemini-2.5-flash';
      let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const requestPayload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      let data;
      try {
        data = await fetchWithRetry(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });
      } catch (err) {
        console.warn('Gemini 2.5 Flash request failed. Trying fallback to Gemini 1.5 Flash...');
        model = 'gemini-1.5-flash';
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        data = await fetchWithRetry(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });
      }

      const parsedResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!parsedResponseText) {
        throw new Error("Could not extract generation data from response.");
      }

      cleanResult = JSON.parse(parsedResponseText);
    }

    // Sanitize timeOfDay values to prevent Mongoose validation errors
    if (cleanResult.itinerary) {
      cleanResult.itinerary.forEach(day => {
        if (day.activities) {
          day.activities.forEach(act => {
            act.timeOfDay = sanitizeTimeOfDay(act.timeOfDay);
          });
        }
      });
    }

    // Save trip into MongoDB
    const newTrip = new Trip({
      userId,
      destination,
      durationDays: parseInt(durationDays),
      budgetTier,
      interests: interests || [],
      itinerary: cleanResult.itinerary,
      hotels: cleanResult.hotels || [],
      estimatedBudget: cleanResult.estimatedBudget,
      packingList: cleanResult.packingList || []
    });

    const savedTrip = await newTrip.save();
    return res.status(201).json(savedTrip);

  } catch (error) {
    console.error("Critical AI Generation Error:", error);
    return res.status(500).json({ message: "Failed to generate your trip plan due to an AI service error. Please try again." });
  }
};

// Retrieve all trips for logged in user (strict user isolation)
exports.getUserTrips = async (req, res) => {
  try {
    const trips = await Trip.find({ userId: req.user.id }).sort({ createdAt: -1 });
    return res.status(200).json(trips);
  } catch (error) {
    console.error('Fetch trips error:', error);
    return res.status(500).json({ message: 'Server error retrieving trips' });
  }
};

// Get trip details by id
exports.getTripById = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }
    return res.status(200).json(trip);
  } catch (error) {
    console.error('Fetch trip by ID error:', error);
    return res.status(500).json({ message: 'Server error retrieving trip details' });
  }
};

// General updates (like toggle packing items)
exports.updateTrip = async (req, res) => {
  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }

    // Apply allowed direct updates
    if (req.body.packingList) trip.packingList = req.body.packingList;
    if (req.body.itinerary) trip.itinerary = req.body.itinerary;
    if (req.body.estimatedBudget) trip.estimatedBudget = req.body.estimatedBudget;

    const savedTrip = await trip.save();
    return res.status(200).json(savedTrip);
  } catch (error) {
    console.error('Update trip error:', error);
    return res.status(500).json({ message: 'Server error updating trip data' });
  }
};

// Add activity to a specific day in the itinerary
exports.addActivity = async (req, res) => {
  const { dayNumber } = req.params;
  const { title, description, estimatedCostUSD, timeOfDay } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Activity title is required' });
  }

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }

    const targetDay = trip.itinerary.find(day => day.dayNumber === parseInt(dayNumber));
    if (!targetDay) {
      return res.status(400).json({ message: `Day ${dayNumber} does not exist in itinerary` });
    }

    const activityCost = parseFloat(estimatedCostUSD) || 0;

    targetDay.activities.push({
      title,
      description: description || '',
      estimatedCostUSD: activityCost,
      timeOfDay: timeOfDay || 'Afternoon'
    });

    // Recalculate budget ledger
    trip.estimatedBudget.activities += activityCost;
    trip.estimatedBudget.total += activityCost;

    const savedTrip = await trip.save();
    return res.status(200).json(savedTrip);
  } catch (error) {
    console.error('Add activity error:', error);
    return res.status(500).json({ message: 'Server error adding activity' });
  }
};

// Remove activity from a day
exports.removeActivity = async (req, res) => {
  const { dayNumber, activityId } = req.params;

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }

    const targetDay = trip.itinerary.find(day => day.dayNumber === parseInt(dayNumber));
    if (!targetDay) {
      return res.status(400).json({ message: `Day ${dayNumber} not found` });
    }

    const activityIndex = targetDay.activities.findIndex(act => act._id.toString() === activityId);
    if (activityIndex === -1) {
      return res.status(404).json({ message: 'Activity not found' });
    }

    const removedActivity = targetDay.activities[activityIndex];
    const activityCost = removedActivity.estimatedCostUSD || 0;

    // Splice item
    targetDay.activities.splice(activityIndex, 1);

    // Update budget ledger
    trip.estimatedBudget.activities = Math.max(0, trip.estimatedBudget.activities - activityCost);
    trip.estimatedBudget.total = Math.max(0, trip.estimatedBudget.total - activityCost);

    const savedTrip = await trip.save();
    return res.status(200).json(savedTrip);
  } catch (error) {
    console.error('Remove activity error:', error);
    return res.status(500).json({ message: 'Server error removing activity' });
  }
};

// Regenerate specific day based on traveler instructions
exports.regenerateDay = async (req, res) => {
  const { dayNumber } = req.params;
  const { instructions } = req.body; // e.g. "Focus on outdoor hiking instead of museums"

  if (!instructions) {
    return res.status(400).json({ message: 'Regeneration instructions are required' });
  }

  try {
    const trip = await Trip.findOne({ _id: req.params.id, userId: req.user.id });
    if (!trip) {
      return res.status(404).json({ message: 'Trip not found or unauthorized' });
    }

    const targetDay = trip.itinerary.find(day => day.dayNumber === parseInt(dayNumber));
    if (!targetDay) {
      return res.status(400).json({ message: `Day ${dayNumber} not found in itinerary` });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    let cleanResult;

    if (!apiKey) {
      console.log('No GEMINI_API_KEY configured. Fallback: regenerating mock day activities...');
      const isLow = trip.budgetTier === 'Low';
      const isHigh = trip.budgetTier === 'High';
      cleanResult = {
        activities: [
          {
            title: `Regenerated Activity: ${instructions}`,
            description: `Custom replacement event crafted to follow: "${instructions}" in ${trip.destination}.`,
            estimatedCostUSD: isLow ? 10 : isHigh ? 75 : 30,
            timeOfDay: 'Morning'
          },
          {
            title: 'Culinary Gastronomy Experience',
            description: `Enjoy typical local gastronomy in ${trip.destination} matching your profile.`,
            estimatedCostUSD: isLow ? 15 : isHigh ? 90 : 35,
            timeOfDay: 'Afternoon'
          }
        ]
      };
    } else {
      const prompt = `
        You are modifying Day ${dayNumber} of an existing trip to ${trip.destination}.
        The general interests are: ${trip.interests.join(', ')}.
        Budget Preference: ${trip.budgetTier}.
        
        User wants to regenerate Day ${dayNumber} with these specific instructions: "${instructions}".
        
        Current itinerary for Day ${dayNumber} was:
        ${JSON.stringify(targetDay.activities)}

        Output ONLY a valid JSON object matching this structure (no markdown wrappers, no extra text):
        {
          "activities": [
            { "title": "Activity name", "description": "Brief description", "estimatedCostUSD": 25, "timeOfDay": "Morning" }
          ]
        }

        Ensure the "timeOfDay" property for every activity is exactly one of: "Morning", "Afternoon", or "Evening". Do not use any other values (such as "Late Afternoon", "Late Morning", or "Night").
      `;

      let model = 'gemini-2.5-flash';
      let url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      
      const requestPayload = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      let data;
      try {
        data = await fetchWithRetry(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });
      } catch (err) {
        console.warn('Gemini 2.5 Flash request failed on regeneration. Trying 1.5 Flash fallback...');
        model = 'gemini-1.5-flash';
        url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        data = await fetchWithRetry(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestPayload)
        });
      }

      const parsedResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!parsedResponseText) {
        throw new Error("Could not extract regeneration details from Gemini response.");
      }

      cleanResult = JSON.parse(parsedResponseText);
    }

    // Sanitize timeOfDay values to prevent Mongoose validation errors
    if (cleanResult.activities) {
      cleanResult.activities.forEach(act => {
        act.timeOfDay = sanitizeTimeOfDay(act.timeOfDay);
      });
    }

    // Calculate previous activities cost for this day
    const oldDayCost = targetDay.activities.reduce((acc, act) => acc + (act.estimatedCostUSD || 0), 0);
    const newDayCost = cleanResult.activities.reduce((acc, act) => acc + (act.estimatedCostUSD || 0), 0);

    // Replace the activities of targetDay
    targetDay.activities = cleanResult.activities;

    // Adjust budget values
    trip.estimatedBudget.activities = Math.max(0, trip.estimatedBudget.activities - oldDayCost + newDayCost);
    trip.estimatedBudget.total = Math.max(0, trip.estimatedBudget.total - oldDayCost + newDayCost);

    const savedTrip = await trip.save();
    return res.status(200).json(savedTrip);

  } catch (error) {
    console.error("Critical AI Regeneration Error on specific day:", error);
    return res.status(500).json({ message: "Failed to regenerate activities for this day due to an AI error." });
  }
};
