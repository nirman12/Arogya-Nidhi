import { useContext, useEffect, useState } from "react";
import { AppContext } from "../context/AppContext";
import { assets } from "../assets/assets_frontend/assets";
import axios from "axios";
import { toast } from "react-toastify";

const Profile = () => {
  const { userData, backendUrl, token, loadUserProfileData } = useContext(AppContext);

  const [isEdit, setIsEdit] = useState(false);
  const [image, setImage] = useState(false);

  const normalizeGender = (value) => {
    if (!value) return "";
    const v = String(value).toLowerCase();
    if (["male", "female", "other", "prefer_not_to_say"].includes(v)) return v;
    if (v === "others") return "other";
    return "";
  };

  const capitalizeGender = (value) => {
    if (!value) return "";
    if (value === "prefer_not_to_say") return "Prefer not to say";
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const splitAddress = (streetAddress = "") => {
    const parts = streetAddress.split(",").map((p) => p.trim()).filter(Boolean);
    return {
      line1: parts[0] || "",
      line2: parts.slice(1).join(", "),
    };
  };

  const currentAddress = splitAddress(userData?.addressInfo?.streetAddress || "");

  const [formData, setFormData] = useState({
    name: userData?.user?.name || "",
    phone: userData?.user?.phone || "",
    gender: normalizeGender(userData?.gender || ""),
    dob: userData?.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().slice(0, 10) : "",
    address: {
      line1: currentAddress.line1,
      line2: currentAddress.line2,
    },
  });

  useEffect(() => {
    const address = splitAddress(userData?.addressInfo?.streetAddress || "");
    setFormData({
      name: userData?.user?.name || "",
      phone: userData?.user?.phone || "",
      gender: normalizeGender(userData?.gender || ""),
      dob: userData?.dateOfBirth ? new Date(userData.dateOfBirth).toISOString().slice(0, 10) : "",
      address: {
        line1: address.line1,
        line2: address.line2,
      },
    });
  }, [userData]);

  const getAvatar = () => {
    const avatarUrl = userData?.user?.avatarUrl;
    if (!avatarUrl) return assets.profile_pic;
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) return avatarUrl;
    return `${backendUrl}/${avatarUrl}`;
  };

  const updateUserProfileData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      await axios.patch(
        backendUrl + "/api/patient/profile",
        {
          name: formData.name,
          phone: formData.phone,
        },
        { headers }
      );

      await axios.patch(
        backendUrl + "/api/patient/profile/health",
        {
          gender: formData.gender || null,
          dateOfBirth: formData.dob || null,
        },
        { headers }
      );

      const streetAddress = [formData.address.line1, formData.address.line2]
        .map((p) => p?.trim())
        .filter(Boolean)
        .join(", ");

      await axios.put(
        backendUrl + "/api/patient/address",
        { streetAddress: streetAddress || null },
        { headers }
      );

      if (image) {
        const avatarData = new FormData();
        avatarData.append("avatar", image);
        await axios.patch(backendUrl + "/api/patient/profile/avatar", avatarData, {
          headers,
        });
      }

      toast.success("Profile updated successfully");
      await loadUserProfileData();
      setIsEdit(false);
      setImage(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    }
  };

  return (
    userData && (
      <div className="max-w-lg flex flex-col gap-2 text-sm">
        {isEdit ? (
          <label htmlFor="image">
            <div className="inline-block relative cursor-pointer">
              <img
                className="w-36 rounded opacity-75"
                src={image ? URL.createObjectURL(image) : getAvatar()}
                alt=""
              />
              <img
                className="w-10 absolute bottom-12 right-12"
                src={image ? "" : assets.upload_icon}
                alt=""
              />
            </div>
            <input
              onChange={(e) => setImage(e.target.files[0])}
              type="file"
              id="image"
              hidden
            />
          </label>
        ) : (
          <img className="w-36 rounded" src={getAvatar()} alt="" />
        )}

        {isEdit ? (
          <input
            className="bg-gray-100 text-3xl font-medium max-w-80 mt-4"
            onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
            value={formData.name}
            type="text"
          />
        ) : (
          <p className="text-3xl font-medium text-neutral-800 mt-4">
            {userData?.user?.name}
          </p>
        )}
        <hr className="bg-zinc-400 h-[1px] border-none" />
        <div>
          <p className="text-neutral-500 underline mt-3">CONTACT INFORMATION</p>
          <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
            <p className="font-medium">Email Id:</p>
            <p className="text-blue-500">{userData?.user?.email}</p>
            <p className="font-medium">Phone:</p>
            {isEdit ? (
              <input
                className="bg-gray-100 max-w-47"
                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                value={formData.phone}
                type="text"
              />
            ) : (
              <p className="text-blue-400">{userData?.user?.phone || "Not set"}</p>
            )}
            <p className="font-medium">Address:</p>
            {isEdit ? (
              <p>
                <input
                  className="bg-gray-100"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, line1: e.target.value },
                    }))
                  }
                  value={formData.address.line1}
                  type="text"
                />
                <br />
                <input
                  className="bg-gray-100"
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      address: { ...prev.address, line2: e.target.value },
                    }))
                  }
                  value={formData.address.line2}
                  type="text"
                />
              </p>
            ) : (
              <p className="text-gray-500">
                {currentAddress.line1 || "Not set"}
                <br />
                {currentAddress.line2}
              </p>
            )}
          </div>
        </div>
        <div>
          <p className="text-neutral-500 underline mt-3">BASIC INFORMATION</p>
          <div className="grid grid-cols-[1fr_3fr] gap-y-2.5 mt-3 text-neutral-700">
            <p className="font-medium">Gender:</p>
            {isEdit ? (
              <select
                className="max-w-47 bg-gray-100"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gender: e.target.value }))
                }
                value={formData.gender || ""}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            ) : (
              <p className="text-gray-400">{capitalizeGender(normalizeGender(userData?.gender)) || "Not set"}</p>
            )}
            <p className="font-medium">Birthday:</p>
            {isEdit ? (
              <input
                className="bg-gray-100 max-w-47"
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, dob: e.target.value }))
                }
                value={formData.dob}
                type="date"
              />
            ) : (
              <p className="text-gray-400">{formData.dob || "Not set"}</p>
            )}
          </div>
        </div>
        <div className="mt-10">
          {isEdit ? (
            <button
              className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
              onClick={updateUserProfileData}
            >
              Save
            </button>
          ) : (
            <button
              className="border border-primary px-8 py-2 rounded-full hover:bg-primary hover:text-white transition-all"
              onClick={() => setIsEdit(true)}
            >
              Edit
            </button>
          )}
        </div>
      </div>
    )
  );
};

export default Profile;
