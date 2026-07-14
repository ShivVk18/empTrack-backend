import axios from "axios";

async function main() {
  try {
    const loginRes = await axios.post("http://localhost:4000/api/v1/auth/login", {
      email: "employee1@seeker.com",
      password: "employee123",
      userType: "employee",
    });

    const { accessToken } = loginRes.data.data;
    console.log("Logged in successfully! Token obtained.");

    const policyRes = await axios.get("http://localhost:4000/api/v1/leavePolicy", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log("Leave Policy API Response status:", policyRes.status);
    console.log("Leave Policy API Response data:", JSON.stringify(policyRes.data, null, 2));

  } catch (error) {
    console.error("API Call failed:", error.response?.data || error.message);
  }
}

main();
