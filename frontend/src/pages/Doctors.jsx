import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import DoctorCard from "../components/DoctorCard";

const Doctors = () => {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const [filterDoc, setFilterDoc] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const navigate = useNavigate();

  const { doctors } = useContext(AppContext);

  const specialityList = [
    { name: "General physician", slug: "general-physician" },
    { name: "Gynecologist", slug: "gynecologist" },
    { name: "Dermatologist", slug: "dermatologist" },
    { name: "Pediatricians", slug: "pediatricians" },
    { name: "Neurologist", slug: "neurologist" },
    { name: "Gastroenterologist", slug: "gastroenterologist" },
  ];

  const applyFilter = () => {
    if (slug) {
      setFilterDoc(
        doctors.filter(
          (doc) =>
            doc.speciality.toLowerCase().replace(/\s+/g, "-") ===
            slug.toLowerCase()
        )
      );
    } else {
      setFilterDoc(doctors);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [doctors, slug]);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);
  }, [pathname]);

  return (
    <div>
      <p className="text-gray-600">Browse through the doctors specialist.</p>
      <div className="flex flex-col sm:flex-row items-start gap-5 mt-5">
        <button
          className={`${
            showFilter ? "bg-primary text-white" : ""
          } py-1 px-3 border rounded text-sm transition-all sm:hidden`}
          onClick={() => setShowFilter((prev) => !prev)}
        >
          Filters
        </button>
        <div
          className={`${
            showFilter ? "flex" : "hidden sm:flex"
          } flex-col gap-4 text-sm text-gray-600`}
        >
          {specialityList.map((doc) => (
            <p
              key={doc.slug}
              onClick={() => {
                slug === doc.slug
                  ? navigate("/doctors")
                  : navigate(`/doctors/${doc.slug}`);
                setShowFilter(false);
              }}
              className={`w-[94vw] sm:w-auto pl-3 py-1.5 pr-16 border border-gray-300 rounded transition-all cursor-pointer ${
                slug === doc.slug ? "bg-indigo-100 text-black" : ""
              }`}
            >
              {doc.name}
            </p>
          ))}
        </div>
        <div className="w-full grid grid-cols-[repeat(auto-fill,_minmax(200px,_1fr))] gap-4 gap-y-6 px-3 sm:px-0">
          {filterDoc.map((doctor, index) => (
            <DoctorCard key={index} doctor={doctor} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Doctors;
