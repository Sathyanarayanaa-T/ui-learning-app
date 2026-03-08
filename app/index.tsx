import { Redirect } from 'expo-router';

export default function Index() {
    // Default entry point is now the AI Tutor tab instead of onboarding
    return <Redirect href="/(tabs)/tutor" />;
}
