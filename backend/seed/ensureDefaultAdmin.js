import Admin from "../models/Admin.js";

// Creates the first admin account from .env on boot if none exists yet,
// so there is always a way into the Admin Dashboard on a fresh deploy.
export const ensureDefaultAdmin = async () => {
  const count = await Admin.countDocuments();
  if (count > 0) return;

  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.warn("No ADMIN_EMAIL/ADMIN_PASSWORD set — skipping default admin creation.");
    return;
  }

  await Admin.create({
    name: ADMIN_NAME || "Site Admin",
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  console.log(`Default admin created: ${ADMIN_EMAIL} (change this password after first login)`);
};
