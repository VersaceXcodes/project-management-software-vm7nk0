import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store/main";
import { Link } from "react-router-dom";

const UV_InvitationModal: React.FC = () => {
  // Get the auth_token from the global store
  const auth_token = useSelector((state: RootState) => state.global.auth_token);

  // Local state for the invitation form data and validation errors
  const [invitation_form_data, setInvitationFormData] = useState({
    invite_email: "",
    invite_role: "team_member"
  });
  const [validation_errors, setValidationErrors] = useState<{ invite_email?: string }>({});
  const [success_message, setSuccessMessage] = useState("");
  const [is_loading, setIsLoading] = useState(false);
  // Local state to control the visibility of the modal
  const [is_visible, setIsVisible] = useState(true);

  // Handle input changes for both email and role select
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setInvitationFormData({
      ...invitation_form_data,
      [e.target.name]: e.target.value
    });
  };

  // Function to submit the invitation form
  const sendInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationErrors({});
    setSuccessMessage("");

    // Validate the email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!invitation_form_data.invite_email || !emailRegex.test(invitation_form_data.invite_email)) {
      setValidationErrors({ invite_email: "Please enter a valid email address." });
      return;
    }
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
      const response = await fetch(`${apiUrl}/api/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${auth_token}`
        },
        body: JSON.stringify({
          invitee_email: invitation_form_data.invite_email,
          role: invitation_form_data.invite_role
        })
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }
      await response.json();
      setSuccessMessage("Invitation sent successfully.");
      // Reset the form
      setInvitationFormData({ invite_email: "", invite_role: "team_member" });
    } catch (error: any) {
      setValidationErrors({ invite_email: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to cancel (close) the invitation modal
  const cancelInvitation = () => {
    setIsVisible(false);
  };

  return (
    <>
      {is_visible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Invite Team Member</h2>
            {success_message && (
              <div className="mb-4 p-2 bg-green-100 text-green-700 rounded">
                {success_message}
              </div>
            )}
            <form onSubmit={sendInvitation}>
              <div className="mb-4">
                <label htmlFor="invite_email" className="block text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  id="invite_email"
                  name="invite_email"
                  value={invitation_form_data.invite_email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                {validation_errors.invite_email && (
                  <p className="text-red-500 text-sm mt-1">{validation_errors.invite_email}</p>
                )}
              </div>
              <div className="mb-4">
                <label htmlFor="invite_role" className="block text-gray-700 mb-1">
                  Select Role
                </label>
                <select
                  id="invite_role"
                  name="invite_role"
                  value={invitation_form_data.invite_role}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="project_manager">Project Manager</option>
                  <option value="team_member">Team Member</option>
                  <option value="guest">Guest</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={cancelInvitation}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 focus:outline-none"
                  disabled={is_loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
                  disabled={is_loading}
                >
                  {is_loading ? "Sending..." : "Send Invitation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default UV_InvitationModal;