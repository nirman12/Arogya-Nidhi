import Banner from "../components/Banner";
import Hero from "../components/Hero";
import SpecialityMenu from "../components/SpecialityMenu";
import TopDoctors from "../components/TopDoctors";

const Home = () => {
  return (
    <>
      <Hero />
      <SpecialityMenu />
      <TopDoctors />
      <Banner />
    </>
  );
};

export default Home;
