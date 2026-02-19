import React from "react";
import HeroSection from "../components/home/HeroSection";
import HowItWorks from "../components/home/HowItWorks";
import Suggestions from "../components/home/Suggestions";
import WhyStow from "../components/home/WhyStow";
import FloatingActionButton from "../components/layout/FloatingActionButton";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <Suggestions />
      <WhyStow />
      <FloatingActionButton />
    </>
  );
}
