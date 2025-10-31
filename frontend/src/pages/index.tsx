import HeroSection from '@/components/home/HeroSection';
import ChallengesSection from '@/components/home/ChallengesSection';
import GameplaySection from '@/components/home/GameplaySection';

export default function Landing() {
  return (
    <div className="w-full bg-starfield bg-cover bg-center relative">
      <HeroSection /> 
      <GameplaySection />
      <ChallengesSection />
    </div>
  );
}
