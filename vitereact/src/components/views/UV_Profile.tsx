import React, { useState, useEffect } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { set_current_user } from "@/store/main";
import { RootState, AppDispatch } from "@/store/main";
import { Link } from "react-router-dom";

const UV_Profile: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const current_user = useSelector((state: RootState) => state.global.current_user);
  const auth_token = useSelector((state: RootState) => state.global.auth_token);

  // Local state for profile form data, form status, and validation errors
  const [profile_form_data, setProfileFormData] = useState<any>({
    first_name: "",
    last_name: "",
    email: "",
    profile_picture_url: "",
    notification_settings: {},
  });
  const [form_status, setFormStatus] = useState<string>("idle");
  const [validation_errors, setValidationErrors] = useState<any>({});

  // Fetch profile on view load using current_user.id
  useEffect(() => {
    if (current_user && current_user.id) {
      const fetchProfile = async () => {
        setFormStatus("submitting");
        try {
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/users/${current_user.id}`,
            {
              headers: { Authorization: `Bearer ${auth_token}` },
            }
          );
          setProfileFormData(response.data);
          // Update global state with new profile data
          dispatch(set_current_user(response.data));
          setFormStatus("idle");
        } catch (error) {
          console.error("Fetch profile error:", error);
          setFormStatus("error");
        }
      };
      fetchProfile();
    }
  }, [current_user, auth_token, dispatch]);

  // Handler for input field changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setProfileFormData((prev: any) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle file selection for profile picture upload
  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      // Simulate image upload by generating a random image URL from picsum.photos using current time as seed
      const seed = Date.now();
      const imageUrl = `https://picsum.photos/seed/${seed}/200`;
      setProfileFormData((prev: any) => ({
        ...prev,
        profile_picture_url: imageUrl,
      }));
    }
  };

  // Validate form inputs
  const validateForm = () => {
    const errors: any = {};
    if (!profile_form_data.first_name || profile_form_data.first_name.trim() === "") {
      errors.first_name = "First name is required";
    }
    if (!profile_form_data.last_name || profile_form_data.last_name.trim() === "") {
      errors.last_name = "Last name is required";
    }
    if (!profile_form_data.email || profile_form_data.email.trim() === "") {
      errors.email = "Email is required";
    }
    return errors;
  };

  // Handler for form submission to update profile
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors({});
    setFormStatus("submitting");
    try {
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/${current_user?.id}`,
        profile_form_data,
        {
          headers: { Authorization: `Bearer ${auth_token}` },
        }
      );
      dispatch(set_current_user(response.data));
      setProfileFormData(response.data);
      setFormStatus("success");
      setTimeout(() => setFormStatus("idle"), 3000);
    } catch (error) {
      console.error("Update profile error:", error);
      setFormStatus("error");
    }
  };

  return (
    <>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">User Profile</h1>
        {form_status === "submitting" && (
          <p className="text-blue-500">Loading...</p>
        )}
        {form_status === "error" && (
          <p className="text-red-500">An error occurred. Please try again.</p>
        )}
        {form_status === "success" && (
          <p className="text-green-500">Profile updated successfully!</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center space-x-4">
            <div>
              {profile_form_data.profile_picture_url ? (
                <img
                  src={profile_form_data.profile_picture_url}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-700">No Image</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Change Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageUpload}
                className="mt-1"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              value={profile_form_data.first_name || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {validation_errors.first_name && (
              <p className="text-red-500 text-sm">
                {validation_errors.first_name}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              value={profile_form_data.last_name || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {validation_errors.last_name && (
              <p className="text-red-500 text-sm">
                {validation_errors.last_name}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={profile_form_data.email || ""}
              onChange={handleInputChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2"
            />
            {validation_errors.email && (
              <p className="text-red-500 text-sm">{validation_errors.email}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Notification Settings (JSON)
            </label>
            <textarea
              name="notification_settings"
              value={JSON.stringify(
                profile_form_data.notification_settings || {},
                null,
                2
              )}
              onChange={(e) => {
                try {
                  const jsonValue = JSON.parse(e.target.value);
                  setProfileFormData((prev: any) => ({
                    ...prev,
                    notification_settings: jsonValue,
                  }));
                  setValidationErrors((prev: any) => {
                    const newErrors = { ...prev };
                    delete newErrors.notification_settings;
                    return newErrors;
                  });
                } catch (err) {
                  setValidationErrors((prev: any) => ({
                    ...prev,
                    notification_settings: "Invalid JSON format",
                  }));
                }
              }}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 font-mono text-sm"
              rows={4}
            />
            {validation_errors.notification_settings && (
              <p className="text-red-500 text-sm">
                {validation_errors.notification_settings}
              </p>
            )}
          </div>
          <div>
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default UV_Profile;