import express from "express";
import fetch from "node-fetch";
const app = express();
app.use(express.json());

app.post("/enroll", async (req, res) => {
  try {
    const { email, first_name, course_id } = req.body;
    if (!email || !course_id) return res.status(400).json({ error: "missing email or course_id" });

    const auth = "Basic " + Buffer.from(process.env.WP_USER + ":" + process.env.WP_APP).toString("base64");
    const base = (process.env.WP_BASE || "").replace(/\/+$/,""); // np. https://quizzynest.com

    // 1) create/get student
    const r1 = await fetch(`${base}/wp-json/llms/v1/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({ first_name: first_name || email.split("@")[0], email })
    });
    const s = await r1.json();
    if (!r1.ok) return res.status(r1.status).json(s);

    // 2) enroll
    const r2 = await fetch(`${base}/wp-json/llms/v1/students/${s.id}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: auth },
      body: JSON.stringify({ course_id: Number(course_id) })
    });
    const out = await r2.json();
    if (!r2.ok) return res.status(r2.status).json(out);

    res.json({ ok: true, student_id: s.id, enroll: out });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/", (_, res) => res.json({ ok: true }));
app.listen(process.env.PORT || 3000);
