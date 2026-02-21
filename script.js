// 🔥 FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";


// 🔥 FIREBASE CONFIG
const firebaseConfig = {
  apiKey: "AIzaSyAMBc1KPvflZDBdYYUWGWj4aWVx4_prGro",
  authDomain: "markit-7c3c1.firebaseapp.com",
  projectId: "markit-7c3c1",
  storageBucket: "markit-7c3c1.firebasestorage.app",
  messagingSenderId: "333041075813",
  appId: "1:333041075813:web:916aa3251352ecfb92688c"
};

// INIT
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Global variables
let currentUser = null;
let cachedMarks = [];
let charts = {};

// ==========================
// 🌙 THEME TOGGLE
// ==========================

function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
    document.getElementById("themeToggle").textContent = "☀️";
  } else {
    document.body.classList.remove("dark-theme");
    document.getElementById("themeToggle").textContent = "🌙";
  }
}

document.getElementById("themeToggle").addEventListener("click", () => {
  document.body.classList.toggle("dark-theme");
  const isDark = document.body.classList.contains("dark-theme");
  localStorage.setItem("theme", isDark ? "dark" : "light");
  document.getElementById("themeToggle").textContent = isDark ? "☀️" : "🌙";
});

// Initialize theme on load
initTheme();


// ==========================
// 🔐 AUTH SECTION
// ==========================

// Auth tabs switching
document.querySelectorAll(".auth-tab").forEach(tab => {
  tab.addEventListener("click", () => {
    const tabName = tab.getAttribute("data-tab");
    
    // Remove active from all tabs
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
    tab.classList.add("active");
    
    // Hide all forms
    document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
    
    // Show selected form
    if (tabName === "login") {
      document.getElementById("loginForm").classList.add("active");
    } else {
      document.getElementById("signupForm").classList.add("active");
    }
  });
});

document.getElementById("signupBtn").addEventListener("click", async () => {
  try {
    const username = document.getElementById("signupUsername").value.trim();
    const email = document.getElementById("signupEmail").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const confirm = document.getElementById("signupConfirmPassword").value.trim();

    if (!username || !email || !password || !confirm)
      return alert("Fill all fields");

    if (password !== confirm)
      return alert("Passwords do not match");

    if (password.length < 6)
      return alert("Password must be at least 6 characters");

    // Show loading state
    const signupBtn = document.getElementById("signupBtn");
    const originalText = signupBtn.textContent;
    signupBtn.textContent = "Creating account...";
    signupBtn.disabled = true;

    const cred = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(cred.user, { displayName: username });

    await setDoc(doc(db, "users", cred.user.uid), {
      username,
      email,
      createdAt: serverTimestamp()
    });

    alert("Signup successful! You can now login.");
    
    // Reset button and switch to login tab
    signupBtn.textContent = originalText;
    signupBtn.disabled = false;
    
    // Clear form fields
    document.getElementById("signupUsername").value = "";
    document.getElementById("signupEmail").value = "";
    document.getElementById("signupPassword").value = "";
    document.getElementById("signupConfirmPassword").value = "";
    
    // Switch to login tab
    document.querySelectorAll(".auth-tab").forEach(t => t.classList.remove("active"));
    document.querySelector(".auth-tab[data-tab='login']").classList.add("active");
    document.querySelectorAll(".auth-form").forEach(f => f.classList.remove("active"));
    document.getElementById("loginForm").classList.add("active");
  } catch (err) {
    const signupBtn = document.getElementById("signupBtn");
    signupBtn.textContent = "Sign Up";
    signupBtn.disabled = false;
    
    let errorMsg = err.message;
    if (err.code === "auth/email-already-in-use") {
      errorMsg = "Email already in use. Please login or use a different email.";
    } else if (err.code === "auth/weak-password") {
      errorMsg = "Password is too weak. Use at least 6 characters.";
    } else if (err.code === "auth/invalid-email") {
      errorMsg = "Invalid email format.";
    }
    
    alert(errorMsg);
    console.error("Signup error:", err);
  }
});


document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    const email = document.getElementById("loginEmail").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    // Validation
    if (!email || !password) {
      return alert("Please enter email and password");
    }

    // Show loading state
    const loginBtn = document.getElementById("loginBtn");
    const originalText = loginBtn.textContent;
    loginBtn.textContent = "Logging in...";
    loginBtn.disabled = true;

    // Sign in
    await signInWithEmailAndPassword(auth, email, password);
    
    // Reset button
    loginBtn.textContent = originalText;
    loginBtn.disabled = false;
  } catch (err) {
    const loginBtn = document.getElementById("loginBtn");
    loginBtn.textContent = "Login";
    loginBtn.disabled = false;
    
    // User-friendly error messages
    let errorMsg = err.message;
    if (err.code === "auth/user-not-found") {
      errorMsg = "Account not found. Please sign up first.";
    } else if (err.code === "auth/wrong-password") {
      errorMsg = "Incorrect password. Please try again.";
    } else if (err.code === "auth/invalid-email") {
      errorMsg = "Invalid email format.";
    } else if (err.code === "auth/invalid-credential") {
      errorMsg = "Invalid email or password.";
    }
    
    alert(errorMsg);
    console.error("Login error:", err);
  }
});


document.getElementById("logoutBtn")
  .addEventListener("click", () => signOut(auth));


onAuthStateChanged(auth, user => {
  try {
    const authSection = document.getElementById("auth-section");
    const dashboard = document.getElementById("dashboard");

    if (user) {
      currentUser = user;
      console.log("✅ User logged in:", user.email);

      // Get display name or extract from email
      const displayName = user.displayName || user.email.split("@")[0];
      
      document.getElementById("userName").textContent = displayName;
      document.getElementById("userEmail").textContent = user.email;

      // Set personalized welcome message
      const welcomeText = document.getElementById("welcomeText");
      welcomeText.textContent = `Welcome back, ${displayName} 👋`;
      welcomeText.classList.add("welcome-animate");

      authSection.classList.add("hidden");
      dashboard.classList.remove("hidden");

      loadMarks();
    } else {
      currentUser = null;
      console.log("❌ No user logged in");
      authSection.classList.remove("hidden");
      dashboard.classList.add("hidden");
    }
  } catch (err) {
    console.error("❌ Auth state change error:", err);
  }
});


// ==========================
// 📱 MOBILE MENU
// ==========================

const hamburger = document.getElementById("hamburger");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");

hamburger.addEventListener("click", () => {
  hamburger.classList.toggle("active");
  sidebar.classList.toggle("open");
  sidebarOverlay.classList.toggle("active");
});

sidebarOverlay.addEventListener("click", () => {
  hamburger.classList.remove("active");
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("active");
});

// Close menu on nav item click
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    hamburger.classList.remove("active");
    sidebar.classList.remove("open");
    sidebarOverlay.classList.remove("active");
  });
});


// ==========================
// 🧭 NAVIGATION (Internals / Semester Fix)
// ==========================

document.querySelectorAll(".nav-item").forEach(btn => {
  btn.addEventListener("click", () => {

    document.querySelectorAll(".nav-item")
      .forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const section = btn.dataset.section;

    document.querySelectorAll(".content-section")
      .forEach(sec => sec.classList.remove("active"));

    document.getElementById(section + "-section")
      .classList.add("active");
  });
});


// ==========================
// 🎯 SEMESTER SELECTOR BUTTONS
// ==========================

document.querySelectorAll(".sem-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".sem-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    // Refresh table if needed
    renderInternalsTable();
  });
});


// ==========================
// 🎯 YEAR SELECTOR BUTTONS
// ==========================

document.querySelectorAll(".year-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".year-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    // Refresh table if needed
    renderSemesterTable();
  });
});


// ==========================
// 💾 SAVE MARKS (FULL FIX)
// ==========================

document.getElementById("saveMarks")
  .addEventListener("click", async () => {

    try {
      if (!currentUser) return alert("Login first");

      const subjectVal = document.getElementById("subject").value.trim();
      const yearVal = document.getElementById("year").value;
      const semesterVal = document.getElementById("semester").value;
      const examTypeVal = document.getElementById("examType").value;

      const marksVal = Number(document.getElementById("marksScored").value);
      const totalVal = Number(document.getElementById("totalMarks").value);
      const attendanceVal = Number(document.getElementById("attendance").value) || 0;
      const totalClassesVal = Number(document.getElementById("totalClasses").value) || 0;

      if (!subjectVal || !yearVal || !semesterVal || !examTypeVal)
        return alert("Fill all required fields");

      if (marksVal > totalVal)
        return alert("Marks cannot exceed total");

      await addDoc(
        collection(db, "users", currentUser.uid, "marks"),
        {
          subject: subjectVal,
          year: yearVal,
          semester: semesterVal,
          examType: examTypeVal,
          marksScored: marksVal,
          totalMarks: totalVal,
          attendance: attendanceVal,
          totalClasses: totalClassesVal,
          createdAt: serverTimestamp()
        }
      );

      alert("Saved successfully!");
      document.getElementById("addMarksForm").reset();
      loadMarks();

    } catch (err) {
      console.error("SAVE ERROR:", err);
      alert(err.message);
    }
  });


// ==========================
// 📊 LOAD MARKS
// ==========================

async function loadMarks() {
  if (!currentUser) return;

  const snap = await getDocs(
    collection(db, "users", currentUser.uid, "marks")
  );

  cachedMarks = [];
  snap.forEach(d => cachedMarks.push({ ...d.data(), id: d.id }));

  calculateDashboard();
  renderCharts();
  renderInternalsTable();
  renderSemesterTable();
  renderMarksListForManagement();
}


// ==========================
// 📊 CALCULATE DASHBOARD
// ==========================

function calculateDashboard() {
  // Overall score
  let total = 0;
  let max = 0;

  cachedMarks.forEach(m => {
    total += m.marksScored || 0;
    max += m.totalMarks || 0;
  });

  const overallPercentage = max > 0 ? ((total / max) * 100).toFixed(1) : 0;
  document.getElementById("overallScoreDisplay").textContent = overallPercentage + "%";

  // S1 Total Score Calculation
  const s1Marks = cachedMarks.filter(m => m.semester === "S1");
  let s1Total = 0;
  s1Marks.forEach(m => {
    if (m.examType === "Internal1" || m.examType === "Internal2") {
      s1Total += m.marksScored || 0;
    } else if (m.examType === "Semester") {
      s1Total += m.marksScored || 0;
    }
    s1Total += m.attendance || 0;
    s1Total += m.assignmentMarks || 0;
  });
  document.getElementById("s1TotalScoreDisplay").textContent = s1Total.toFixed(0);

  // S1 CGPA Calculation (max 4.0)
  const s1MaxTotal = s1Marks.length * 100; // assuming max per subject
  const s1CGPA = s1MaxTotal > 0 ? (s1Total / (s1MaxTotal / 4)) : 0;
  document.getElementById("s1CgpaDisplay").textContent = Math.min(s1CGPA, 4.0).toFixed(2);

  // Required S2 Average to maintain/achieve target
  const targetCGPA = 3.5;
  const targetTotal = targetCGPA * 25; // Rough calculation
  const s2Required = Math.max(0, targetTotal - s1Total);
  document.getElementById("s2RequiredAvgDisplay").textContent = s2Required.toFixed(0);

  // Target Status
  let targetStatus = "Not Started";
  if (overallPercentage >= 85) {
    targetStatus = "🎯 On Track";
  } else if (overallPercentage >= 70) {
    targetStatus = "⚠️ Needs Work";
  } else if (overallPercentage >= 50) {
    targetStatus = "🔴 Behind";
  }
  document.getElementById("targetStatusDisplay").textContent = targetStatus;

  // Best and Weakest Subjects
  const subjectAverages = {};
  cachedMarks.forEach(m => {
    if (!subjectAverages[m.subject]) {
      subjectAverages[m.subject] = { scores: [], count: 0 };
    }
    subjectAverages[m.subject].scores.push((m.marksScored / m.totalMarks) * 100);
  });

  let bestSubject = "N/A";
  let bestScore = 0;
  let weakestSubject = "N/A";
  let weakestScore = 100;

  Object.entries(subjectAverages).forEach(([subject, data]) => {
    const avg = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    if (avg > bestScore) {
      bestScore = avg;
      bestSubject = subject;
    }
    if (avg < weakestScore) {
      weakestScore = avg;
      weakestSubject = subject;
    }
  });

  document.getElementById("bestSubject").textContent = bestSubject;
  document.getElementById("bestScore").textContent = `(${bestScore.toFixed(1)}%)`;
  document.getElementById("weakestSubject").textContent = weakestSubject;
  document.getElementById("weakestScore").textContent = `(${weakestScore.toFixed(1)}%)`;

  // Total Attendance
  let totalAttended = 0;
  let totalClasses = 0;
  cachedMarks.forEach(m => {
    totalAttended += m.attendance || 0;
    totalClasses += m.totalClasses || 0;
  });
  const attendancePercentage = totalClasses > 0 ? ((totalAttended / totalClasses) * 100).toFixed(1) : 0;
  document.getElementById("totalAttendance").textContent = attendancePercentage + "%";
}


// ==========================
// 🧠 PERFORMANCE INSIGHTS
// ==========================

function renderInsights() {
  const predictionBox = document.getElementById("prediction-box");
  const feedbackBox = document.getElementById("feedback-box");
  const motivationBox = document.getElementById("motivation-box");

  if (!predictionBox || !feedbackBox || !motivationBox) return;

  let total = 0, max = 0;
  cachedMarks.forEach(m => {
    total += m.marksScored || 0;
    max += m.totalMarks || 0;
  });

  const percentage = max > 0 ? (total / max) * 100 : 0;

  // Prediction
  let prediction = "Calculating academic trajectory...";
  if (percentage >= 85) {
    prediction = "📈 Excellent trajectory! You're on track for honors/high distinction.";
  } else if (percentage >= 75) {
    prediction = "🎯 Good progress! Focus on strengthening weak areas to achieve excellence.";
  } else if (percentage >= 65) {
    prediction = "⚠️ Average performance. Increase study hours and target weak subjects.";
  } else {
    prediction = "🔴 Below average. Urgent attention needed. Consider tutoring or study groups.";
  }
  predictionBox.innerHTML = `<strong>Trajectory:</strong> ${prediction}`;

  // Feedback
  const subjectAverages = {};
  cachedMarks.forEach(m => {
    if (!subjectAverages[m.subject]) {
      subjectAverages[m.subject] = [];
    }
    subjectAverages[m.subject].push((m.marksScored / m.totalMarks) * 100);
  });

  let feedbackHTML = "<strong>Subject Analysis:</strong>";
  Object.entries(subjectAverages).forEach(([subject, scores]) => {
    const avg = scores.reduce((a, b) => a + b) / scores.length;
    let status = avg >= 80 ? "strong" : avg >= 60 ? "good" : "weak";
    feedbackHTML += `<div class="feedback-item ${status}"><span>${subject}: ${avg.toFixed(1)}%</span></div>`;
  });
  feedbackBox.innerHTML = feedbackHTML;

  // Motivation
  let motivation = "Keep pushing forward! Every score brings you closer to your goals! 💪";
  if (percentage >= 85) {
    motivation = "Outstanding performance! You're setting an excellent example! 🏆";
  } else if (percentage < 50) {
    motivation = "Don't give up! Success comes with consistent effort. You've got this! 🚀";
  }
  motivationBox.innerHTML = motivation;
}


// ==========================
// 📊 RENDER CHARTS
// ==========================

function renderCharts() {

  Object.values(charts).forEach(c => c.destroy?.());
  charts = {};

  if (cachedMarks.length === 0) return;

  // Render insights
  renderInsights();

  // BAR CHART
  const subjectMap = {};
  cachedMarks.forEach(m => {
    if (!subjectMap[m.subject])
      subjectMap[m.subject] = { s: 0, t: 0 };

    subjectMap[m.subject].s += m.marksScored;
    subjectMap[m.subject].t += m.totalMarks;
  });

  const subjectBarChart = document.getElementById("subjectBarChart");
  if (subjectBarChart) {
    charts.bar = new Chart(
      subjectBarChart,
      {
        type: "bar",
        data: {
          labels: Object.keys(subjectMap),
          datasets: [{
            label: "Percentage",
            data: Object.values(subjectMap)
              .map(v => (v.s / v.t) * 100),
            backgroundColor: "rgba(102, 126, 234, 0.6)",
            borderColor: "#667eea",
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true,
          scales: {
            y: { beginAtZero: true, max: 100 }
          },
          plugins: {
            legend: { display: true }
          }
        }
      }
    );
  }

  // ATTENDANCE PIE
  let attended = 0;
  let totalClassesCount = 0;

  cachedMarks.forEach(m => {
    attended += m.attendance || 0;
    totalClassesCount += m.totalClasses || 0;
  });

  const attendancePieChart = document.getElementById("attendancePieChart");
  if (attendancePieChart) {
    charts.pie = new Chart(
      attendancePieChart,
      {
        type: "pie",
        data: {
          labels: ["Attended", "Absent"],
          datasets: [{
            data: [
              attended,
              Math.max(0, totalClassesCount - attended)
            ],
            backgroundColor: [
              "rgba(102, 126, 234, 0.6)",
              "rgba(255, 77, 77, 0.6)"
            ]
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: true
        }
      }
    );
  }
}


// ==========================
// 📋 RENDER INTERNALS TABLE
// ==========================

function renderInternalsTable() {
  const container = document.getElementById("internalsTableContainer");
  if (!container) return;

  // Get selected semester
  const selectedSem = document.querySelector(".sem-btn.active")?.getAttribute("data-semester") || "S1";

  // Filter internals for selected semester
  const internals = cachedMarks.filter(m => 
    m.semester === selectedSem && (m.examType === "Internal1" || m.examType === "Internal2")
  );

  if (internals.length === 0) {
    container.innerHTML = "<p style='color: var(--text-secondary); padding: 20px; text-align: center;'>No internal marks recorded for this semester.</p>";
    return;
  }

  // Group by subject, maintain order of first entry
  const subjectMap = {};
  const subjectOrder = [];

  internals.forEach(mark => {
    const subject = mark.subject;
    
    if (!subjectMap[subject]) {
      subjectMap[subject] = { marks: [], Internal1: 0, Internal2: 0 };
      subjectOrder.push(subject);
    }
    subjectMap[subject].marks.push(mark);

    if (mark.examType === "Internal1") {
      subjectMap[subject].Internal1 = mark.marksScored || 0;
    } else if (mark.examType === "Internal2") {
      subjectMap[subject].Internal2 = mark.marksScored || 0;
    }
  });

  // Build table
  let tableHTML = `
    <table>
      <thead>
        <tr>
          <th>SUBJECT</th>
          <th>INTERNAL 1</th>
          <th>INTERNAL 2</th>
          <th>AVERAGE MARKS</th>
          <th style="width: 120px;">ACTIONS</th>
        </tr>
      </thead>
      <tbody>
  `;

  subjectOrder.forEach(subject => {
    const data = subjectMap[subject];
    const average = ((data.Internal1 + data.Internal2) / 2).toFixed(2);
    
    // Get mark IDs for this subject
    const int1Mark = data.marks.find(m => m.examType === "Internal1");
    const int2Mark = data.marks.find(m => m.examType === "Internal2");

    tableHTML += `
      <tr>
        <td><strong>${subject}</strong></td>
        <td>${data.Internal1}</td>
        <td>${data.Internal2}</td>
        <td class="highlight-col">${average}</td>
        <td style="display: flex; gap: 8px;">
          ${int1Mark ? `<button class="action-btn edit-btn" data-mark-id="${int1Mark.id}" data-action="edit" title="Edit Internal 1">✏️</button>` : ''}
          ${int2Mark ? `<button class="action-btn edit-btn" data-mark-id="${int2Mark.id}" data-action="edit" title="Edit Internal 2">✏️</button>` : ''}
          ${int1Mark ? `<button class="action-btn delete-btn" data-mark-id="${int1Mark.id}" data-action="delete" title="Delete Internal 1">🗑️</button>` : ''}
          ${int2Mark ? `<button class="action-btn delete-btn" data-mark-id="${int2Mark.id}" data-action="delete" title="Delete Internal 2">🗑️</button>` : ''}
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;

  // Add event listeners
  addMarksActionButtons();

  // Render trend chart
  renderInternalsTrendChart(subjectOrder, subjectMap);
}


// ==========================
// 📈 INTERNAL TREND CHART
// ==========================

function renderInternalsTrendChart(subjects, data) {
  const ctx = document.getElementById("internalTrendChart");
  if (!ctx || subjects.length === 0) return;

  // Destroy old chart before creating new one
  if (charts.internalTrend) {
    charts.internalTrend.destroy();
    charts.internalTrend = null;
  }

  // Extract scores for each subject, treating missing values as 0
  const internal1Scores = subjects.map(s => data[s]?.Internal1 || 0);
  const internal2Scores = subjects.map(s => data[s]?.Internal2 || 0);

  charts.internalTrend = new Chart(ctx, {
    type: "line",
    data: {
      labels: subjects,
      datasets: [
        {
          label: "Internal 1",
          data: internal1Scores,
          borderColor: "#667eea",
          backgroundColor: "rgba(102, 126, 234, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3
        },
        {
          label: "Internal 2",
          data: internal2Scores,
          borderColor: "#764ba2",
          backgroundColor: "rgba(118, 75, 162, 0.1)",
          tension: 0.4,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          borderWidth: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: "top" }
      },
      scales: {
        y: { beginAtZero: true, max: 100, ticks: { stepSize: 10 } }
      }
    }
  });
}


// ==========================
// 📋 RENDER SEMESTER TABLE
// ==========================

function renderSemesterTable() {
  const container = document.getElementById("semesterTableContainer");
  if (!container) return;

  // Get selected year
  const selectedYear = document.querySelector(".year-btn.active")?.getAttribute("data-year") || "1";

  // Group by subject for selected year
  const subjectMap = {};
  const subjectOrder = [];
  const subjectMarks = {}; // Store marks for each subject

  cachedMarks
    .filter(mark => mark.year === selectedYear) // Filter by year
    .forEach(mark => {
      const subject = mark.subject;
      
      if (!subjectMap[subject]) {
        subjectMap[subject] = {
          marks: [],
          S1Semester: 0,
          S2Semester: 0,
          Internal1: 0,
          Internal2: 0,
          S1Attendance: 0,
          S2Attendance: 0,
          S1Assignment: 0,
          S2Assignment: 0
        };
        subjectOrder.push(subject);
      }

      subjectMap[subject].marks.push(mark);

      // Extract semester exam marks
      if (mark.examType === "Semester" && mark.semester === "S1") {
        subjectMap[subject].S1Semester += mark.marksScored || 0;
      } else if (mark.examType === "Semester" && mark.semester === "S2") {
        subjectMap[subject].S2Semester += mark.marksScored || 0;
      }

      // Extract internal marks
      if (mark.examType === "Internal1") {
        subjectMap[subject].Internal1 = Math.max(subjectMap[subject].Internal1, mark.marksScored || 0);
      } else if (mark.examType === "Internal2") {
        subjectMap[subject].Internal2 = Math.max(subjectMap[subject].Internal2, mark.marksScored || 0);
      }

      // Extract attendance and assignment marks by semester
      if (mark.semester === "S1") {
        subjectMap[subject].S1Attendance = Math.max(subjectMap[subject].S1Attendance, mark.attendance || 0);
        subjectMap[subject].S1Assignment = Math.max(subjectMap[subject].S1Assignment, mark.assignmentMarks || 0);
      } else if (mark.semester === "S2") {
        subjectMap[subject].S2Attendance = Math.max(subjectMap[subject].S2Attendance, mark.attendance || 0);
        subjectMap[subject].S2Assignment = Math.max(subjectMap[subject].S2Assignment, mark.assignmentMarks || 0);
      }
    });

  // If no marks for selected year
  if (subjectOrder.length === 0) {
    container.innerHTML = "<p style='color: var(--text-secondary); padding: 20px; text-align: center;'>No semester marks recorded for Year " + selectedYear + ".</p>";
    return;
  }

  // Build table
  let tableHTML = `
    <table>
      <thead>
        <tr>
          <th>SUBJECT</th>
          <th>S1</th>
          <th>S2</th>
          <th>TOTAL</th>
          <th>S1 FINAL</th>
          <th>S2 FINAL</th>
          <th style="width: 80px;">ACTIONS</th>
        </tr>
      </thead>
      <tbody>
  `;

  subjectOrder.forEach(subject => {
    const d = subjectMap[subject];

    // Calculate finals as per requirement:
    // S1 FINAL = Semester(S1) + Internal1 + Attendance(S1) + Assignment(S1)
    // S2 FINAL = Semester(S2) + Internal2 + Attendance(S2) + Assignment(S2)
    const s1Final = (d.S1Semester || 0) + (d.Internal1 || 0) + (d.S1Attendance || 0) + (d.S1Assignment || 0);
    const s2Final = (d.S2Semester || 0) + (d.Internal2 || 0) + (d.S2Attendance || 0) + (d.S2Assignment || 0);
    const total = s1Final + s2Final;

    // Get one mark from this subject for editing (any semester exam)
    const editableMark = d.marks.find(m => m.examType === "Semester") || d.marks[0];
    const editMarkId = editableMark?.id || '';

    tableHTML += `
      <tr>
        <td><strong>${subject}</strong></td>
        <td>${(d.S1Semester || 0).toFixed(1)}</td>
        <td>${(d.S2Semester || 0).toFixed(1)}</td>
        <td class="highlight-col">${total.toFixed(2)}</td>
        <td>${s1Final.toFixed(2)}</td>
        <td>${s2Final.toFixed(2)}</td>
        <td style="display: flex; gap: 6px; justify-content: center;">
          ${editMarkId ? `<button class="action-btn edit-btn" data-mark-id="${editMarkId}" data-action="edit" title="Edit">✏️</button>` : ''}
          ${editMarkId ? `<button class="action-btn delete-btn" data-mark-id="${editMarkId}" data-action="delete" title="Delete">🗑️</button>` : ''}
        </td>
      </tr>
    `;
  });

  tableHTML += `
      </tbody>
    </table>
  `;

  container.innerHTML = tableHTML;
  
  // Add event listeners
  addMarksActionButtons();
}


// ==========================
// 📋 RENDER MARKS MANAGEMENT
// ==========================

function renderMarksListForManagement() {
  // This function is called to support edit/delete functionality
  // The actual list is rendered on-demand when editing
}


// ==========================
// ✏️ EDIT MARK FUNCTION
// ==========================

function editMark(markId) {
  const mark = cachedMarks.find(m => m.id === markId);
  if (!mark) {
    alert("Mark not found!");
    return;
  }

  // Populate modal with mark data
  document.getElementById("editId").value = markId;
  document.getElementById("editSubject").value = mark.subject;
  document.getElementById("editYear").value = mark.year;
  document.getElementById("editSemester").value = mark.semester;
  document.getElementById("editExamType").value = mark.examType;
  document.getElementById("editMarksScored").value = mark.marksScored;
  document.getElementById("editTotalMarks").value = mark.totalMarks;
  document.getElementById("editAttendance").value = mark.attendance || 0;
  document.getElementById("editTotalClasses").value = mark.totalClasses || 1;
  document.getElementById("editAssignmentMarks").value = mark.assignmentMarks || 0;

  // Show modal
  document.getElementById("editModal").classList.remove("hidden");
}


// ==========================
// 🗑️ DELETE MARK FUNCTION
// ==========================

async function deleteMark(markId) {
  const mark = cachedMarks.find(m => m.id === markId);
  if (!mark) {
    alert("Mark not found!");
    return;
  }

  // Show confirmation dialog
  const confirmDelete = confirm(
    `⚠️ WARNING: Delete this mark?\n\n` +
    `Subject: ${mark.subject}\n` +
    `Exam Type: ${mark.examType}\n` +
    `Marks: ${mark.marksScored}/${mark.totalMarks}\n\n` +
    `This action cannot be undone.`
  );

  if (!confirmDelete) return;

  try {
    // Delete from Firestore
    await deleteDoc(doc(db, "users", currentUser.uid, "marks", markId));
    
    // Reload marks
    await loadMarks();
    alert("✅ Mark deleted successfully!");
  } catch (err) {
    console.error("Delete error:", err);
    alert("❌ Error deleting mark: " + err.message);
  }
}


// ==========================
// 💾 EDIT MODAL SAVE
// ==========================

document.getElementById("editModalSave")?.addEventListener("click", async () => {
  try {
    const markId = document.getElementById("editId").value;
    if (!markId) return alert("Error: Mark ID not found");

    const updatedData = {
      subject: document.getElementById("editSubject").value.trim(),
      year: document.getElementById("editYear").value,
      semester: document.getElementById("editSemester").value,
      examType: document.getElementById("editExamType").value,
      marksScored: Number(document.getElementById("editMarksScored").value),
      totalMarks: Number(document.getElementById("editTotalMarks").value),
      attendance: Number(document.getElementById("editAttendance").value) || 0,
      totalClasses: Number(document.getElementById("editTotalClasses").value) || 1,
      assignmentMarks: Number(document.getElementById("editAssignmentMarks").value) || 0
    };

    // Validation
    if (!updatedData.subject || !updatedData.year || !updatedData.semester || !updatedData.examType) {
      return alert("Fill all required fields");
    }

    if (updatedData.marksScored > updatedData.totalMarks) {
      return alert("Marks scored cannot exceed total marks");
    }

    // Update in Firestore
    await updateDoc(doc(db, "users", currentUser.uid, "marks", markId), updatedData);

    // Close modal
    document.getElementById("editModal").classList.add("hidden");

    // Reload marks
    await loadMarks();
    alert("✅ Mark updated successfully!");
  } catch (err) {
    console.error("Update error:", err);
    alert("❌ Error updating mark: " + err.message);
  }
});


// ==========================
// 🔘 EDIT MODAL CLOSE
// ==========================

document.getElementById("editModalClose")?.addEventListener("click", () => {
  document.getElementById("editModal").classList.add("hidden");
});

document.getElementById("editModalCancel")?.addEventListener("click", () => {
  document.getElementById("editModal").classList.add("hidden");
});


// ==========================
// 🎯 ADD EDIT/DELETE TO TABLES
// ==========================

// Add action buttons to internals and semester tables
const originalRenderInternalsTable = renderInternalsTable;
renderInternalsTable = function() {
  originalRenderInternalsTable.call(this);
  addMarksActionButtons();
};

const originalRenderSemesterTable = renderSemesterTable;
renderSemesterTable = function() {
  originalRenderSemesterTable.call(this);
  addMarksActionButtons();
};

function addMarksActionButtons() {
  // Add click handlers to edit/delete buttons
  document.querySelectorAll("[data-mark-id]").forEach(btn => {
    if (btn.dataset.action === "edit") {
      btn.addEventListener("click", () => editMark(btn.dataset.markId));
    } else if (btn.dataset.action === "delete") {
      btn.addEventListener("click", () => deleteMark(btn.dataset.markId));
    }
  });
}