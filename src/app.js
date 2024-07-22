document.addEventListener('DOMContentLoaded', () => {
    const trackerContainer = document.getElementById('tracker');
    const addTrackerButton = document.getElementById('add-tracker');
    const exportCsvButton = document.getElementById('export-csv');
    const exportTxtButton = document.getElementById('export-txt');
    const clearAllButton = document.getElementById('clear-all');
    const favicon = document.getElementById('favicon');

    const defaultFavicon = 'src/img/favicon.ico';
    const activeFavicon = 'src/img/favicon-active.ico'; // Ensure you have this icon in your src/img folder

    // Load trackers from localStorage
    let trackers = JSON.parse(localStorage.getItem('trackers')) || [];

    function saveTrackers() {
        localStorage.setItem('trackers', JSON.stringify(trackers));
    }

    function renderTrackers() {
        trackerContainer.innerHTML = '';
        trackers.forEach((tracker, index) => {
            const trackerElement = document.createElement('div');
            trackerElement.className = 'bg-white p-4 rounded shadow';

            trackerElement.innerHTML = `
                <div class="flex justify-between items-center mb-2">
                    <input type="text" value="${tracker.comment}" placeholder="Add a comment" class="comment-input border p-2 flex-1 mr-2 rounded" data-index="${index}" />
                    <button class="start-stop-btn px-2 py-1 bg-${tracker.running ? 'red' : 'green'}-500 text-white rounded" data-index="${index}">${tracker.running ? 'Stop' : 'Start'}</button>
                    <button class="restart-btn px-2 py-1 bg-yellow-500 text-white rounded ml-2" data-index="${index}">Restart</button>
                    <button class="delete-btn px-2 py-1 bg-gray-500 text-white rounded ml-2" data-index="${index}">Delete</button>
                </div>
                <div class="text-gray-700">Elapsed Time: <span class="elapsed-time" data-index="${index}">${formatTime(tracker.elapsed)}</span></div>
            `;

            trackerContainer.appendChild(trackerElement);
        });
    }

    function formatTime(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
        trackers.splice(index, 1);
        updateTabTitle();
        saveTrackers();
        renderTrackers();
    }

    function updateComment(index, comment) {
        trackers[index].comment = comment;
        saveTrackers();
    }

    function getCurrentDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function exportToCsv() {
        let csvContent = "data:text/csv;charset=utf-8,Comment,Elapsed Time (HH:MM:SS)\n";
        trackers.forEach(tracker => {
            csvContent += `${tracker.comment},${formatTime(tracker.elapsed)}\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        const dateStr = getCurrentDateString();
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `trackers_${dateStr}.csv`);
        document.body.appendChild(link);

        link.click();
        document.body.removeChild(link);
    }

    function exportToTxt() {
        let txtContent = "";
        trackers.forEach(tracker => {
            txtContent += `Comment: ${tracker.comment}\nElapsed Time: ${formatTime(tracker.elapsed)}\n\n`;
        });

        const blob = new Blob([txtContent], { type: 'text/plain' });
        const link = document.createElement('a');
        const dateStr = getCurrentDateString();
        link.href = URL.createObjectURL(blob);
        link.download = `trackers_${dateStr}.txt`;
        document.body.appendChild(link);

        link.click();
        document.body.removeChild(link);
    }

    function clearAllTrackers() {
        trackers = [];
        updateTabTitle();
        saveTrackers();
        renderTrackers();
    }

    function updateTabTitle() {
        if (trackers.some(tracker => tracker.running)) {
            document.title = "Tracker Running...";
            favicon.href = activeFavicon;
        } else {
            document.title = "Time Tracker";
            favicon.href = defaultFavicon;
        }
    }

    addTrackerButton.addEventListener('click', () => {
        trackers.push({ comment: '', elapsed: 0, running: false });
        saveTrackers();
        renderTrackers();
    });

    exportCsvButton.addEventListener('click', exportToCsv);
    exportTxtButton.addEventListener('click', exportToTxt);
    clearAllButton.addEventListener('click', clearAllTrackers);

    trackerContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('start-stop-btn')) {
            const index = e.target.getAttribute('data-index');
            if (trackers[index].running) {
                stopTracker(index);
            } else {
                startTracker(index);
            }
        } else if (e.target.classList.contains('restart-btn')) {
            const index = e.target.getAttribute('data-index');
            restartTracker(index);
        } else if (e.target.classList.contains('delete-btn')) {
            const index = e.target.getAttribute('data-index');
            deleteTracker(index);
        }
    });

    trackerContainer.addEventListener('input', (e) => {
        if (e.target.classList.contains('comment-input')) {
            const index = e.target.getAttribute('data-index');
            updateComment(index, e.target.value);
        }
    });

    function updateElapsedTimes() {
        const elapsedTimeElements = document.querySelectorAll('.elapsed-time');
        elapsedTimeElements.forEach(el => {
            const index = el.getAttribute('data-index');
            if (trackers[index].running) {
                const elapsed = Date.now() - trackers[index].startTime + trackers[index].elapsed;
                el.textContent = formatTime(elapsed);
            }
        });
    }

    setInterval(updateElapsedTimes, 1000);

    renderTrackers();
    updateTabTitle();
});