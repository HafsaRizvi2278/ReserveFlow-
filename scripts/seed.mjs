import pg from "pg";
import { hashPassword } from "../src/server/security.mjs";
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });

const users = [
  ["u-admin", "Hafsa Rizvi", "admin@reserveflow.com", "admin"],
  ["u-employee", "Maya Perera", "mayaperere@examp.com", "employee"],
  ["u-2", "Ayesha Fernando", "ayesha@examp.com", "employee"],
  ["u-3", "Dilan Jayasinghe", "dilan@examp.com", "employee"],
];

const resources = [
  [
    "ocean",
    "Ocean Meeting Room",
    "Meeting Room",
    "A bright room for team check-ins and client conversations.",
    "Level 3 · East Wing",
    8,
    ["Display", "Whiteboard", "Video call"],
    true,
  ],
  [
    "summit",
    "Summit Conference Room",
    "Meeting Room",
    "Large boardroom for planning sessions and presentations.",
    "Level 5 · North Wing",
    16,
    ["Dual display", "Video call", "Whiteboard"],
    true,
  ],
  [
    "focus",
    "Focus Pod",
    "Workspace",
    "A quiet workspace for focused work or private calls.",
    "Level 2 · Quiet Zone",
    2,
    ["Monitor", "Acoustic panels"],
    true,
  ],
  [
    "training",
    "Training Room",
    "Meeting Room",
    "Flexible seating for workshops and learning.",
    "Ground Floor · West Wing",
    24,
    ["Projector", "Lectern", "Whiteboard"],
    true,
  ],
  [
    "projector",
    "Portable Projector",
    "Equipment",
    "Portable full-HD projector with adapters.",
    "IT Store · Level 1",
    1,
    ["HDMI", "USB-C", "Carry case"],
    true,
  ],
  [
    "video-kit",
    "Video Conference Kit",
    "Equipment",
    "Portable camera and microphone kit.",
    "IT Store · Level 1",
    1,
    ["4K camera", "Speakerphone"],
    false,
  ],
];
function slot(days, time) {
  const current = new Date(Date.now() + 19800000).toISOString().slice(0, 10);
  const date = new Date(`${current}T${time}:00+05:30`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString();
}
try {
  await client.connect();
  await client.query("BEGIN");
  // for (const [id, name, email, role] of users)
  //   await client.query(
  //     "INSERT INTO users(id,name,email,role,password_hash) VALUES($1,$2,$3,$4,$5) ON CONFLICT DO NOTHING",
  //     [id, name, email, role, hashPassword("demo-password")],
  //   );


for (const [id, name, email, role] of users) {
  const password =
    role === "admin" ? "admin123" : "password";

  await client.query(
    `INSERT INTO users
      (id, name, email, role, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id)
     DO UPDATE SET
       name = EXCLUDED.name,
       email = EXCLUDED.email,
       role = EXCLUDED.role,
       password_hash = EXCLUDED.password_hash`,
    [id, name, email, role, hashPassword(password)],
  );
}


  for (const resource of resources)
    await client.query(
      "INSERT INTO resources(id,name,category,description,location,capacity,amenities,is_active) VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING",
      resource,
    );
  // Seed bookings only into an empty booking table. Re-running cannot overwrite real work.
  const count = await client.query("SELECT count(*) FROM reservations");
  if (Number(count.rows[0].count) === 0) {
    const bookings = [
      [
        "r-1",
        "summit",
        "u-employee",
        "Quarterly planning",
        slot(1, "09:00"),
        slot(1, "10:30"),
        "confirmed",
      ],
      [
        "r-2",
        "focus",
        "u-employee",
        "Portfolio interviews",
        slot(2, "13:00"),
        slot(2, "14:00"),
        "confirmed",
      ],
      [
        "r-3",
        "training",
        "u-2",
        "New joiner orientation",
        slot(1, "11:00"),
        slot(1, "13:00"),
        "confirmed",
      ],
      [
        "r-4",
        "projector",
        "u-3",
        "Client presentation",
        slot(3, "14:00"),
        slot(3, "16:00"),
        "confirmed",
      ],
      [
        "r-past",
        "ocean",
        "u-employee",
        "Weekly sync",
        slot(-2, "10:00"),
        slot(-2, "11:00"),
        "confirmed",
      ],
      [
        "r-cancel",
        "summit",
        "u-employee",
        "Partner briefing",
        slot(4, "15:00"),
        slot(4, "16:00"),
        "cancelled",
      ],
    ];
    const now = Date.now();
    const start = new Date(now - 1800000),
      end = new Date(now + 1800000);
    if (
      new Date(start.getTime() + 19800000).toISOString().slice(0, 10) ===
      new Date(end.getTime() + 19800000).toISOString().slice(0, 10)
    )
      bookings.push([
        "r-live",
        "ocean",
        "u-2",
        "Design review",
        start.toISOString(),
        end.toISOString(),
        "confirmed",
      ]);
    for (const item of bookings)
      await client.query(
        "INSERT INTO reservations(id,resource_id,user_id,title,starts_at,ends_at,status) VALUES($1,$2,$3,$4,$5,$6,$7)",
        item,
      );
  }
  await client.query("COMMIT");
  // console.log(
  //   "Seed complete. Assessment accounts: admin@reserveflow.demo / employee@reserveflow.demo; password: demo-password.",
  // );
 console.log(
  "Seed complete. Admin: admin@reserveflow.com / admin123; Employees: password."
);
} catch (error) {
  await client.query("ROLLBACK").catch(() => { });
  throw error;
} finally {
  await client.end();
}
