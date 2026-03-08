const API_BASE = 'https://phi-lab-server.vercel.app/api/v1/lab';
let currentTab = 'all';
let allIssues = [];
let filteredIssues = [];

const loginPage = document.getElementById('loginPage');
const mainPage = document.getElementById('mainPage');
const loginForm = document.getElementById('loginForm');
const issuesGrid = document.getElementById('issuesGrid');
const loadingSpinner = document.getElementById('loadingSpinner');
const searchInput = document.getElementById('searchInput');
const searchButton = document.getElementById('searchButton');
const issueCount = document.getElementById('issueCount');
const openCount = document.getElementById('openCount');
const closedCount = document.getElementById('closedCount');
const tabAll = document.getElementById('tabAll');
const tabOpen = document.getElementById('tabOpen');
const tabClosed = document.getElementById('tabClosed');
const issueModal = document.getElementById('issueModal');
const modalContent = document.getElementById('modalContent');

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (username === 'admin' && password === 'admin123') {
        loginPage.classList.add('hidden');
        mainPage.classList.remove('hidden');
        fetch(`${API_BASE}/issues`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    allIssues = data.data;
                    filterIssuesByTab();
                }
            })
            .catch(error => {
                console.error('Error fetching issues:', error);
                alert('Failed to fetch issues. Please try again.');
            });
    } else {
        alert('Invalid credentials! Use admin/admin123');
    }
});

function filterIssuesByTab() {
    if (currentTab === 'all') {
        filteredIssues = allIssues;
    } else if (currentTab === 'open') {
        filteredIssues = allIssues.filter(issue => issue.status === 'open');
    } else {
        filteredIssues = allIssues.filter(issue => issue.status === 'closed');
    }
    
    updateCounts();
    renderIssues(filteredIssues);
    updateActiveTab();
}

function updateCounts() {
    const open = allIssues.filter(i => i.status === 'open').length;
    const closed = allIssues.filter(i => i.status === 'closed').length;
    
    issueCount.textContent = `${allIssues.length} Issues`;
    openCount.textContent = open;
    closedCount.textContent = closed;
}

function renderIssues(issues) {
    if (issues.length === 0) {
        issuesGrid.innerHTML = `
            <div class="col-span-full text-center py-20">
                <div class="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                    <i class="fa-regular fa-file-lines text-gray-400 text-4xl"></i>
                </div>
                <p class="text-gray-500 text-lg">No issues found</p>
                <p class="text-gray-400 text-sm mt-1">Try adjusting your search or filter</p>
            </div>
        `;
        return;
    }

    issuesGrid.innerHTML = issues.map(issue => {
        const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        }).replace(/\//g, '/');
        
        const assigneeName = issue.assignee || issue.author || 'Asif Hossien';
        
        return `
            <div class="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer hover-lift card-shine ${issue.status === 'open' ? 'card-open' : 'card-closed'}" data-issue-id="${issue.id}">
                <div class="p-5">
                    <div class="text-right py-2">
                        <span class="text-sm font-bold ${issue.priority === 'high' ? 'bg-red-100 text-red-600 py-2 px-3 rounded-2xl shadow-md' : issue.priority === 'medium' ? 'bg-yellow-100 text-yellow-600 py-2 px-3 rounded-2xl shadow-md' : 'bg-gray-100 text-gray-600 py-2 px-3 rounded-2xl shadow-md'}">
                            ${issue.priority ? issue.priority.toUpperCase() : 'MEDIUM'}
                        </span>
                    </div>
                    <h3 class="text-lg font-semibold text-gray-900 mb-3 hover:text-gradient transition-colors">
                        ${issue.title}
                    </h3>
                    <div class="flex flex-wrap gap-3 mb-3">
                        ${issue.labels.map(label => {
                            const labelLower = label.toLowerCase();
                            if (labelLower === 'bug') {
                                return `<span class="flex items-center gap-1 text-sm font-bold bg-red-100 text-red-600 py-2 px-3 rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-105"><i class="fa-solid fa-bug"></i> ${label.toUpperCase()}</span>`;
                            } else if (labelLower === 'help wanted') {
                                return `<span class="flex items-center gap-1 text-sm font-bold bg-yellow-100 text-yellow-600 py-2 px-3 rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-105"><i class="fa-solid fa-life-ring"></i> ${label.toUpperCase()}</span>`;
                            } else {
                                return `<span class="flex items-center gap-1 text-s font-bold bg-gray-100 text-gray-600 py-2 px-3 rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-105">${label.toUpperCase()}</span>`;
                            }
                        }).join('')}
                    </div>
                    
                    <p class="text-sm text-gray-600 mb-4 line-clamp-2">${issue.description}</p>
                    
                    <hr class="border-gray-200 mb-4">
                    
                    <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                            <i class="fa-regular fa-circle-user text-gray-400"></i>
                            <span class="text-sm font-medium text-gray-900">#${issue.id} by ${assigneeName}</span>
                        </div>
                        <span class="text-xs text-gray-500 flex items-center gap-1 mt-1">
                            <i class="fa-regular fa-calendar"></i>
                            ${formattedDate}
                        </span>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    document.querySelectorAll('[data-issue-id]').forEach(card => {
        card.addEventListener('click', function(e) {
            e.preventDefault();
            const issueId = this.getAttribute('data-issue-id');
            openIssueModal(issueId);
        });
    });
}

window.openIssueModal = function(issueId) {
    showLoading(true);
    fetch(`${API_BASE}/issue/${issueId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                const issue = data.data;
                
                const formattedDate = new Date(issue.createdAt).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }).replace(/\//g, '/');
                
                const assigneeName = issue.assignee || 'Asif Hossien';
                const priorityValue = issue.priority ? issue.priority.toUpperCase() : 'HIGH';
                
                modalContent.innerHTML = `
                    <div class="space-y-6">
                        <div class="flex justify-between items-start">
                            <h2 class="text-xl sm:text-2xl font-bold text-gradient">${issue.title}</h2>
                            <button onclick="closeModal()" class="text-gray-400 hover:text-gray-600 transition w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center">
                                <i class="fa-regular fa-circle-xmark text-xl"></i>
                            </button>
                        </div>
                        <div class="flex flex-wrap items-center text-xs sm:text-sm text-gray-600 gap-2 bg-gray-50 p-3 rounded-lg">
                            <span class="font-medium bg-gradient-to-r from-green-500 to-green-600 rounded-full text-white px-3 py-1 shadow-md">Opened</span>
                            <span class="mx-1">•</span>
                            <span><i class="fa-regular fa-user mr-1"></i>${issue.author}</span>
                            <span class="mx-1">•</span>
                            <span><i class="fa-regular fa-calendar mr-1"></i>${formattedDate}</span>
                        </div>
                        <div class="flex flex-wrap gap-3">
                            ${issue.labels.map(label => {
                                const labelLower = label.toLowerCase();
                                if (labelLower === 'bug') {
                                    return `<span class="flex items-center gap-1 text-sm font-bold bg-red-100 text-red-600 py-2 px-3 rounded-2xl shadow-sm"><i class="fa-solid fa-bug"></i> ${label.toUpperCase()}</span>`;
                                } else if (labelLower === 'help wanted') {
                                    return `<span class="flex items-center gap-1 text-sm font-bold bg-yellow-100 text-yellow-600 py-2 px-3 rounded-2xl shadow-sm"><i class="fa-solid fa-life-ring"></i> ${label.toUpperCase()}</span>`;
                                } else {
                                    return `<span class="flex items-center gap-1 text-s font-bold bg-gray-100 text-gray-600 py-2 px-3 rounded-2xl shadow-sm"> ${label.toUpperCase()}</span>`;
                                }
                            }).join('')}
                        </div>
                        <p class="text-sm sm:text-base text-gray-700 bg-gray-50 p-4 rounded-lg">${issue.description}</p>
                        <hr class="border-gray-200">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
                                <p class="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                    <i class="fa-regular fa-user-circle"></i>
                                    Assignee:
                                </p>
                                <p class="text-base sm:text-lg font-semibold text-gray-900">${assigneeName}</p>
                            </div>
                            <div class="bg-gradient-to-br from-gray-50 to-gray-100 p-4 rounded-lg">
                                <p class="text-sm font-medium text-gray-500 mb-1 flex items-center gap-2">
                                    <i class="fa-regular fa-flag"></i>
                                    Priority:
                                </p>
                                <p class="text-sm text-white py-2 px-3 rounded-2xl font-bold inline-block ${issue.priority === 'high' ? 'bg-gradient-to-r from-red-500 to-red-600' : issue.priority === 'medium' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' : 'bg-gradient-to-r from-green-500 to-green-600'} shadow-md">${priorityValue}</p>
                            </div>
                        </div>
                    </div>
                `;
                issueModal.classList.remove('hidden');
            }
            showLoading(false);
        })
        .catch(error => {
            console.error('Error fetching issue details:', error);
            alert('Failed to fetch issue details.');
            showLoading(false);
        });
};

window.closeModal = function() {
    issueModal.classList.add('hidden');
};

searchButton.addEventListener('click', () => {
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm.length === 0) {
        filterIssuesByTab();
        return;
    }

    showLoading(true);
    fetch(`${API_BASE}/issues/search?q=${encodeURIComponent(searchTerm)}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                let searchResults = data.data;
                if (currentTab === 'open') {
                    searchResults = searchResults.filter(issue => issue.status === 'open');
                } else if (currentTab === 'closed') {
                    searchResults = searchResults.filter(issue => issue.status === 'closed');
                }
                renderIssues(searchResults);
            }
            showLoading(false);
        })
        .catch(error => {
            console.error('Search error:', error);
            showLoading(false);
        });
});
searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchButton.click();
    }
});
tabAll.addEventListener('click', () => {
    currentTab = 'all';
    filterIssuesByTab();
});
tabOpen.addEventListener('click', () => {
    currentTab = 'open';
    filterIssuesByTab();
});
tabClosed.addEventListener('click', () => {
    currentTab = 'closed';
    filterIssuesByTab();
});
function updateActiveTab() {
    [tabAll, tabOpen, tabClosed].forEach(tab => {
        tab.classList.remove('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white', 'border-blue-600', 'shadow-md');
        tab.classList.add('bg-transparent', 'text-gray-500', 'border-transparent');
    });
    if (currentTab === 'all') {
        tabAll.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white', 'border-blue-600', 'shadow-md');
        tabAll.classList.remove('bg-transparent', 'text-gray-500', 'border-transparent');
    } else if (currentTab === 'open') {
        tabOpen.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white', 'border-blue-600', 'shadow-md');
        tabOpen.classList.remove('bg-transparent', 'text-gray-500', 'border-transparent');
    } else {
        tabClosed.classList.add('bg-gradient-to-r', 'from-blue-600', 'to-purple-600', 'text-white', 'border-blue-600', 'shadow-md');
        tabClosed.classList.remove('bg-transparent', 'text-gray-500', 'border-transparent');
    }
}
function showLoading(show) {
    if (show) {
        loadingSpinner.classList.remove('hidden');
        issuesGrid.classList.add('hidden');
    } else {
        loadingSpinner.classList.add('hidden');
        issuesGrid.classList.remove('hidden');
    }
}
window.onclick = function(event) {
    if (event.target.classList.contains('modal-overlay')) {
        closeModal();
    }
};