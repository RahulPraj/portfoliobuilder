// Pre-filled from the uploaded resume — this is what the "Import from resume"
// flow produces as a starting draft; the user reviews & edits it in the builder.
export const rahulPortfolioData = {
  fullName: "Rahul Prajapati",
  headline: "MERN Stack Developer & Technical Trainer",
  introduction:
    "Technical Trainer and Full-Stack Developer with 3+ years of experience delivering industry-oriented " +
    "training in MERN Stack Development and UI/UX Design. I've mentored 2,000+ students across colleges " +
    "in Karnataka and beyond, turning React, Node, Express and MongoDB fundamentals into real, deployable " +
    "full-stack projects.",
  location: "New Delhi, India",
  email: "rahul971801@gmail.com",
  phone: "+91 8448304574",
  github: "https://github.com/RahulPraj",
  linkedin: "",
  website: "",
  avatarUrl: "/uploads/rahul-avatar.jpg",

  skills: [
    { category: "Languages", items: ["JavaScript", "Java", "Python", "HTML", "CSS"] },
    { category: "Frameworks & Libraries", items: ["React.js", "Node.js", "Express.js", "Bootstrap", "Tailwind CSS"] },
    { category: "Tools & Technologies", items: ["Git", "GitHub", "Postman", "MongoDB", "VS Code", "Cursor AI", "Figma"] },
    { category: "Platforms", items: ["Netlify", "Render", "Web", "Windows"] },
    { category: "Soft Skills", items: ["Leadership", "Public Speaking", "Time Management", "Event Management"] },
  ],

  experience: [
    {
      role: "Technical Trainer",
      company: "Pan India (MERN Stack & UI/UX Design)",
      startDate: "Jun 2025",
      endDate: "Present",
      bullets: [
        "Trained and mentored 2,000+ BCA students across KLE Society colleges and institutions in Karnataka.",
        "Delivered hands-on training in React.js, Node.js, Express.js, MongoDB, REST APIs, Figma, and responsive design.",
        "Mentored students through project architecture, implementation, debugging, code review, and deployment.",
        "Designed and continuously improved industry-aligned curricula and project-based assessments.",
        "Collaborated with Marwadi University (Rajkot) and SKCET (Coimbatore) on training delivery.",
      ],
    },
    {
      role: "Full-Stack Developer & Technical Trainer",
      company: "Techkrit Innovations (Remote, Full-time)",
      startDate: "May 2024",
      endDate: "Present",
      bullets: [
        "Delivered project-based MERN stack training across multiple cohorts.",
        "Designed and updated curriculum while mentoring students through real-world full-stack projects.",
        "Collaborated with Hindustan College of Science & Technology, GNIOT, GLA University, Chitkara University and Sharda University.",
      ],
    },
    {
      role: "Co-Mentor, Full-Stack Development",
      company: "Coding Blocks (On-site)",
      startDate: "Sep 2023",
      endDate: "Apr 2024",
      bullets: [
        "Assisted lead instructors delivering MERN stack training and hands-on sessions.",
        "Ran doubt-solving sessions, debugged code live, and explained concepts during classes.",
        "Mentored 500+ students building full-stack projects.",
      ],
    },
  ],

  projects: [
    {
      title: "Internship Portal",
      description: "A full-stack internship platform for students and recruiters with role-based dashboards.",
      bullets: [
        "Enabled application tracking, internship posting, and secure JWT authentication.",
        "Built reusable React components and integrated APIs with Axios.",
      ],
      techStack: ["React.js", "Node.js", "Express.js", "MongoDB", "JWT", "Bcrypt"],
      githubUrl: "https://github.com/RahulPraj",
      liveUrl: "",
      featured: true,
    },
    {
      title: "DSA Tracker",
      description: "A full-stack DSA tracking system with weekly tests, streaks, and badge-based ranking.",
      bullets: [
        "Implemented JWT auth, a cron-based ranking system, and revision tracking.",
        "Built an interactive dashboard with charts and performance analytics.",
      ],
      techStack: ["React.js", "Node.js", "Express.js", "MongoDB Atlas", "Tailwind CSS", "Recharts"],
      githubUrl: "https://github.com/RahulPraj",
      liveUrl: "",
      featured: true,
    },
  ],

  certifications: [
    {
      title: "Full Stack Development",
      issuer: "Coding Blocks",
      year: "",
      description:
        "Comprehensive course covering frontend and backend technologies — React.js, Node.js, Express.js, MongoDB — and deployment, through hands-on projects.",
    },
  ],

  education: [
    {
      institution: "Maharaja Agrasen Institute of Technology, New Delhi",
      degree: "B.Tech, Mechanical and Automation",
      duration: "2019 - 2023",
      score: "CGPA: 9.36/10",
    },
    {
      institution: "GTB 3rd Centenary Public School, New Delhi",
      degree: "Class XII, CBSE",
      duration: "2018 - 2019",
      score: "73.5%",
    },
    {
      institution: "GTB 3rd Centenary Public School, New Delhi",
      degree: "Class X, CBSE",
      duration: "2016 - 2017",
      score: "CGPA: 8.4/10",
    },
  ],

  tags: ["React.js", "Node.js", "Express.js", "MongoDB", "MERN", "Technical Training", "UI/UX"],
  theme: { templateId: "aurora", palette: "default", fontPair: "default" },
  approvalStatus: "approved",
  isPublished: true,
  slug: "rahul-prajapati",
};
