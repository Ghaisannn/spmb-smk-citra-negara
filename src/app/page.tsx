import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import FeatureStrip from "@/components/landing/FeatureStrip";
import AlurPendaftaran from "@/components/landing/AlurPendaftaran";
import Persyaratan from "@/components/landing/Persyaratan";
import ProgramKeahlian from "@/components/landing/ProgramKeahlian";
import Jadwal from "@/components/landing/Jadwal";
import Faq from "@/components/landing/Faq";
import Footer from "@/components/landing/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeatureStrip />
        <AlurPendaftaran />
        <Persyaratan />
        <ProgramKeahlian />
        <Jadwal />
        <Faq />
      </main>
      <Footer />
    </>
  );
}