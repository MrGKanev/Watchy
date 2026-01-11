document.addEventListener("DOMContentLoaded", () => {
  const trackerContainer = document.getElementById("tracker");
  const addTrackerButton = document.getElementById("add-tracker");
  const exportCsvButton = document.getElementById("export-csv");
  const exportTxtButton = document.getElementById("export-txt");
  const clearAllButton = document.getElementById("clear-all");
  const favicon = document.getElementById("favicon");
  const themeToggle = document.getElementById("theme-toggle");
  const themeIconLight = document.getElementById("theme-icon-light");
  const themeIconDark = document.getElementById("theme-icon-dark");

  const defaultFavicon = "assets/img/favicon.ico";
  const activeFavicon = "assets/img/favicon-active.ico";

  // Theme management
  function getThemePreference() {
    const stored = localStorage.getItem("theme");
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.body.classList.toggle("dark", theme === "dark");
    // Update icons
    if (theme === "dark") {
      themeIconLight.classList.remove("hidden");
      themeIconDark.classList.add("hidden");
    } else {
      themeIconLight.classList.add("hidden");
      themeIconDark.classList.remove("hidden");
    }
    localStorage.setItem("theme", theme);
  }

  // Initialize theme
  applyTheme(getThemePreference());

  // Theme toggle event
  themeToggle.addEventListener("click", () => {
    const currentTheme = localStorage.getItem("theme") || getThemePreference();
    applyTheme(currentTheme === "dark" ? "light" : "dark");
  });

  // Load trackers from localStorage
  let trackers = JSON.parse(localStorage.getItem("trackers")) || [];

  function saveTrackers() {
    localStorage.setItem("trackers", JSON.stringify(trackers));
  }

  // Create tracker element using safe DOM methods (prevents XSS)
  function createTrackerElement(tracker, index) {
    const trackerElement = document.createElement("div");
    trackerElement.className =
      "tracker-card bg-white dark:bg-gray-800 p-4 rounded shadow transition";
    trackerElement.setAttribute("data-index", index);

    // Main container
    const mainDiv = document.createElement("div");
    mainDiv.className =
      "flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-2";

    // Comment input (safely set value)
    const commentInput = document.createElement("input");
    commentInput.type = "text";
    commentInput.id = `comment-${index}`;
    commentInput.value = tracker.comment; // Safe: value property doesn't execute HTML
    commentInput.placeholder = "Add a comment";
    commentInput.className =
      "comment-input border p-2 flex-1 rounded sm:mr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white";
    commentInput.setAttribute("data-index", index);
    commentInput.setAttribute("aria-label", "Tracker comment");

    // Buttons container
    const buttonsDiv = document.createElement("div");
    buttonsDiv.className =
      "flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mt-2 sm:mt-0";

    // Start/Stop button with static classes for TailwindCSS
    const startStopBtn = document.createElement("button");
    startStopBtn.className = `start-stop-btn px-6 py-3 sm:px-4 sm:py-2 text-white rounded transition ${
      tracker.running
        ? "bg-red-500 hover:bg-red-600"
        : "bg-green-500 hover:bg-green-600"
    }`;
    startStopBtn.setAttribute("data-index", index);
    startStopBtn.setAttribute(
      "aria-label",
      `${tracker.running ? "Stop" : "Start"} tracker`
    );
    startStopBtn.textContent = tracker.running ? "Stop" : "Start";

    // Restart button
    const restartBtn = document.createElement("button");
    restartBtn.className =
      "restart-btn px-6 py-3 sm:px-4 sm:py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition";
    restartBtn.setAttribute("data-index", index);
    restartBtn.setAttribute("aria-label", "Restart tracker");
    restartBtn.textContent = "Restart";

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className =
      "delete-btn px-6 py-3 sm:px-4 sm:py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition";
    deleteBtn.setAttribute("data-index", index);
    deleteBtn.setAttribute("aria-label", "Delete tracker");
    deleteBtn.textContent = "Delete";

    buttonsDiv.append(startStopBtn, restartBtn, deleteBtn);
    mainDiv.append(commentInput, buttonsDiv);

    // Tracked time section
    const elapsedDiv = document.createElement("div");
    elapsedDiv.className = "tracked-time-section";

    const elapsedLabel = document.createElement("label");
    elapsedLabel.htmlFor = `elapsed-time-${index}`;
    elapsedLabel.className = "inline-block mr-2 font-medium";
    elapsedLabel.textContent = "Tracked:";

    const elapsedInput = document.createElement("input");
    elapsedInput.type = "text";
    elapsedInput.id = `elapsed-time-${index}`;
    elapsedInput.className =
      "elapsed-time border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none dark:bg-gray-700 dark:border-gray-600 dark:text-white";
    elapsedInput.setAttribute("data-index", index);
    elapsedInput.value = formatTime(tracker.elapsed);
    elapsedInput.setAttribute("aria-label", "Elapsed time");

    elapsedDiv.append(elapsedLabel, elapsedInput);
    trackerElement.append(mainDiv, elapsedDiv);

    return trackerElement;
  }

  function renderTrackers() {
    trackerContainer.innerHTML = "";

    // Create array with original indices to maintain data integrity
    const trackersWithIndex = trackers.map((tracker, index) => ({
      tracker,
      originalIndex: index,
    }));

    // Sort: active (running) trackers first, then inactive
    trackersWithIndex.sort((a, b) => {
      if (a.tracker.running && !b.tracker.running) return -1;
      if (!a.tracker.running && b.tracker.running) return 1;
      return 0; // Keep relative order for same state
    });

    // Render sorted trackers
    trackersWithIndex.forEach(({ tracker, originalIndex }) => {
      const trackerElement = createTrackerElement(tracker, originalIndex);
      // Add visual indicator for running trackers
      if (tracker.running) {
        trackerElement.classList.add("ring-2", "ring-green-500");
      }
      trackerContainer.appendChild(trackerElement);
    });
  }

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function parseTime(timeStr) {
    const [hours, minutes, seconds] = timeStr.split(":").map(Number);
    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }

  function startTracker(index) {
    // Stop any other running tracker
    trackers.forEach((tracker, i) => {
      if (tracker.running && i !== index) {
        stopTracker(i);
      }
    });

    if (!trackers[index].running) {
      trackers[index].startTime = Date.now();
      trackers[index].running = true;

      // Add visual indication for running tracker
      const trackerElement = trackerContainer.querySelector(
        `[data-index="${index}"]`
      );
      trackerElement.classList.add("ring-2", "ring-green-500");

      updateTabTitle();
      saveTrackers();
      renderTrackers();
    }
  }

  function stopTracker(index) {
    if (trackers[index].running) {
      const elapsed = Date.now() - trackers[index].startTime;
      trackers[index].elapsed += elapsed;
      trackers[index].running = false;

      // Remove visual indication
      const trackerElement = trackerContainer.querySelector(
        `[data-index="${index}"]`
      );
      if (trackerElement) {
        trackerElement.classList.remove("ring-2", "ring-green-500");
      }

      updateTabTitle();
      saveTrackers();
      renderTrackers();
    }
  }

  function restartTracker(index) {
    trackers[index].elapsed = 0;
    trackers[index].startTime = Date.now();
    if (!trackers[index].running) {
      trackers[index].running = true;
    }
    updateTabTitle();
    saveTrackers();
    renderTrackers();
  }

  function deleteTracker(index) {
    // Add confirmation dialog
    if (confirm("Are you sure you want to delete this tracker?")) {
      trackers.splice(index, 1);
      updateTabTitle();
      saveTrackers();
      renderTrackers();
    }
  }

  function updateComment(index, comment) {
    trackers[index].comment = comment;
    saveTrackers();
  }

  function updateElapsedTime(index, timeStr) {
    const elapsedMs = parseTime(timeStr);
    if (!isNaN(elapsedMs)) {
      trackers[index].elapsed = elapsedMs;
      if (trackers[index].running) {
        trackers[index].startTime = Date.now();
      }
      saveTrackers();
      renderTrackers();
    }
  }

  function getCurrentDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, "0");
    const day = now.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function exportToCsv() {
    if (trackers.length === 0) {
      alert("No trackers to export!");
      return;
    }

    let csvContent =
      "data:text/csv;charset=utf-8,Comment,Elapsed Time (HH:MM:SS)\n";
    trackers.forEach((tracker) => {
      // Escape CSV values properly
      const escapedComment = `"${tracker.comment.replace(/"/g, '""')}"`;
      csvContent += `${escapedComment},${formatTime(tracker.elapsed)}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    const dateStr = getCurrentDateString();
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `watchy_trackers_${dateStr}.csv`);
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  }

  function exportToTxt() {
    if (trackers.length === 0) {
      alert("No trackers to export!");
      return;
    }

    let txtContent = "";
    trackers.forEach((tracker) => {
      txtContent += `Comment: ${tracker.comment}\nElapsed Time: ${formatTime(
        tracker.elapsed
      )}\n\n`;
    });

    const blob = new Blob([txtContent], { type: "text/plain" });
    const link = document.createElement("a");
    const dateStr = getCurrentDateString();
    link.href = URL.createObjectURL(blob);
    link.download = `watchy_trackers_${dateStr}.txt`;
    document.body.appendChild(link);

    link.click();
    document.body.removeChild(link);
  }

  function clearAllTrackers() {
    if (trackers.length === 0) {
      alert("No trackers to clear!");
      return;
    }

    if (
      confirm(
        "Are you sure you want to clear all trackers? This action cannot be undone."
      )
    ) {
      trackers = [];
      updateTabTitle();
      saveTrackers();
      renderTrackers();
    }
  }

  function updateTabTitle() {
    if (trackers.some((tracker) => tracker.running)) {
      document.title = "⏱️ Tracking... | Watchy";
      favicon.href = activeFavicon;
    } else {
      document.title = "Watchy - Time Tracker";
      favicon.href = defaultFavicon;
    }
  }

  // Event Listeners
  addTrackerButton.addEventListener("click", () => {
    trackers.push({
      comment: "",
      elapsed: 0,
      running: true,
      startTime: Date.now(),
    });
    saveTrackers();
    renderTrackers();
    updateTabTitle();
  });

  exportCsvButton.addEventListener("click", exportToCsv);
  exportTxtButton.addEventListener("click", exportToTxt);
  clearAllButton.addEventListener("click", clearAllTrackers);

  trackerContainer.addEventListener("click", (e) => {
    if (e.target.classList.contains("start-stop-btn")) {
      const index = e.target.getAttribute("data-index");
      if (trackers[index].running) {
        stopTracker(index);
      } else {
        startTracker(index);
      }
    } else if (e.target.classList.contains("restart-btn")) {
      const index = e.target.getAttribute("data-index");
      restartTracker(index);
    } else if (e.target.classList.contains("delete-btn")) {
      const index = e.target.getAttribute("data-index");
      deleteTracker(index);
    }
  });

  trackerContainer.addEventListener("input", (e) => {
    if (e.target.classList.contains("comment-input")) {
      const index = e.target.getAttribute("data-index");
      updateComment(index, e.target.value);
    } else if (e.target.classList.contains("elapsed-time")) {
      const index = e.target.getAttribute("data-index");
      updateElapsedTime(index, e.target.value);
    }
  });

  function updateElapsedTimes() {
    const elapsedTimeElements = document.querySelectorAll(".elapsed-time");
    elapsedTimeElements.forEach((el) => {
      const index = el.getAttribute("data-index");
      if (trackers[index] && trackers[index].running) {
        const elapsed =
          Date.now() - trackers[index].startTime + trackers[index].elapsed;
        el.value = formatTime(elapsed);
      }
    });
  }

  // Add keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    // Alt+N: Add new tracker
    if (e.altKey && e.key === "n") {
      e.preventDefault();
      addTrackerButton.click();
    }

    // Alt+E: Export CSV
    if (e.altKey && e.key === "e") {
      e.preventDefault();
      exportCsvButton.click();
    }
  });

  setInterval(updateElapsedTimes, 1000);

  renderTrackers();
  updateTabTitle();
});
