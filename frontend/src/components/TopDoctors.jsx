import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import DoctorCard from "./DoctorCard";

const TopDoctors = () => {
  const navigate = useNavigate();
  const { doctors } = useContext(AppContext);
  return (
    <div className="flex flex-col items-center gap-4 my-16 text-gray-900 md:mx-10">
      <h1 className="text-3xl font-medium">Top Doctors to Book</h1>
      <p className="sm:w-1/3 text-center text-sm">
        Simply browse through our extensive list of trusted doctors.
      </p>
      <p className="text-sm text-gray-500 italic">शीर्ष चिकित्सकहरू — बुक गर्न सजिलो</p>
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 pt-5 px-3 sm:px-0">
        {doctors.slice(0, 10).map((doctor, index) => (
          <DoctorCard key={index} doctor={doctor} />
        ))}
      </div>
      <button
        onClick={() => {
          navigate("/doctors");
          setTimeout(() => {
            scrollTo(0, 0);
          }, 50);
        }}
        className="bg-primary text-white px-6 py-2 rounded-full mt-10 cursor-pointer border border-primary hover:opacity-95"
        aria-label="View all doctors"
      >
        View All Doctors
        <span className="ml-2 text-sm text-white/80">(थप)</span>
      </button>
    </div>
  );
};

export default TopDoctors;
