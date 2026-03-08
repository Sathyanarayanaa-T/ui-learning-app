# Hexaware Learning Path & AI Tutor

A high-performance, aesthetic cross-platform (Web & Mobile) learning application for trainees. Built with React Native and Expo, featuring a personalized roadmap generator and an interactive AI Tutor.

## 🚀 Key Features

- **AI Tutor Interface**: A real-time chat experience for clearing doubts and learning new topics.
- **Smart Learning Paths**: Automated onboarding that generates gamified roadmaps based on your role and skills.
- **Cross-Platform**: Seamless experience across Web, Android, and iOS.
- **Premium Design System**: Glassmorphism, smooth gradients, and coordinated micro-animations.
- **Progress Tracking**: Holistic overview of completed courses and active learning steps.

## 🛠️ Tech Stack

- **Framework**: Expo / React Native
- **Navigation**: Expo Router (File-based navigation)
- **State Management**: Zustand
- **Styling**: React Native StyleSheet with custom Design Tokens
- **Icons**: @expo/vector-icons (Ionicons)
- **Animations**: React Native Animated API

## 📋 Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or newer)
- [npm](https://www.npmjs.com/)
- [Expo Go](https://expo.dev/client) app on your mobile device (for Android/iOS testing)

## ⚙️ Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd learningpath
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

## 🏃 Running the Application

### 🌐 Web
To run the app in your local browser:
```bash
npm run web
```

### 📱 Mobile (Android/iOS)
To see the app on your physical device:
1. Run the start command:
   ```bash
   npm start
   ```
2. **Android**: Scan the QR code shown in the terminal using the **Expo Go (from the playstore)** app.
3. **iOS**: Use the Camera app to scan the QR code and open in Expo Go.

Alternatively, if you have an Android emulator set up:
```bash
npm run android
```

## 🏗️ Project Structure

- `app/`: Routing and screen components (Expo Router).
- `components/`: Atomic design components (atoms, molecules, organisms).
- `store/`: Global state management with Zustand.
- `constants/`: Theme tokens and application constants.
- `hooks/`: Custom React hooks for theme and logic.
- `services/`: API and mock data services.

