Good — I can add concrete context about Infosys Mysore campus and its restaurants / food courts. This will help your interns understand the environment the app is meant for. Use this context as part of your project’s “background & motivation” section.

⸻

🎯 Campus & Restaurant Context — Infosys Mysore

🏢 Infosys Mysore & Its Food-Facility Setup
	•	Infosys Mysore campus includes multiple food courts / canteens, not just one.  ￼
	•	According to community-sourced information, there are 10 main food courts + 1 “premium/buffet” restaurant in the campus.  ￼
	•	The presence of many food courts suggests geographically distributed dining locations — which aligns with your problem statement about “restaurants / cafeterias being far apart.”  ￼

⸻

🍽️ List of Food Courts / Restaurants (Examples)

Here are some of the food-courts / restaurants inside Infosys Mysore campus (with a short note for each):
	•	Fiesta Food Court — Near “Gate 2” of the campus. Offers breakfast, lunch, dinner; first floor has snacks/vendors including a fast-food outlet like Domino’s.  ￼
	•	Magna Food Court — Located inside “GEC 2”; described as close to trainee classrooms / academic area (so often used by trainees).  ￼
	•	Enroute Food Court — Another food court; known for variety including Chinese / different vendors.  ￼
	•	Oasis Food Court — Near hostel/buildings (as per older community sources) and offers North/South Indian meals, fast-food vendors, snacks.  ￼
	•	Multiplex Food Court — Near the “multiplex / recreation center” inside campus. Good for snacks, light meals.  ￼
	•	Gazebo (Gazeebo) Food Court — Another food-court mentioned in campus-food-court lists. Good for lighter items (idli, dosa, snacks) as per former students.  ￼
	•	Maitri Food Court — Reportedly near hostels, popular for live-counter food service (i.e. cooked-to-order) according to community sources.  ￼
	•	Arena Food Court — Another food zone inside campus (near academic/hostel / GEC buildings per older posts).  ￼
	•	(Others) — There’re more courts such as “Amoeba Food Court” (though some posts say not always operational), plus a “Floating Restaurant” — a buffet / premium-style restaurant inside campus.  ￼

Note: Since the campus is large, some food courts may be close to certain buildings (classrooms, hostels, ECC, etc.), others far — which causes the “long walking / distance pain” problem you described.

⸻

🧑‍🎓 Why This Context Matters for Our App
	•	Because there are many food-courts scattered inside campus, a simple “one-menu” solution won’t work. We need a per-restaurant / per-food-court menu representation.
	•	Given that different food courts are near classrooms, hostels, gates — the distance between two food courts may be significant (walking across campus). This validates your initial motivation: students may waste time walking only to find menu they don’t like.
	•	Using a unified website / app to display menus will remove reliance on informal channels (WhatsApp, word-of-mouth) — reducing friction and saving time for students.
	•	Having a stable list of restaurants/food courts (as above) sets the master data for “restaurants”. Interns can seed the database with these names & some metadata (approximate location, building code if available) before launching.

⸻

📄 Suggested Data to Give Interns (Seed Data)

Restaurant / Food Court	Notes / Location context
Fiesta Food Court	Near Gate-2 (campus entrance)
Magna Food Court	Inside GEC-2 (near academic blocks)
Enroute Food Court	Another internal food court, variety of cuisine
Oasis Food Court	Near hostels / accommodation area
Multiplex Food Court	Near recreation / multiplex area
Gazebo (Gazeebo) Food Court	Light-meal/snacks, scattered near some buildings
Maitri Food Court	Near hostels, live-counter meals
Arena Food Court	Internal food zone (near some campus buildings)
Amoeba Food Court	(Note: may not always be operational — treat as optional)
Floating Restaurant	Premium / buffet restaurant inside campus

You can create a JSON or CSV seed file with these entries (with fields like slug, name, displayName, optional notes) for interns to use while building the database.

⸻

If you like — I can prepare a full “seed dataset” for all known restaurants/food courts inside Infosys Mysore (as per public / community sources), in JSON format — ready for your interns to import directly into the DB as initial data.
Do you want me to build that for you now?  Nice — great problem to solve. I turned your idea into a developer-ready PRD + intern handoff (product spec, data model, API surface, infra, step-by-step implementation tasks, testing & QA, and sample code snippets) so your interns can pick it up and start building in Next.js + Supabase using OCR.Space as the OCR engine.

I include concrete implementation notes, security & rate-limit considerations, and links to the exact docs you’ll need. (Key docs: OCR.Space OCR API and Supabase Storage/JS guides.)  ￼

⸻

Product Requirements Document — “Mysore Mess Menus” (MVP)

1. Summary (one-liner)

A simple website where students at Infosys Mysore can upload photos of daily menus for each dining location; photos are stored in Supabase Storage, OCRed with OCR.Space, and the parsed menu text + photo is displayed for everyone to view before they walk.

⸻

2. Goals & Success Metrics (MVP)
	•	Allow any student to upload a menu photo to a restaurant page in < 30s.
	•	Show an OCRed, human-editable menu for each restaurant.
	•	Reduce “wrong-place walk” incidents; target 30% fewer mis-walks in first month.
	•	Reliability: >90% successful OCR (text extracted, even if imperfect).
	•	Scale: handle ~500 daily uploads to start (see OCR limits).

Important: OCR.Space free plan has a daily rate limit (free tier: ~500 requests/day per IP). Design to queue & cache so you don’t hit limits.  ￼

⸻

3. Users & Personas
	•	Student (uploader): takes photo on phone, tags which restaurant, uploads.
	•	Student (consumer): browses restaurants / menus, marks menu as “useful” or edits text.
	•	Moderator (optional): corrects OCR mistakes and approves menus.
	•	Admin: manages restaurant list and blacklists spam.

⸻

4. High-level Architecture
	1.	Client (Next.js web app) — auth + upload UI.
	2.	Supabase
	•	Postgres DB (stores restaurants, menu metadata, OCR results).
	•	Storage (buckets) to store menu images (user uploads).
	3.	Server (Next.js API routes / Vercel Edge Functions)
	•	Receives upload (or accepts client direct upload to Supabase signed URL).
	•	Creates temporary read URL (signed or public) or streams file to OCR.Space.
	•	Calls OCR.Space API, parses JSON result, saves parsed text & bounding boxes in DB.
	4.	UI displays image + OCR text; offers edit and confirm flows.

(diagram mentally: Next.js client ⇄ Supabase (auth, storage, DB) ⇄ Next API ⇄ OCR.Space)

Key Supabase features: upload, signed URLs (createSignedUrl), storage buckets.  ￼

⸻

5. Data model (Postgres tables — public schema)

restaurants
	•	id UUID PK
	•	name text
	•	location text (campus area)
	•	distance_estimate_m integer
	•	slug text unique
	•	created_at timestamptz

menu_images
	•	id UUID PK
	•	restaurant_id FK → restaurants.id
	•	uploaded_by uuid → auth.users.id
	•	storage_path text (e.g. menus/2025-11-28/restaurant-slug/uuid.jpg)
	•	mime text
	•	width int, height int (optional)
	•	status enum: uploaded, ocr_pending, ocr_done, manual_review, rejected
	•	ocr_result_id uuid nullable
	•	created_at timestamptz

ocr_results
	•	id UUID PK
	•	image_id FK → menu_images.id
	•	raw_json jsonb (full OCR.Space response)
	•	text text (concatenated OCR text)
	•	words jsonb (word-level bounding boxes if isOverlayRequired)
	•	language text
	•	ocr_engine smallint
	•	processing_time_ms int
	•	created_at timestamptz

menus (human-reviewed menu text - derived)
	•	id UUID PK
	•	restaurant_id FK
	•	menu_image_id FK
	•	menu_date date (if available)
	•	content jsonb or text (structured lines / sections)
	•	verified_by uuid nullable
	•	created_at timestamptz

Note: store unstructured pieces (like OCR JSON) in jsonb. Use structured menus.content if you parse items into dish/price fields. Supabase/Postgres jsonb is appropriate when schema may change.  ￼

⸻

6. API surface (Next.js routes — minimal)

Client-facing
	•	GET /api/restaurants — list restaurants (with last uploaded menu summary)
	•	GET /api/restaurants/:slug/menus — list recent menu entries (image url + OCR text + status)
	•	POST /api/upload — upload image server-side (or accept filePath if client uploaded directly to Supabase signed URL). Returns image record with id and OCR job enqueued.
	•	POST /api/menus/:id/edit — submit manual corrections to OCR text (requires auth)
	•	GET /api/menus/:id/image — signed URL or redirect to public URL for the image

Internal OCR job
	•	POST /api/jobs/ocr — server endpoint run immediately as part of upload: call OCR.Space, store ocr_results, update menu_images.status. Could be synchronous on upload (fast) or pushed to a job queue (recommended if volume grows).

⸻

7. Upload & OCR flow (detailed)

Option A — Direct client upload via signed upload URL (recommended for large scale / lower server bandwidth):
	1.	Client requests signed upload URL from server: GET /api/signed-upload?path=menus/...
	2.	Server uses Supabase createSignedUploadUrl or uploadToSignedUrl flow to create write URL (or use Supabase Storage’s client SDK with anon key and direct upload to bucket). Prefer: server returns signed upload URL (or client receives upload credentials) and then client PUT directly to Supabase.
	3.	After upload, client notifies server with POST /api/upload + storage_path.
	4.	Server generates a signed read URL (createSignedUrl) or getPublicUrl for the object so OCR.Space can fetch it. OCR.Space requires a publicly reachable URL for url parameter (or you can stream file to OCR.Space via server). Use signed read URL if the bucket is private.  ￼
	5.	Server calls OCR.Space with url=SIGNED_READ_URL, apikey, language=eng, OCREngine=3, isOverlayRequired=true.
	6.	Parse OCR response, write ocr_results, mark menu_images.status=ocr_done.
	7.	Notify uploader or push to UI that menu is available for review.

Option B — Upload to server and stream to OCR.Space:
	•	Simpler for small scale. Server receives file in multipart/form-data, uploads to Supabase storage (for archival), then streams the file in the same request to OCR.Space using file upload. This requires server bandwidth but avoids signed read URLs.

Supabase JS upload docs & recommended patterns: upload, createSignedUrl, getPublicUrl.  ￼

⸻

8. OCR.Space usage specifics
	•	Endpoint: https://api.ocr.space/parse/image. Use apikey in header or form field.
	•	Send either file=@file or url=https://... in the form body. For accuracy, use OCREngine=3 and isOverlayRequired=true to get bounding boxes when you want to render overlays.
	•	Pay attention to rate-limits: the free plan is capped (≈500 requests/day per IP). Add queuing, caching (don’t re-run OCR if the same image path exists), and an admin override for manual processing when rate limits are reached.  ￼

⸻

9. Security & keys
	•	Server-only secrets (never expose to client):
	•	Supabase SERVICE_ROLE_KEY (only for DB admin tasks — avoid in client)
	•	OCR.Space API_KEY
	•	Client-safe key:
	•	Supabase anon/public key (for auth + direct storage upload when bucket policies permit)
	•	Use Next.js server/API routes or Edge Functions to keep secrets safe.
	•	If you allow client direct upload to Supabase Storage, use server-created signed upload URLs (or create bucket policies with RLS) to limit abuse. See Supabase upload & signed URL docs.  ￼

⸻

10. Supabase setup (step-by-step for interns)
	1.	Create Supabase project.
	2.	Create bucket menu-images (private by default).
	3.	Create Postgres tables (restaurants, menu_images, ocr_results, menus) — include created_at default now().
	4.	Setup auth (email sign-in via magic link or Google).
	5.	Add RLS policies:
	•	menu_images: allow insert if auth.uid() = uploaded_by.
	•	profiles: create as per Supabase auth docs (link auth.users).
	6.	Add a server env var on Vercel for SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (server) and SUPABASE_ANON_KEY (client).
	7.	Create storage bucket and test upload via dashboard and JS quickstart (see Supabase Next.js quickstart).  ￼

⸻

11. Implementation: minimal Next.js + Supabase + OCR.Space code snippets

A. Next.js server-side upload (simple — server receives file, uploads to Supabase, calls OCR.Space)

// pages/api/upload.js (Next.js API Route)
import formidable from "formidable";
import fs from "fs";
import { createClient } from "@supabase/supabase-js";
import FormData from "form-data";
import fetch from "node-fetch";

export const config = { api: { bodyParser: false } };

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).send(err.message);
    const file = files.file; // check field name
    const buffer = fs.readFileSync(file.path);
    const path = `menus/${fields.restaurantSlug}/${Date.now()}-${file.name}`;
    // upload to Supabase
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from("menu-images")
      .upload(path, buffer, { contentType: file.type });
    if (uploadError) return res.status(500).send(uploadError.message);

    // create signed GET url (valid e.g. 300s) so OCR.Space can fetch it
    const { signedURL } = await supabase.storage.from("menu-images").createSignedUrl(path, 300);

    // call OCR.Space with url
    const form2 = new FormData();
    form2.append("apikey", process.env.OCRSPACE_API_KEY);
    form2.append("url", signedURL);
    form2.append("language", "eng");
    form2.append("OCREngine", "3");
    form2.append("isOverlayRequired", "true");

    const ocrRes = await fetch("https://api.ocr.space/parse/image", { method: "POST", body: form2 });
    const ocrJson = await ocrRes.json();

    // Save DB records: menu_images + ocr_results (pseudo-code)
    // ... insert into DB using supabase.from('menu_images').insert(...) etc.

    return res.json({ ok: true, ocr: ocrJson });
  });
}

Note: This is a minimal example. Use streaming upload for large files, and sanitize inputs.

B. Alternative: Client uploads directly using Supabase JS (recommended)
	•	Client calls POST /api/get-upload-credentials → server returns an upload token or instructs client to use Supabase anon key to call supabase.storage.from('menu-images').upload(path, file).
	•	After success, client calls POST /api/notify-upload with path.
	•	Server does OCR as above using signed GET URL. Use createSignedUrl for private buckets.  ￼

⸻

12. UI / UX (MVP)
	•	Home: Restaurant list with last menu preview + timestamp.
	•	Restaurant page: feed of menu images (latest on top). Each item: photo thumbnail, OCR text block (editable), “Report wrong” and “I ate this / helpful” buttons.
	•	Upload widget: choose restaurant (or GPS detect), take photo, optional date field, submit.
	•	Moderator panel: queue of ocr_pending/manual_review items to validate.

Design notes:
	•	Display OCRed text side-by-side with image and a simple “approve / edit / reject” workflow.
	•	Keep edit textbox minimal (line split by newlines).
	•	If TextOverlay bounding boxes are available, show a toggle to overlay bounding boxes on the image for easier correction.

⸻

13. Intern onboarding checklist (concrete tasks)
	1.	Project setup
	•	Fork the repo template, clone, npm i, configure .env.local with SUPABASE_URL and SUPABASE_ANON_KEY.
	2.	Supabase
	•	Create project, create bucket menu-images.
	•	Create tables and run provided SQL migrations (attach SQL file).
	•	Create RLS policies for safe uploads (stubs provided).
	3.	Upload UI
	•	Build React component for image capture + preview.
	•	Implement direct upload using supabase.storage.from(...).upload(...).
	4.	Server
	•	Implement /api/notify-upload that triggers OCR handling.
	•	Save menu_images record and call OCR.Space as described.
	5.	Display
	•	Build restaurant page to show image + OCR text; allow edit and save to menus table.
	6.	Testing
	•	Add unit & e2e tests for upload + OCR parsing + display flows.
	7.	Deployment
	•	Deploy to Vercel; set server env vars (OCR api key, Supabase service key).
	8.	Docs
	•	Write README for how to obtain OCR.Space key and Supabase keys; include exact commands.

I’ll prepare a ready SQL migration + tiny Next.js skeleton if you want — say and I’ll paste it.

⸻

14. QA & Testing checklist for interns
	•	Upload images: JPG, PNG, rotated, low-light; verify upload & storage.
	•	OCR responses: verify ParsedResults exists; validate Text extraction.
	•	Edge cases: huge PDF, multi-page PDF (test PDF upload path), corrupt images.
	•	Language tests: menus that have some regional languages — test language=hin/urd where needed.
	•	Rate-limit: simulate >500 requests/day and observe error responses; implement backoff & manual queue.

⸻

15. Monitoring & Ops
	•	Log OCR responses (store full raw_json) for debugging.
	•	Track metrics: uploads/day, OCR success rate, avg processing ms.
	•	Use Sentry or a simple logging table in Supabase for errors.
	•	Implement retry/backoff for transient OCR errors (5xx or timeouts).

⸻

16. Cost & Limits (quick)
	•	Supabase free tier covers dev but check storage & bandwidth.
	•	OCR.Space free tier has daily request limits (~500/day per IP). For production, consider their paid plan or self-hosted Tesseract if you need unlimited free usage.  ￼

⸻

17. Roadmap / next features (post-MVP)
	•	Allow users to upvote menus (heatmap of accuracy).
	•	Full-text search across menus (Postgres full-text / embeddings).
	•	Auto-detect language and choose OCR language setting.
	•	Mobile PWA offline cache (store last-known menus).
	•	ML-based menu parsing (extract dish + price + tags) for structured display.

⸻

18. Helpful docs & references (exact links interns need)
	•	OCR.Space API docs (parse endpoint + params & examples).  ￼
	•	Supabase Storage upload (JS): upload / upload options.  ￼
	•	Supabase create signed URL (share private file temporarily).  ￼
	•	Supabase Storage Quickstart + Next.js guide.  ￼
	•	Supabase resumable uploads (when files >6MB).  ￼

⸻

19. Final recommended MVP approach (short)
	1.	Use Supabase Storage (private bucket) to store images. Client uploads directly using Supabase JS (anon key) to menu-images/restaurant-slug/....  ￼
	2.	Server generates signed read URL for the image (short expiry) and sends that URL to OCR.Space parse/image with OCREngine=3 and isOverlayRequired=true. Save full OCR JSON into ocr_results.  ￼
	3.	Show OCR text in restaurant page; allow edits that produce a verified menus entry.
	4.	Build simple moderator flows and caching to avoid re-OCRing same image.

⸻

If you want, I can now:
	•	Paste a SQL migration for the tables above.
	•	Create a Next.js repo skeleton with the upload API route + client upload component exactly wired to Supabase and OCR.Space (ready to drop into your interns’ repo).
	•	Or produce a task list in GitHub issue format (title + description + acceptance criteria) so you can assign to interns immediately.

Which one should I deliver next? (I’ll produce it right away.)