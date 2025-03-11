document.addEventListener("DOMContentLoaded", () => {
  const trackerContainer = document.getElementById("tracker");
  const addTrackerButton = document.getElementById("add-tracker");
  const exportCsvButton = document.getElementById("export-csv");
  const exportTxtButton = document.getElementById("export-txt");
  const clearAllButton = document.getElementById("clear-all");
  const favicon = document.getElementById("favicon");

  const defaultFavicon = "assets/img/favicon.ico";
  const activeFavicon = "assets/img/favicon-active.ico"; // Ensure you have this icon in your assets/img folder

  // Load trackers from localStorage
  let trackers = JSON.parse(localStorage.getItem("trackers")) || [];

  function saveTrackers() {
    localStorage.setItem("trackers", JSON.stringify(trackers));
  }

  function renderTrackers() {
    trackerContainer.innerHTML = "";
    trackers.forEach((tracker, index) => {
      const trackerElement = document.createElement("div");
      trackerElement.className = "bg-white p-4 rounded shadow transition";
      trackerElement.setAttribute("data-index", index);

      trackerElement.innerHTML = `
                <div class="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center justify-between mb-2">
                    <input type="text" value="${
                      tracker.comment
                    }" placeholder="Add a comment" 
                           class="comment-input border p-2 flex-1 rounded sm:mr-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" 
                           data-index="${index}" 
                           aria-label="Tracker comment" />
                    <div class="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0 mt-2 sm:mt-0">
                        <button class="start-stop-btn px-6 py-3 sm:px-4 sm:py-2 bg-${
                          tracker.running ? "red" : "green"
                        }-500 text-white rounded hover:bg-${
        tracker.running ? "red" : "green"
      }-600 transition" 
                                data-index="${index}"
                                aria-label="${
                                  tracker.running ? "Stop" : "Start"
                                } tracker">
                            ${tracker.running ? "Stop" : "Start"}
                        </button>
                        <button class="restart-btn px-6 py-3 sm:px-4 sm:py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition" 
                                data-index="${index}"
                                aria-label="Restart tracker">
                            Restart
                        </button>
                        <button class="delete-btn px-6 py-3 sm:px-4 sm:py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition" 
                                data-index="${index}"
                                aria-label="Delete tracker">
                            Delete
                        </button>
                    </div>
                </div>
                <div class="text-gray-700">
                    <label for="elapsed-time-${index}" class="inline-block mr-2">Elapsed Time:</label>
                    <input type="text" id="elapsed-time-${index}" class="elapsed-time border p-2 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none" 
                           data-index="${index}" 
                           value="${formatTime(tracker.elapsed)}" 
                           aria-label="Elapsed time" />
                </div>
            `;

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
