import { assets } from "../assets/assets_frontend/assets";

const About = () => {
  return (
    <div>
      <div className="text-center text-2xl pt-10 text-gray-500">
        <p>
          ABOUT <span className="text-gray-700 font-medium">US</span>
        </p>
      </div>

      <div className="my-10 flex flex-col md:flex-row gap-12">
        <img
          className="w-full md:max-w-[360px]"
          src={assets.about_image}
          alt=""
        />
        <div className="flex flex-col justify-center gap-6 md:w-2/4 text-sm text-gray-600 capitalize">
          <p>
            Welcome to ArogyaNidhi — "Health is Wealth". We are a Nepal-based
            website located in Kathmandu, committed to making healthcare access
            easier for everyone. At ArogyaNidhi, we help you find doctors,
            schedule appointments, and manage health records with ease.
          </p>
          <p>
            ArogyaNidhi is committed to excellence in healthcare technology.
            We continuously improve our platform to deliver a smooth,
            trustworthy experience for patients, doctors, and administrators.
          </p>
          <p className="text-sm text-gray-500">
            <em>
              ArogyaNidhi भन्नाले स्वास्थ्य नै सम्पत्ती हो। हामी काठमाडौंमा
              आधारित सेवा हो, जसले चिकित्सक भेटघाट र स्वास्थ्य व्यवस्थापन
              सजिलो बनाउँछ।
            </em>
          </p>
          <b className="text-gray-800">Our Vision</b>
          <p>
            Our vision at ArogyaNidhi is to create a seamless healthcare
            experience for every user. We aim to bridge the gap between
            patients and healthcare providers so you can access care when you
            need it.
          </p>
          <p className="text-sm text-gray-500">
            <em>
              हाम्रो लक्ष्य सबैका लागि सहज स्वास्थ्य सेवा उपलब्ध गराउनु
              हो — बिरामी र स्वास्थ्यकर्मीबीचको दूरी घटाउने।
            </em>
          </p>
        </div>
      </div>

      <div className="text-xl my-4">
        <p className="uppercase">
          Why <span className="text-gray-700 font-semibold">Choose Us</span>
        </p>
      </div>
      <div className="flex flex-col md:flex-row mb-20">
        <div className="border border-gray-300 px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer">
          <b>Efficiency:</b>
          <p>Streamlined appointment scheduling that fits into your busy lifestyle.</p>
        </div>
        <div className="border border-gray-300 px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer">
          <b>Convenience:</b>
          <p>Access to a network of trusted healthcare professionals in your area.</p>
        </div>
        <div className="border border-gray-300 px-10 md:px-16 py-8 sm:py-16 flex flex-col gap-5 text-[15px] hover:bg-primary hover:text-white transition-all duration-300 text-gray-600 cursor-pointer">
          <b>Personalization:</b>
          <p>Tailored recommendations and reminders to help you stay on top of your health.</p>
        </div>
      </div>
    </div>
  );
};

export default About;
