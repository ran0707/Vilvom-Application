// All static data/constants for the app

export const teaPlantationPhrases = {
  sunny: [
    'Ideal weather for tea growth today',
    'Sunshine perfect for tea leaf maturation',
    'Good day for plucking - leaves are dry',
    'Optimal conditions for tea photosynthesis',
  ],
  cloudy: [
    'Cloud cover helps retain soil moisture',
    'Mild weather reduces water stress on plants',
    'Comfortable conditions for field workers',
    'Steady growth weather for tea bushes',
  ],
  rain: [
    "Don't spray today - rain is coming",
    'Natural irrigation for the tea fields',
    'Hold off fertilizer application - showers expected',
    'Rain will help flush the soil nutrients',
  ],
  wind: [
    'Wind may help dry leaves after morning dew',
    'Moderate breeze reduces fungal disease risk',
    'Watch for soil erosion in exposed areas',
    'Wind can help with pest dispersal control',
  ],
  humid: [
    'High humidity increases fungal risk - monitor closely',
    'Good conditions for tea growth but watch for diseases',
    'Humid weather accelerates leaf growth',
    'Ideal conditions for tea but check for mildew',
  ],
  default: [
    'Monitor field conditions regularly',
    'Check soil moisture before irrigation',
    'Inspect tea bushes for pest activity',
  ],
};

export const weatherCodeDescriptions = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snow fall',
  73: 'Moderate snow fall',
  75: 'Heavy snow fall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Moderate rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

export const notifications = [
  {
    id: 1,
    title: 'Irrigation Reminder',
    message: 'North field needs watering tomorrow morning',
    time: '2 hours ago',
    icon: 'tint',
    color: '#4CAF50',
  },
  {
    id: 2,
    title: 'Weather Alert',
    message: 'Rain expected in 24 hours. Plan harvesting accordingly.',
    time: '5 hours ago',
    icon: 'cloud-rain',
    color: '#2196F3',
  },
  {
    id: 3,
    title: 'Maintenance Due',
    message: 'Pruning scheduled for South field next week',
    time: '1 day ago',
    icon: 'cut',
    color: '#FF9800',
  },
];
