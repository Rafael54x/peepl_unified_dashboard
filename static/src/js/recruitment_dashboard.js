/** @odoo-module **/

import { Component, useState, onWillStart, onMounted, useRef } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";
import { loadJS } from "@web/core/assets";

class RecruitmentDashboard extends Component {
    static template = "peepl_unified_dashboard.RecruitmentDashboard";

    setup() {
        this.orm = useService("orm");
        this.phaseChartRef = useRef("phaseChart");
        this.statusChartRef = useRef("statusChart");
        this.phaseColors = [
            '#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', 
            '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'
        ];
        this.statusColors = [
            '#17a2b8', '#28a745', '#ffc107', '#dc3545'
        ];
        this.state = useState({
            loading: true,
            stats: { total: 0, assessed: 0, onProgress: 0, failed: 0 },
            phaseData: [],
            statusData: [],
            recentCandidates: [],
            filteredCandidates: [],
            customFields: [],
            searchText: '',
            sortField: '',
            sortDirection: 'asc',
            pagination: { currentPage: 1, itemsPerPage: 10, totalItems: 0 },
            filters: { phase: 'all', decision: 'all', month: 'all' }
        });

        onWillStart(async () => {
            await loadJS("/web/static/lib/Chart/Chart.js");
            await this.loadData();
        });

        onMounted(() => {
            this.renderCharts();
        });
    }

    async loadData() {
        this.state.loading = true;
        try {
            // Get custom fields
            const customFields = await this.orm.searchRead(
                "recruitment.custom.field",
                [["active", "=", true]],
                ["name", "field_type"],
                { order: "sequence" }
            );
            
            // Build field list dynamically
            const baseFields = ["partner_name", "email_from", "job_id", "stage_id", "recruitment_phase", "hire_decision", 
                 "applicant_notes", "create_date", "last_test"];
            
            const customFieldNames = customFields.map(f => `x_field${f.id}_value`);
            const allFields = [...baseFields, ...customFieldNames];
            
            this.state.customFields = customFields;

            const candidates = await this.orm.searchRead(
                "hr.applicant",
                [],
                allFields
            );

            this.updateStats(candidates);
            this.updateChartData(candidates);
            this.state.recentCandidates = candidates;
            this.filterCandidates();
        } catch (error) {
            console.error("Error loading dashboard data:", error);
        } finally {
            this.state.loading = false;
        }
    }

    getDomainFilters() {
        let domain = [];
        if (this.state.filters.phase !== 'all') {
            domain.push(["recruitment_phase", "=", this.state.filters.phase]);
        }
        if (this.state.filters.decision !== 'all') {
            domain.push(["hire_decision", "=", this.state.filters.decision]);
        }
        if (this.state.filters.month !== 'all') {
            const [year, month] = this.state.filters.month.split('-');
            const startDate = `${year}-${month}-01`;
            const endDate = new Date(year, month, 0).toISOString().split('T')[0];
            domain.push(["last_test", ">=", startDate]);
            domain.push(["last_test", "<=", endDate]);
        }
        return domain;
    }

    updateStats(candidates) {
        this.state.stats = {
            total: candidates.length,
            assessed: candidates.filter(c => c.last_test).length,
            onProgress: candidates.filter(c => c.hire_decision !== 'do_not_pursue').length,
            failed: candidates.filter(c => c.hire_decision === 'do_not_pursue').length
        };
    }

    filterCandidates() {
        let filtered = this.state.recentCandidates;
        
        if (this.state.searchText) {
            const search = this.state.searchText.toLowerCase();
            filtered = filtered.filter(c => 
                (c.partner_name && c.partner_name.toLowerCase().includes(search)) ||
                (c.email_from && c.email_from.toLowerCase().includes(search))
            );
        }
        
        if (this.state.filters.phase !== 'all') {
            const phaseId = parseInt(this.state.filters.phase);
            filtered = filtered.filter(c => c.stage_id && c.stage_id[0] === phaseId);
        }
        
        if (this.state.filters.decision !== 'all') {
            filtered = filtered.filter(c => c.hire_decision === this.state.filters.decision);
        }
        
        if (this.state.filters.month !== 'all') {
            const [year, month] = this.state.filters.month.split('-');
            filtered = filtered.filter(c => {
                if (!c.last_test) return false;
                const testDate = new Date(c.last_test);
                return testDate.getFullYear() === parseInt(year) && testDate.getMonth() + 1 === parseInt(month);
            });
        }
        
        this.state.filteredCandidates = filtered;
        this.state.pagination.totalItems = filtered.length;
        this.state.pagination.currentPage = 1;
        
        if (this.state.sortField) {
            this.state.filteredCandidates.sort((a, b) => {
                let aVal = a[this.state.sortField] || '';
                let bVal = b[this.state.sortField] || '';
                
                if (aVal < bVal) return this.state.sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return this.state.sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }
    }

    getPaginatedCandidates() {
        const start = (this.state.pagination.currentPage - 1) * this.state.pagination.itemsPerPage;
        const end = start + this.state.pagination.itemsPerPage;
        return this.state.filteredCandidates.slice(start, end);
    }

    getTotalPages() {
        return Math.ceil(this.state.pagination.totalItems / this.state.pagination.itemsPerPage);
    }

    getPageNumbers() {
        const totalPages = this.getTotalPages();
        return Array.from({length: totalPages}, (_, i) => i + 1);
    }

    getBeiValue(bei) {
        return bei ? bei.toUpperCase() : '';
    }

    getStageName(stage_id) {
        return stage_id && stage_id[1] ? stage_id[1] : '-';
    }

    getPhaseName(phase) {
        const phases = {
            'online_failed': 'Online Failed',
            'online_passed': 'Online Passed',
            'ai_interview': 'AI Interview',
            'user_interview': 'User Interview',
            'psc_interview': 'PSC Interview'
        };
        return phases[phase] || phase || '-';
    }

    getDecisionName(decision) {
        const decisions = {
            'on_progress': 'On Progress',
            'recommended': 'Recommended',
            'offer_made': 'Offer Made',
            'do_not_pursue': 'Do Not Pursue'
        };
        return decisions[decision] || decision || '-';
    }

    getStatusBadgeClass(status) {
        const statusClasses = {
            'on_progress': 'badge-primary',
            'recommended': 'badge-success',
            'offer_made': 'badge-warning',
            'do_not_pursue': 'badge-danger'
        };
        return statusClasses[status] || 'badge-secondary';
    }

    formatNotes(notes) {
        if (!notes) return '-';
        const div = document.createElement('div');
        div.innerHTML = notes;
        return div.textContent || div.innerText || '-';
    }

    updateChartData(candidates) {
        const phaseCount = {};
        const statusCount = {
            'on_progress': { name: 'On Progress', count: 0 },
            'recommended': { name: 'Recommended', count: 0 },
            'offer_made': { name: 'Offer Made', count: 0 },
            'do_not_pursue': { name: 'Do Not Pursue', count: 0 }
        };

        candidates.forEach(c => {
            if (c.stage_id && c.stage_id[1]) {
                const stageName = c.stage_id[1];
                if (!phaseCount[stageName]) {
                    phaseCount[stageName] = { name: stageName, count: 0 };
                }
                phaseCount[stageName].count++;
            }
            
            if (c.hire_decision && statusCount[c.hire_decision]) {
                statusCount[c.hire_decision].count++;
            }
        });

        this.state.phaseData = Object.values(phaseCount).filter(p => p.count > 0);
        this.state.statusData = Object.values(statusCount).filter(s => s.count > 0);
    }

    renderCharts() {
        this.renderPieChart('phaseChart', this.state.phaseData, this.phaseColors);
        this.renderPieChart('statusChart', this.state.statusData, this.statusColors);
    }

    getPhaseColor(index) {
        return this.phaseColors[index % this.phaseColors.length];
    }

    getStatusColor(index) {
        return this.statusColors[index % this.statusColors.length];
    }

    renderPieChart(refName, data, colors) {
        const canvas = this[refName + 'Ref']?.el;
        if (!canvas || !data.length) return;

        const ctx = canvas.getContext('2d');
        
        if (this[refName + 'Instance']) {
            this[refName + 'Instance'].destroy();
        }

        this[refName + 'Instance'] = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: data.map(d => d.name),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff',
                    hoverOffset: 15,
                    hoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                layout: {
                    padding: 10
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const index = elements[0].index;
                        const label = data[index].name;
                        this.onChartClick(refName, label);
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        enabled: true,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#fff',
                        bodyColor: '#fff',
                        borderColor: '#fff',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return label + ': ' + value + ' (' + percentage + '%)';
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'nearest',
                    intersect: true
                },
                animation: {
                    animateRotate: true,
                    animateScale: true
                }
            }
        });
    }

    onChartClick(chartName, label) {
        if (chartName === 'phaseChart') {
            this.state.filters.phase = this.getPhaseCodeFromName(label);
        } else if (chartName === 'statusChart') {
            this.state.filters.decision = this.getDecisionCodeFromName(label);
        }
        this.filterCandidates();
    }

    getPhaseCodeFromName(name) {
        const candidates = this.state.recentCandidates;
        for (const c of candidates) {
            if (c.stage_id && c.stage_id[1] === name) {
                return c.stage_id[0];
            }
        }
        return 'all';
    }

    getPhaseIdByName(name) {
        const candidates = this.state.recentCandidates;
        for (const c of candidates) {
            if (c.stage_id && c.stage_id[1] === name) {
                return c.stage_id[0];
            }
        }
        return 'all';
    }

    getDecisionCodeFromName(name) {
        const decisions = {
            'On Progress': 'on_progress',
            'Recommended': 'recommended',
            'Offer Made': 'offer_made',
            'Do Not Pursue': 'do_not_pursue'
        };
        return decisions[name] || 'all';
    }

    onItemsPerPageChange(ev) {
        this.state.pagination.itemsPerPage = parseInt(ev.target.value);
        this.state.pagination.currentPage = 1;
    }

    onSearchInput(ev) {
        this.state.searchText = ev.target.value;
        this.filterCandidates();
    }

    clearAllFilters() {
        this.state.searchText = '';
        this.state.filters.phase = 'all';
        this.state.filters.decision = 'all';
        this.state.filters.month = 'all';
        this.filterCandidates();
    }

    hasActiveFilters() {
        return this.state.searchText || 
               this.state.filters.phase !== 'all' || 
               this.state.filters.decision !== 'all' || 
               this.state.filters.month !== 'all';
    }

    onPhaseFilterChange(ev) {
        this.state.filters.phase = ev.target.value;
        this.state.pagination.currentPage = 1;
        this.filterCandidates();
    }

    onDecisionFilterChange(ev) {
        this.state.filters.decision = ev.target.value;
        this.filterCandidates();
    }

    onMonthFilterChange(ev) {
        this.state.filters.month = ev.target.value;
        this.filterCandidates();
    }

    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('id-ID');
    }

    getAvailableMonths() {
        const months = new Set();
        this.state.recentCandidates.forEach(c => {
            if (c.last_test) {
                const date = new Date(c.last_test);
                const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                months.add(yearMonth);
            }
        });
        return Array.from(months).sort().reverse();
    }

    getMonthName(yearMonth) {
        const [year, month] = yearMonth.split('-');
        const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
        return `${monthNames[parseInt(month) - 1]} ${year}`;
    }

    sortByName() {
        if (this.state.sortField === 'partner_name') {
            this.state.sortDirection = this.state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.state.sortField = 'partner_name';
            this.state.sortDirection = 'asc';
        }
        this.filterCandidates();
    }

    goToPreviousPage() {
        if (this.state.pagination.currentPage > 1) {
            this.state.pagination.currentPage--;
        }
    }

    goToNextPage() {
        if (this.state.pagination.currentPage < this.getTotalPages()) {
            this.state.pagination.currentPage++;
        }
    }

    goToPage(ev) {
        const page = parseInt(ev.target.dataset.page);
        this.state.pagination.currentPage = page;
    }
}

export { RecruitmentDashboard };
