// Global variables
let rambuData = [];
let devicesData = {};
let currentPage = 1;
const itemsPerPage = 50;
let map = null;
let markers = [];
let rambuMarkers = [];

// GitHub configuration - GANTI DENGAN DATA ANDA!
const GITHUB_USER = 'cvr-gpiodev'; // GANTI!
const GITHUB_REPO = 'rambu-speedng'; // GANTI!
const GITHUB_TOKEN = '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'; // Dapatkan dari GitHub Settings -> Developer Settings
const GITHUB_API = 'https://api.github.com';

// Tab management
function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    
    // Add active class to clicked tab
    event.target.classList.add('active');
    
    // Load tab-specific data
    switch(tabName) {
        case 'dashboard':
            loadDashboard();
            break;
        case 'rambu':
            loadRambuData();
            break;
        case 'devices':
            loadDevices();
            break;
        case 'map':
            initMap();
            break;
        case 'updates':
            loadUpdateHistory();
            break;
    }
}

// Load dashboard data
async function loadDashboard() {
    try {
        // Load rambu data
        const rambuResponse = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/rambu-data.json`);
        const rambuJson = await rambuResponse.json();
        
        // Load version
        const versionResponse = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/version.txt`);
        const version = await versionResponse.text();

        // Update stats
        document.getElementById('totalRambu').textContent = rambuJson.rambu ? rambuJson.rambu.length : 0;
        document.getElementById('dataVersion').textContent = version.trim();
        document.getElementById('onlineDevices').textContent = '0'; // Static untuk GitHub
        document.getElementById('activeAlerts').textContent = '0'; // Static untuk GitHub

        // Load activity log
        loadActivityLog();

    } catch (error) {
        console.error('Error loading dashboard:', error);
        showNotification('Failed to load dashboard data', false);
    }
}

// Load rambu data from GitHub
async function loadRambuData() {
    try {
        const response = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/rambu-data.json`);
        const data = await response.json();
        rambuData = data.rambu || [];
        
        renderRambuTable();
        updatePagination();
        
    } catch (error) {
        console.error('Error loading rambu data:', error);
        showNotification('Failed to load rambu data', false);
        // Fallback: gunakan data default
        rambuData = [];
        renderRambuTable();
    }
}

// Render rambu table
function renderRambuTable() {
    const tableBody = document.querySelector('#rambuTable tbody');
    tableBody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, rambuData.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const rambu = rambuData[i];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${rambu.nama}</td>
            <td>${rambu.lon.toFixed(6)}</td>
            <td>${rambu.lat.toFixed(6)}</td>
            <td>${rambu.limit}</td>
            <td>${rambu.radius}</td>
            <td>${getJalurName(rambu.jalur)}</td>
            <td>${rambu.checkpoint}</td>
            <td>${rambu.enabled ? '✓' : '✗'}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" onclick="editRambu(${i})">Edit</button>
                <button class="action-btn toggle-btn" onclick="toggleRambu(${i})">${rambu.enabled ? 'Disable' : 'Enable'}</button>
                <button class="action-btn delete-btn" onclick="deleteRambu(${i})">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
}

function getJalurName(jalurCode) {
    switch(jalurCode) {
        case 0: return 'Muatan';
        case 1: return 'Kosongan';
        case 2: return 'Luar Area';
        default: return 'Unknown';
    }
}

// Update pagination
function updatePagination() {
    const totalPages = Math.ceil(rambuData.length / itemsPerPage);
    const paginationDiv = document.getElementById('pagination');
    
    let html = '';
    
    if (currentPage > 1) {
        html += `<button class="btn" onclick="changePage(${currentPage - 1})">Previous</button> `;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="btn btn-primary" style="margin: 0 5px;">${i}</button> `;
        } else {
            html += `<button class="btn" onclick="changePage(${i})" style="margin: 0 5px;">${i}</button> `;
        }
    }
    
    if (currentPage < totalPages) {
        html += `<button class="btn" onclick="changePage(${currentPage + 1})">Next</button>`;
    }
    
    paginationDiv.innerHTML = html;
}

function changePage(page) {
    currentPage = page;
    renderRambuTable();
    updatePagination();
}

function filterRambuTable() {
    const searchTerm = document.getElementById('searchRambu').value.toLowerCase();
    const filterJalur = document.getElementById('filterJalur').value;
    
    const filteredData = rambuData.filter(rambu => {
        const matchesSearch = rambu.nama.toLowerCase().includes(searchTerm) ||
                            rambu.lon.toString().includes(searchTerm) ||
                            rambu.lat.toString().includes(searchTerm);
        
        const matchesJalur = filterJalur === 'all' || rambu.jalur.toString() === filterJalur;
        
        return matchesSearch && matchesJalur;
    });
    
    // Create a temporary filtered array for display
    const tempData = [...filteredData];
    currentPage = 1;
    renderFilteredTable(tempData);
}

function renderFilteredTable(data) {
    const tableBody = document.querySelector('#rambuTable tbody');
    tableBody.innerHTML = '';
    
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, data.length);
    
    for (let i = startIndex; i < endIndex; i++) {
        const rambu = data[i];
        const row = document.createElement('tr');
        
        row.innerHTML = `
            <td>${i + 1}</td>
            <td>${rambu.nama}</td>
            <td>${rambu.lon.toFixed(6)}</td>
            <td>${rambu.lat.toFixed(6)}</td>
            <td>${rambu.limit}</td>
            <td>${rambu.radius}</td>
            <td>${getJalurName(rambu.jalur)}</td>
            <td>${rambu.checkpoint}</td>
            <td>${rambu.enabled ? '✓' : '✗'}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" onclick="editRambu(${rambuData.indexOf(rambu)})">Edit</button>
                <button class="action-btn toggle-btn" onclick="toggleRambu(${rambuData.indexOf(rambu)})">${rambu.enabled ? 'Disable' : 'Enable'}</button>
                <button class="action-btn delete-btn" onclick="deleteRambu(${rambuData.indexOf(rambu)})">Delete</button>
            </td>
        `;
        
        tableBody.appendChild(row);
    }
    
    updatePaginationForFiltered(data);
}

function updatePaginationForFiltered(data) {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    const paginationDiv = document.getElementById('pagination');
    
    let html = '';
    
    if (currentPage > 1) {
        html += `<button class="btn" onclick="changePageForFiltered(${currentPage - 1}, ${JSON.stringify(data)})">Previous</button> `;
    }
    
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage) {
            html += `<button class="btn btn-primary" style="margin: 0 5px;">${i}</button> `;
        } else {
            html += `<button class="btn" onclick="changePageForFiltered(${i}, ${JSON.stringify(data)})" style="margin: 0 5px;">${i}</button> `;
        }
    }
    
    if (currentPage < totalPages) {
        html += `<button class="btn" onclick="changePageForFiltered(${currentPage + 1}, ${JSON.stringify(data)})">Next</button>`;
    }
    
    paginationDiv.innerHTML = html;
}

function changePageForFiltered(page, data) {
    currentPage = page;
    renderFilteredTable(JSON.parse(data));
}

// Modal functions
function showAddRambuModal() {
    document.getElementById('modalTitle').textContent = 'Add New Rambu';
    document.getElementById('rambuIndex').value = '-1';
    document.getElementById('rambuForm').reset();
    document.getElementById('rambuJalur').value = '0';
    document.getElementById('rambuEnabled').value = 'true';
    document.getElementById('rambuCheckpoint').value = '1';
    document.getElementById('rambuModal').style.display = 'flex';
}

function editRambu(index) {
    const rambu = rambuData[index];
    
    document.getElementById('modalTitle').textContent = 'Edit Rambu';
    document.getElementById('rambuIndex').value = index;
    document.getElementById('rambuName').value = rambu.nama;
    document.getElementById('rambuLon').value = rambu.lon;
    document.getElementById('rambuLat').value = rambu.lat;
    document.getElementById('rambuLimit').value = rambu.limit;
    document.getElementById('rambuRadius').value = rambu.radius;
    document.getElementById('rambuJalur').value = rambu.jalur;
    document.getElementById('rambuCheckpoint').value = rambu.checkpoint;
    document.getElementById('rambuEnabled').value = rambu.enabled.toString();
    
    document.getElementById('rambuModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('rambuModal').style.display = 'none';
}

// Handle form submission
document.getElementById('rambuForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const index = parseInt(document.getElementById('rambuIndex').value);
    const isNew = index === -1;
    
    const rambu = {
        lon: parseFloat(document.getElementById('rambuLon').value),
        lat: parseFloat(document.getElementById('rambuLat').value),
        nama: document.getElementById('rambuName').value,
        limit: parseInt(document.getElementById('rambuLimit').value),
        radius: parseInt(document.getElementById('rambuRadius').value),
        jalur: parseInt(document.getElementById('rambuJalur').value),
        checkpoint: parseInt(document.getElementById('rambuCheckpoint').value),
        enabled: document.getElementById('rambuEnabled').value === 'true'
    };
    
    if (isNew) {
        rambuData.push(rambu);
    } else {
        rambuData[index] = rambu;
    }
    
    // Save to GitHub
    try {
        await saveRambuDataToGitHub();
        showNotification(`Rambu ${isNew ? 'added' : 'updated'} successfully!`);
        closeModal();
        renderRambuTable();
        updatePagination();
    } catch (error) {
        showNotification('Failed to save to GitHub', false);
        console.error(error);
    }
});

// Save rambu data to GitHub
async function saveRambuDataToGitHub() {
    // First, get the current SHA of the file
    const getResponse = await fetch(`${GITHUB_API}/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/rambu-data.json`, {
        headers: { 
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    if (!getResponse.ok) {
        throw new Error('Failed to get file info from GitHub');
    }
    
    const getData = await getResponse.json();
    const sha = getData.sha;
    
    // Prepare update data
    const updateData = {
        rambu: rambuData,
        last_updated: new Date().toISOString(),
        total_count: rambuData.length
    };
    
    const content = btoa(JSON.stringify(updateData, null, 2));
    
    // Update file
    const updateResponse = await fetch(`${GITHUB_API}/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/rambu-data.json`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: 'Update rambu data via admin dashboard',
            content: content,
            sha: sha
        })
    });
    
    if (!updateResponse.ok) {
        throw new Error('Failed to update GitHub');
    }
    
    // Update version
    await updateVersion();
}

async function updateVersion() {
    // Get current version
    const versionResponse = await fetch(`${GITHUB_API}/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/version.txt`, {
        headers: { 
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json'
        }
    });
    
    const versionData = await versionResponse.json();
    const sha = versionData.sha;
    const currentVersion = parseInt(atob(versionData.content)) || 1;
    const newVersion = currentVersion + 1;
    
    // Update version file
    await fetch(`${GITHUB_API}/repos/${GITHUB_USER}/${GITHUB_REPO}/contents/version.txt`, {
        method: 'PUT',
        headers: {
            'Authorization': `token ${GITHUB_TOKEN}`,
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            message: `Update to version ${newVersion}`,
            content: btoa(String(newVersion)),
            sha: sha
        })
    });
}

async function toggleRambu(index) {
    rambuData[index].enabled = !rambuData[index].enabled;
    
    try {
        await saveRambuDataToGitHub();
        showNotification(`Rambu ${rambuData[index].enabled ? 'enabled' : 'disabled'} successfully!`);
        renderRambuTable();
    } catch (error) {
        showNotification('Failed to update rambu', false);
        console.error(error);
    }
}

async function deleteRambu(index) {
    if (!confirm(`Are you sure you want to delete "${rambuData[index].nama}"?`)) {
        return;
    }
    
    rambuData.splice(index, 1);
    
    try {
        await saveRambuDataToGitHub();
        showNotification('Rambu deleted successfully!');
        loadRambuData(); // Reload data
    } catch (error) {
        showNotification('Failed to delete rambu', false);
        console.error(error);
    }
}

// Load devices (static for GitHub)
async function loadDevices() {
    try {
        const devicesGrid = document.getElementById('devicesGrid');
        devicesGrid.innerHTML = '';
        
        // Static devices for demo
        const staticDevices = [
            { id: 'TRUCK_001', status: 'Online', lastSeen: '2024-01-28 10:30:00', location: '117.493890, -2.153491', speed: 45, overspeed: false },
            { id: 'TRUCK_002', status: 'Online', lastSeen: '2024-01-28 10:25:00', location: '117.494247, -2.156647', speed: 32, overspeed: false },
            { id: 'TRUCK_003', status: 'Offline', lastSeen: '2024-01-28 09:45:00', location: 'N/A', speed: 0, overspeed: false },
            { id: 'TRUCK_004', status: 'Online', lastSeen: '2024-01-28 10:28:00', location: '117.493704, -2.156030', speed: 55, overspeed: true },
        ];
        
        staticDevices.forEach(device => {
            const card = document.createElement('div');
            card.className = `device-card ${device.status.toLowerCase()}`;
            
            card.innerHTML = `
                <h3>${device.id}</h3>
                <div class="device-info">
                    <span>Status: <strong>${device.status}</strong></span>
                    <span>Last Seen: ${device.lastSeen}</span>
                    <span>Location: ${device.location}</span>
                    <span>Speed: ${device.speed} km/h</span>
                    <span>Overspeed: ${device.overspeed ? '⚠️ YES' : '✓ No'}</span>
                </div>
            `;
            
            devicesGrid.appendChild(card);
        });
        
    } catch (error) {
        console.error('Error loading devices:', error);
        showNotification('Failed to load devices data', false);
    }
}

// Initialize map
function initMap() {
    if (!map) {
        map = L.map('map').setView([-2.15, 117.49], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
    }
    
    // Clear existing markers
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    
    rambuMarkers.forEach(marker => map.removeLayer(marker));
    rambuMarkers = [];
    
    // Add rambu markers
    rambuData.forEach(rambu => {
        if (rambu.enabled) {
            const rambuMarker = L.marker([rambu.lat, rambu.lon])
                .bindPopup(`
                    <strong>${rambu.nama}</strong><br>
                    Limit: ${rambu.limit} km/h<br>
                    Radius: ${rambu.radius} m<br>
                    Jalur: ${getJalurName(rambu.jalur)}<br>
                    Checkpoint: ${rambu.checkpoint}
                `);
            
            rambuMarkers.push(rambuMarker);
            rambuMarker.addTo(map);
        }
    });
    
    // Add static device markers for demo
    const staticDevices = [
        { id: 'TRUCK_001', lat: -2.153491, lon: 117.493890, speed: 45, overspeed: false },
        { id: 'TRUCK_002', lat: -2.156647, lon: 117.494247, speed: 32, overspeed: false },
        { id: 'TRUCK_004', lat: -2.156030, lon: 117.493704, speed: 55, overspeed: true },
    ];
    
    staticDevices.forEach(device => {
        const color = device.overspeed ? '#f39c12' : '#2ecc71';
        
        const deviceMarker = L.marker([device.lat, device.lon], {
            icon: L.divIcon({
                className: 'device-marker',
                html: `<div style="background: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
                iconSize: [24, 24]
            })
        }).bindPopup(`
            <strong>${device.id}</strong><br>
            Speed: ${device.speed} km/h<br>
            Status: ${device.overspeed ? '⚠️ OVERSPEED' : 'Normal'}
        `);
        
        markers.push(deviceMarker);
        deviceMarker.addTo(map);
    });
    
    document.getElementById('mapLastUpdate').textContent = new Date().toLocaleTimeString();
}

function refreshMap() {
    if (map) {
        initMap();
    }
}

function centerMap() {
    if (map && rambuMarkers.length > 0) {
        const bounds = L.latLngBounds(rambuMarkers.map(m => m.getLatLng()));
        map.fitBounds(bounds);
    }
}

// Import/Export functions
function showImportModal() {
    document.getElementById('importData').value = '';
    document.getElementById('importModal').style.display = 'flex';
}

function closeImportModal() {
    document.getElementById('importModal').style.display = 'none';
}

async function processImport() {
    const csvData = document.getElementById('importData').value.trim();
    
    if (!csvData) {
        showNotification('Please enter CSV data', false);
        return;
    }
    
    const lines = csvData.split('\n');
    const importedRambu = [];
    
    // Skip header if present
    const startIndex = lines[0].includes('lon,lat') ? 1 : 0;
    
    for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const fields = line.split(',');
        if (fields.length >= 6) {
            const rambu = {
                lon: parseFloat(fields[0]),
                lat: parseFloat(fields[1]),
                nama: fields[2],
                limit: parseInt(fields[3]),
                radius: parseInt(fields[4]),
                jalur: parseInt(fields[5]),
                checkpoint: fields.length > 6 ? parseInt(fields[6]) : 0,
                enabled: fields.length > 7 ? (fields[7] === '1' || fields[7].toLowerCase() === 'true') : true
            };
            
            importedRambu.push(rambu);
        }
    }
    
    if (importedRambu.length > 0) {
        // Replace existing data with imported data
        rambuData = importedRambu;
        
        try {
            await saveRambuDataToGitHub();
            showNotification(`Imported ${importedRambu.length} rambu successfully!`);
            closeImportModal();
            loadRambuData();
        } catch (error) {
            showNotification('Failed to save imported data', false);
            console.error(error);
        }
    } else {
        showNotification('No valid data found in CSV', false);
    }
}

function exportAllData() {
    const data = {
        rambu: rambuData,
        exported_at: new Date().toISOString(),
        total_count: rambuData.length
    };
    
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `rambu_data_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Data exported successfully!');
}

// Update functions
async function createNewVersion() {
    const message = document.getElementById('updateMessage').value.trim();
    if (!message) {
        showNotification('Please enter an update message', false);
        return;
    }
    
    try {
        await updateVersion();
        showNotification(`New version created! All devices will update on next check.`);
        document.getElementById('updateMessage').value = '';
        loadUpdateHistory();
        
    } catch (error) {
        showNotification('Failed to create new version', false);
        console.error(error);
    }
}

async function loadUpdateHistory() {
    try {
        const updateHistoryDiv = document.getElementById('updateHistory');
        updateHistoryDiv.innerHTML = '';
        
        // Get version from GitHub
        const versionResponse = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/version.txt`);
        const currentVersion = await versionResponse.text();
        
        // Get rambu data for last update info
        const rambuResponse = await fetch(`https://raw.githubusercontent.com/${GITHUB_USER}/${GITHUB_REPO}/main/rambu-data.json`);
        const rambuData = await rambuResponse.json();
        
        // Create update log entry
        const updateDiv = document.createElement('div');
        updateDiv.style.padding = '10px';
        updateDiv.style.borderBottom = '1px solid #ddd';
        updateDiv.style.marginBottom = '5px';
        
        updateDiv.innerHTML = `
            <strong>Version ${currentVersion.trim()}</strong><br>
            <small>${rambuData.last_updated ? new Date(rambuData.last_updated).toLocaleString() : new Date().toLocaleString()}</small><br>
            Rambu: ${rambuData.total_count || rambuData.rambu?.length || 0}<br>
            <small>Updated via GitHub Dashboard</small>
        `;
        
        updateHistoryDiv.appendChild(updateDiv);
        
    } catch (error) {
        console.error('Error loading update history:', error);
        document.getElementById('updateHistory').innerHTML = 'Failed to load update history';
    }
}

// Utility functions
function showNotification(message, isSuccess = true) {
    // Create notification element
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.padding = '15px 20px';
    notification.style.backgroundColor = isSuccess ? '#2ecc71' : '#e74c3c';
    notification.style.color = 'white';
    notification.style.borderRadius = '5px';
    notification.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
    notification.style.zIndex = '1000';
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}

function refreshAllData() {
    loadDashboard();
    loadRambuData();
    loadDevices();
    if (map) initMap();
    showNotification('All data refreshed!');
}

function refreshDevices() {
    loadDevices();
    showNotification('Devices refreshed!');
}

async function loadActivityLog() {
    try {
        const activityLog = document.getElementById('activityLog');
        activityLog.innerHTML = '';
        
        // Static activity log for GitHub
        const activities = [
            { time: '10:30:00', device: 'TRUCK_001', action: 'Entered RANGGA_MUATAN area' },
            { time: '10:28:00', device: 'TRUCK_004', action: '⚠️ OVERSPEED in SIMPANG3_MUATAN' },
            { time: '10:25:00', device: 'TRUCK_002', action: 'Exited KEMAS_MUATAN area' },
            { time: '10:20:00', device: 'SYSTEM', action: 'Data updated to version 2' },
            { time: '10:15:00', device: 'TRUCK_003', action: 'Went offline' },
        ];
        
        activities.forEach(activity => {
            const activityDiv = document.createElement('div');
            activityDiv.style.padding = '5px 0';
            activityDiv.style.borderBottom = '1px solid #eee';
            
            activityDiv.innerHTML = `
                <strong>${activity.device}</strong>: ${activity.action}
                <small style="float: right;">${activity.time}</small>
            `;
            
            activityLog.appendChild(activityDiv);
        });
        
    } catch (error) {
        console.error('Error loading activity log:', error);
        document.getElementById('activityLog').innerHTML = 'Failed to load activity log';
    }
}

function pushUpdateToAll() {
    if (!confirm('This will force all devices to check for updates. Continue?')) {
        return;
    }
    
    showNotification('Pushing update notification to all devices...');
    createNewVersion();
}

function sendMessageToDevice(deviceId) {
    const message = prompt(`Enter message for ${deviceId}:`);
    if (!message) return;
    
    showNotification(`Message sent to ${deviceId}: ${message}`);
}

function sendBroadcastMessage() {
    const message = prompt('Enter broadcast message for all devices:');
    if (!message) return;
    
    showNotification(`Broadcast message sent to all devices: ${message}`);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Load initial data
    loadDashboard();
    loadRambuData();
    loadDevices();
    
    // Set up periodic refresh for dashboard
    setInterval(() => {
        if (document.getElementById('dashboardTab').classList.contains('active')) {
            loadDashboard();
        }
    }, 30000); // Refresh every 30 seconds
    
    // Set up periodic refresh for devices
    setInterval(() => {
        if (document.getElementById('devicesTab').classList.contains('active')) {
            loadDevices();
        }
    }, 10000); // Refresh every 10 seconds
});

// Close modals when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        closeModal();
        closeImportModal();
    }
};