import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import DoctorCard from "../components/DoctorCard";

const Doctors = () => {
  const { slug } = useParams();
  const { pathname } = useLocation();
  const [filterDoc, setFilterDoc] = useState([]);
  const [showFilter, setShowFilter] = useState(false);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [minFee, setMinFee] = useState(0);
  const [maxFee, setMaxFee] = useState(1000);
  const [ratingMin, setRatingMin] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("relevance");
  const navigate = useNavigate();

  const { doctors } = useContext(AppContext);

  // Manual doctor data
  const manualDoctors = [
    {
      _id: "doc1",
      name: "Dr. Sarah Johnson",
      speciality: "General physician",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
      available: true,
      experience: "8 years",
      rating: 4.8,
      fee: 40,
      location: "New York, NY"
    },
    {
      _id: "doc2",
      name: "Dr. Michael Chen",
      speciality: "Gynecologist",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
      available: true,
      experience: "12 years",
      rating: 4.9,
      fee: 60,
      location: "Los Angeles, CA"
    },
    {
      _id: "doc3",
      name: "Dr. Emily Rodriguez",
      speciality: "Dermatologist",
      image: "https://images.unsplash.com/photo-1594824804732-ca8db723f8fa?w=400&h=400&fit=crop&crop=face",
      available: false,
      experience: "6 years",
      rating: 4.7,
      fee: 55,
      location: "Miami, FL"
    },
    {
      _id: "doc4",
      name: "Dr. David Kim",
      speciality: "Pediatricians",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face",
      available: true,
      experience: "10 years",
      rating: 4.9,
      fee: 45,
      location: "Chicago, IL"
    },
    {
      _id: "doc5",
      name: "Dr. Lisa Thompson",
      speciality: "Neurologist",
      image: "https://images.unsplash.com/photo-1594824804732-ca8db723f8fa?w=400&h=400&fit=crop&crop=face",
      available: true,
      experience: "15 years",
      rating: 4.8,
      fee: 120,
      location: "Boston, MA"
    },
    {
      _id: "doc6",
      name: "Dr. Robert Martinez",
      speciality: "Gastroenterologist",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
      available: false,
      experience: "11 years",
      rating: 4.6,
      fee: 80,
      location: "Houston, TX"
    },
    {
      _id: "doc7",
      name: "Dr. Jennifer Lee",
      speciality: "General physician",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
      available: true,
      experience: "9 years",
      rating: 4.7,
      fee: 35,
      location: "Seattle, WA"
    },
    {
      _id: "doc8",
      name: "Dr. James Wilson",
      speciality: "Gynecologist",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face",
      available: true,
      experience: "7 years",
      rating: 4.8,
      fee: 65,
      location: "Denver, CO"
    },
    {
      _id: "doc9",
      name: "Dr. Maria Garcia",
      speciality: "Dermatologist",
      image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face",
      available: true,
      experience: "13 years",
      rating: 4.9,
      fee: 70,
      location: "Phoenix, AZ"
    },
    {
      _id: "doc10",
      name: "Dr. Thomas Brown",
      speciality: "Pediatricians",
      image: "https://images.unsplash.com/photo-1594824804732-ca8db723f8fa?w=400&h=400&fit=crop&crop=face",
      available: false,
      experience: "5 years",
      rating: 4.5,
      fee: 30,
      location: "Portland, OR"
    },
    {
      _id: "doc11",
      name: "Dr. Amanda White",
      speciality: "Neurologist",
      image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face",
      available: true,
      experience: "14 years",
      rating: 4.9,
      fee: 110,
      location: "Austin, TX"
    },
    {
      _id: "doc12",
      name: "Dr. Christopher Davis",
      speciality: "Gastroenterologist",
      image: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face",
      available: true,
      experience: "8 years",
      rating: 4.7,
      fee: 75,
      location: "Nashville, TN"
    }
  ];

  const specialityList = [
    { name: "General physician", slug: "general-physician", icon: "🏥" },
    { name: "Gynecologist", slug: "gynecologist", icon: "👩‍⚕️" },
    { name: "Dermatologist", slug: "dermatologist", icon: "🧴" },
    { name: "Pediatricians", slug: "pediatricians", icon: "👶" },
    { name: "Neurologist", slug: "neurologist", icon: "🧠" },
    { name: "Gastroenterologist", slug: "gastroenterologist", icon: "🫀" },
  ];

  const applyFilter = () => {
    // Prefer backend / Supabase `doctors` from AppContext; fallback to manual list only if empty
    const doctorsToFilter = (doctors && doctors.length > 0) ? doctors : manualDoctors;
    if (slug) {
      setFilterDoc(
        doctorsToFilter.filter(
          (doc) =>
            doc.speciality.toLowerCase().replace(/\s+/g, "-") ===
            slug.toLowerCase()
        )
      );
    } else {
      setFilterDoc(doctorsToFilter);
    }
  };

  useEffect(() => {
    applyFilter();
  }, [doctors, slug]);

  // Debounce search input for better UX
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Derived and filtered list applying UI filters
  const filteredList = (filterDoc || []).filter((d) => {
    if (search) {
      const q = search.toLowerCase();
      if (!(d.name?.toLowerCase().includes(q) || d.speciality?.toLowerCase().includes(q) || d.location?.toLowerCase().includes(q))) return false;
    }
    const fee = d.fee || d.consultation_fee || d.consultationFee || 0;
    if (fee < minFee || fee > maxFee) return false;
    if ((d.rating || 0) < ratingMin) return false;
    return true;
  });

  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(filteredList.length / pageSize));
  // Sorting
  const sorted = [...filteredList].sort((a, b) => {
    if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0);
    if (sortBy === 'fee-asc') return (a.fee || 0) - (b.fee || 0);
    if (sortBy === 'fee-desc') return (b.fee || 0) - (a.fee || 0);
    if (sortBy === 'experience') {
      const ea = Number(String(a.experience || '').match(/\d+/)?.[0] || 0);
      const eb = Number(String(b.experience || '').match(/\d+/)?.[0] || 0);
      return eb - ea;
    }
    return 0; // relevance / default keep order
  });

  const pageItems = sorted.slice((page - 1) * pageSize, page * pageSize);

  useEffect(() => {
    setTimeout(() => {
      window.scrollTo(0, 0);
    }, 10);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <div className="bg-white border-b">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Find Your Perfect Doctor</h1>
            <p className="text-sm text-gray-600 max-w-2xl mx-auto">Browse our vetted network of specialists and book appointments quickly.</p>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Top controls: prominent search, sort and quick filters */}
        <div className="mb-6">
            <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-stretch gap-3">
            <input
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              placeholder="Search doctors, speciality, or city"
              className="flex-1 px-4 py-3 border rounded-md text-sm shadow-sm focus:ring-2 focus:ring-primary/30"
            />
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }} className="w-44 px-3 py-3 border rounded-md text-sm">
              <option value="relevance">Relevance</option>
              <option value="rating">Top rated</option>
              <option value="fee-asc">Fee: Low → High</option>
              <option value="fee-desc">Fee: High → Low</option>
              <option value="experience">Most experienced</option>
            </select>
            <button onClick={() => { setSearchTerm(''); setSearch(''); setMinFee(0); setMaxFee(1000); setRatingMin(0); setSortBy('relevance'); setPage(1); }} className="hidden md:inline-flex items-center px-4 py-3 bg-white border rounded-md text-sm">Clear</button>
          </div>
          <div className="max-w-4xl mx-auto mt-3 flex items-center justify-between text-sm text-gray-600">
            <div>{filteredList.length} results • {filterDoc.length} total</div>
            <div className="flex items-center gap-3">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" className="w-4 h-4" checked={ratingMin >= 4} onChange={(e)=> setRatingMin(e.target.checked ? 4 : 0)} />
                <span>4+ stars</span>
              </label>
            </div>
          </div>
        </div>

        {/* Filter Toggle Button for Mobile */}
          <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold text-gray-800">
              {slug ? specialityList.find(s => s.slug === slug)?.name : "All Doctors"}
            </h2>
          </div>

          <button
            className={`lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all duration-300 ${
              showFilter
                ? "bg-green-600 text-white border-green-600 shadow-lg"
                : "bg-white text-gray-700 border-gray-300 hover:border-green-400"
            }`}
            onClick={() => setShowFilter((prev) => !prev)}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
            </svg>
            Filters
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filter Sidebar */}
          <aside className={`${showFilter ? "block" : "hidden lg:block"} w-full lg:w-80 bg-white rounded-lg border border-gray-100 p-5 sticky top-6 max-h-[calc(100vh-120px)] overflow-y-auto`}>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Availability</h4>
                <label className="inline-flex items-center gap-2 text-sm">
                  <input type="checkbox" className="w-4 h-4" checked={ratingMin >= 4} onChange={(e)=> setRatingMin(e.target.checked ? 4 : 0)} />
                  <span>Only show highly rated (4+)</span>
                </label>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Fee range</h4>
                <div className="flex items-center gap-2">
                  <input type="number" value={minFee} onChange={(e) => { setMinFee(Number(e.target.value)); setPage(1); }} className="w-1/2 px-2 py-1 border rounded-md text-sm" />
                  <input type="number" value={maxFee} onChange={(e) => { setMaxFee(Number(e.target.value)); setPage(1); }} className="w-1/2 px-2 py-1 border rounded-md text-sm" />
                </div>
              </div>

              

              <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Specializations</h4>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => { navigate('/doctors'); setPage(1); }} className={`px-3 py-1 rounded-full text-sm ${!slug ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>All</button>
                  {specialityList.map(s => (
                    <button key={s.slug} onClick={() => { slug === s.slug ? navigate('/doctors') : navigate(`/doctors/${s.slug}`); setPage(1); }} className={`px-3 py-1 rounded-full text-sm ${slug === s.slug ? 'bg-primary text-white' : 'bg-gray-100 text-gray-700'}`}>{s.name}</button>
                  ))}
                </div>
              </div>

              <div className="pt-2 border-t">
                <button onClick={() => { setSearchTerm(''); setSearch(''); setMinFee(0); setMaxFee(1000); setRatingMin(0); setSortBy('relevance'); setPage(1); }} className="w-full text-sm px-3 py-2 border rounded-md">Clear filters</button>
              </div>
            </div>
          </aside>

          {/* Doctors Grid */}
          <main className="flex-1">
            {pageItems.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-6 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-.882-5.833-2.25" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
                <p className="text-gray-600 mb-6">Try selecting a different specialization or check back later.</p>
                <button
                  onClick={() => navigate("/doctors")}
                  className="bg-primary text-white px-5 py-2 rounded-md hover:opacity-95 transition-colors duration-150"
                >
                  View All Doctors
                </button>
              </div>
              ) : (
              <div>
                <div className="grid grid-cols-1 gap-6">
                  {pageItems.map((doctor, index) => (
                    <div key={index} className="h-full mx-auto w-full max-w-5xl">
                      <DoctorCard doctor={doctor} />
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-center gap-3 mt-6">
                  <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className={`px-3 py-1 rounded-md border ${page <= 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>Previous</button>
                  <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                  <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className={`px-3 py-1 rounded-md border ${page >= totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}>Next</button>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Doctors;
