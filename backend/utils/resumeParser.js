import pdfParse from "pdf-parse";
import mammoth from "mammoth";

// Heuristic resume -> portfolio field extractor. Not NLP, just regex and
// line-shape guessing — good enough to pre-fill the builder, user reviews
// everything after. Handles PDF and DOCX, both parsed in memory.
export const parseResume = async (buffer, mimetype) => {
  let text;
  if (mimetype === "application/pdf") {
    text = (await pdfParse(buffer)).text;
  } else if (
    mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    text = (await mammoth.extractRawText({ buffer })).value;
  } else {
    throw new Error("Unsupported resume format — upload a PDF or DOCX file");
  }

  return buildSuggestion(text);
};

const SECTION_ALIASES = {
  summary: ["summary", "about", "profile", "objective", "introduction"],
  experience: ["experience", "work experience", "employment", "professional experience"],
  education: ["education", "academic background"],
  skills: ["skills", "skills summary", "technical skills", "core competencies"],
  projects: ["projects", "personal projects", "key projects"],
  certifications: ["certifications", "courses and certifications", "certificates", "licenses"],
  achievements: ["achievements", "accomplishments", "awards", "honors", "honours"],
};

const bulletRegex = /^[•\-\*◦●▪·]\s*/;

// PDF text extraction wraps long bullets across several lines with no marker
// on the continuation. Stitch those back together — if a line doesn't end in
// sentence punctuation, assume the next line continues it. Bullet markers
// always start a fresh line though.
function mergeWrappedLines(lines) {
  const merged = [];
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;
    const startsNewBullet = bulletRegex.test(line);
    const prev = merged[merged.length - 1];
    const prevEndsSentence = prev && /[.:;!?]$/.test(prev);
    if (!startsNewBullet && merged.length && !prevEndsSentence) {
      merged[merged.length - 1] = `${prev} ${line}`;
    } else {
      merged.push(line);
    }
  }
  return merged;
}
const dateRangeRegex =
  /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|\d{4})\s*[-–—]\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s?\d{4}|Present|Current|\d{4})/i;
const urlRegex = /(https?:\/\/[^\s,]+|(?:github|linkedin)\.com\/[^\s,]+)/gi;

function detectSection(line) {
  const lower = line.toLowerCase().trim().replace(/[:\-]+$/, "");
  for (const [key, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.some((a) => lower === a || (lower.length < 40 && lower.startsWith(a)))) {
      return key;
    }
  }
  return null;
}

const ROUND_GLYPHS = ["•", "◦", "●", "▪", "·"];

// Which glyph marks a new entry vs. just a detail bullet varies by resume.
// Figure it out once from the whole doc so sparse sections (one
// certification, three degrees) inherit whatever convention the meatier
// sections (experience) established instead of guessing blind.
function detectEntryGlyph(allLines) {
  const counts = {};
  for (const line of allLines) {
    const hit = ROUND_GLYPHS.find((g) => line.startsWith(g));
    if (hit) counts[hit] = (counts[hit] || 0) + 1;
  }
  const distinct = Object.keys(counts);
  if (distinct.length < 2) return null;
  distinct.sort((a, b) => counts[a] - counts[b]);
  return distinct[0]; // rarer glyph = entry marker
}

// Turns a section's lines into entries (one per job/project/degree). If
// entryGlyph is set, that glyph starts a new entry and everything else is a
// bullet under it. If not, there's only one glyph in play so it's always a
// bullet, and unmarked lines become the header instead.
function groupIntoEntries(lines, entryGlyph) {
  const stripAnyGlyph = (line) => line.replace(/^[•◦●▪·\-\*]\s*/, "").trim();
  const isDetailBullet = (line) => {
    if (/^[-*]\s*/.test(line)) return true; // hyphen/asterisk are always detail bullets
    const hit = ROUND_GLYPHS.find((g) => line.startsWith(g));
    if (!hit) return false;
    return entryGlyph ? hit !== entryGlyph : true;
  };
  const isEntryMarker = (line) => entryGlyph && line.startsWith(entryGlyph);

  const entries = [];
  let current = null;
  for (const line of lines) {
    if (isDetailBullet(line)) {
      const content = stripAnyGlyph(line);
      if (!current) {
        current = { header: "", bullets: [] };
        entries.push(current);
      }
      if (content) current.bullets.push(content);
    } else {
      current = { header: isEntryMarker(line) ? stripAnyGlyph(line) : line, bullets: [] };
      entries.push(current);
    }
  }
  return entries;
}

function splitDateRange(text) {
  const m = text.match(dateRangeRegex);
  if (!m) return { startDate: "", endDate: "", rest: text };
  return {
    startDate: m[1],
    endDate: m[2],
    rest: (text.slice(0, m.index) + text.slice(m.index + m[0].length)).trim(),
  };
}

function extractExperience(entries) {
  return entries
    .filter((e) => e.header)
    .map((e) => {
      const { startDate, endDate, rest } = splitDateRange(e.header);
      const parts = rest.split(/\s{2,}|\t|,\s(?=[A-Z])/).filter(Boolean);
      return {
        role: parts[0] || rest || e.header,
        company: parts.slice(1).join(", ") || "",
        startDate,
        endDate: endDate || "Present",
        bullets: e.bullets,
      };
    })
    .slice(0, 8);
}

function extractEducation(entries) {
  return entries
    .filter((e) => e.header)
    .map((e) => {
      const { startDate, endDate, rest } = splitDateRange(e.header);
      const scoreMatch = e.header.match(/(CGPA|GPA|percentage|%)[^,]*[\d.]+%?/i) ||
        [...e.bullets].map((b) => b.match(/(CGPA|GPA|%)[^,]*[\d.]+%?/i)).find(Boolean);
      return {
        institution: rest.split(",")[0] || e.header,
        degree: e.bullets[0] || rest.split(",").slice(1).join(",").trim(),
        duration: startDate ? `${startDate} - ${endDate}` : "",
        score: scoreMatch ? scoreMatch[0] : "",
      };
    })
    .slice(0, 6);
}

function extractSkills(lines) {
  // handles "Category: item, item" lines; anything else falls into one flat bucket
  const groups = [];
  const bucket = [];
  for (const raw of lines) {
    const line = raw.replace(bulletRegex, "").trim();
    if (!line) continue;
    const labelMatch = line.match(/^([A-Za-z &\/]{2,30}):\s*(.+)$/);
    if (labelMatch) {
      groups.push({
        category: labelMatch[1].trim(),
        items: labelMatch[2].split(/,|\u2022/).map((s) => s.trim()).filter(Boolean),
      });
    } else {
      bucket.push(...line.split(/,|\u2022/).map((s) => s.trim()).filter(Boolean));
    }
  }
  if (bucket.length) groups.push({ category: "Skills", items: bucket });
  return groups.slice(0, 8);
}

function extractProjects(entries) {
  return entries
    .filter((e) => e.header)
    .map((e) => {
      const urls = (e.header + " " + e.bullets.join(" ")).match(urlRegex) || [];
      const github = urls.find((u) => /github/i.test(u));
      const live = urls.find((u) => u !== github && /https?:\/\//.test(u));
      const techLine = e.bullets.find((b) => /^tech/i.test(b));
      return {
        title: e.header.replace(urlRegex, "").trim(),
        description: e.bullets.find((b) => !/^tech/i.test(b)) || "",
        bullets: e.bullets.filter((b) => b !== techLine),
        techStack: techLine ? techLine.replace(/^tech(?:\s*stack)?:?/i, "").split(",").map((s) => s.trim()).filter(Boolean) : [],
        githubUrl: github ? (github.startsWith("http") ? github : `https://${github}`) : "",
        liveUrl: live ? (live.startsWith("http") ? live : `https://${live}`) : "",
        featured: false,
      };
    })
    .slice(0, 10);
}

function extractCertifications(entries) {
  return entries
    .filter((e) => e.header)
    .map((e) => ({
      title: e.header.split(/[–\-]/)[0].trim(),
      issuer: e.header.split(/[–\-]/).slice(1).join("-").trim(),
      year: (e.header.match(/\b(19|20)\d{2}\b/) || [""])[0],
      description: e.bullets.join(" "),
    }))
    .slice(0, 6);
}

function extractAchievements(entries) {
  return entries
    .filter((e) => e.header)
    .map((e) => ({
      title: e.header,
      year: (e.header.match(/\b(19|20)\d{2}\b/) || [""])[0],
      description: e.bullets.join(" "),
    }))
    .slice(0, 8);
}

function buildSuggestion(text) {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[a-z]{2,}/);
  const phoneMatch = text.match(/(\+?\d[\d\s-]{8,}\d)/);
  const githubMatch = text.match(/github\.com\/[\w-]+/i);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);

  const fullName =
    lines.find((l) => l.length > 2 && l.length < 60 && !/@|\d{5,}/.test(l) && !detectSection(l)) || "";

  // Bucket every line into its detected section
  const buckets = { header: [] };
  let current = "header";
  for (const line of lines) {
    const hit = detectSection(line);
    if (hit) {
      current = hit;
      buckets[current] = buckets[current] || [];
      continue;
    }
    buckets[current] = buckets[current] || [];
    buckets[current].push(line);
  }

  const entryGlyph = detectEntryGlyph(lines);
  const introduction = mergeWrappedLines(buckets.summary || []).join(" ").slice(0, 600);

  return {
    suggested: {
      fullName,
      email: emailMatch?.[0] || "",
      phone: phoneMatch?.[0] || "",
      github: githubMatch ? `https://${githubMatch[0]}` : "",
      linkedin: linkedinMatch ? `https://${linkedinMatch[0]}` : "",
      introduction,
      experience: extractExperience(groupIntoEntries(mergeWrappedLines(buckets.experience || []), entryGlyph)),
      education: extractEducation(groupIntoEntries(mergeWrappedLines(buckets.education || []), entryGlyph)),
      skills: extractSkills(buckets.skills || []),
      projects: extractProjects(groupIntoEntries(mergeWrappedLines(buckets.projects || []), entryGlyph)),
      certifications: extractCertifications(
        groupIntoEntries(mergeWrappedLines(buckets.certifications || []), entryGlyph)
      ),
      achievements: extractAchievements(
        groupIntoEntries(mergeWrappedLines(buckets.achievements || []), entryGlyph)
      ),
      rawSections: buckets,
    },
    rawText: text,
  };
}
