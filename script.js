// LevelUp Habits - RPG Habit Tracker
class HabitTracker {
    constructor() {
        this.habits = JSON.parse(localStorage.getItem('levelup-habits')) || [];
        this.playerData = JSON.parse(localStorage.getItem('levelup-player')) || {
            level: 1,
            xp: 0,
            totalXp: 0
        };
        
        this.categoryIcons = {
            health: '🏃',
            productivity: '💼',
            learning: '📚',
            mindfulness: '🧘',
            social: '👥',
            creative: '🎨'
        };
        
        this.difficultyXp = {
            easy: 10,
            medium: 20,
            hard: 30
        };
        
        this.init();
    }
    
    init() {
        this.bindEvents();
        this.render();
        this.updatePlayerDisplay();
    }
    
    bindEvents() {
        // Modal controls
        document.getElementById('add-habit-btn').addEventListener('click', () => this.openModal());
        document.getElementById('close-modal').addEventListener('click', () => this.closeModal());
        document.getElementById('cancel-btn').addEventListener('click', () => this.closeModal());
        
        // Form submission
        document.getElementById('habit-form').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Close modal on backdrop click
        document.getElementById('habit-form-modal').addEventListener('click', (e) => {
            if (e.target.id === 'habit-form-modal') {
                this.closeModal();
            }
        });
        
        // Close level up animation on click
        document.getElementById('level-up-animation').addEventListener('click', () => {
            this.closeLevelUpAnimation();
        });
    }
    
    openModal(habit = null) {
        const modal = document.getElementById('habit-form-modal');
        const form = document.getElementById('habit-form');
        const title = document.getElementById('modal-title');
        const submitBtn = document.getElementById('submit-btn');
        
        if (habit) {
            // Edit mode
            title.textContent = 'Edit Habit';
            submitBtn.textContent = 'Update Habit';
            document.getElementById('habit-name').value = habit.name;
            document.getElementById('habit-category').value = habit.category;
            document.getElementById('habit-difficulty').value = habit.difficulty;
            form.dataset.editId = habit.id;
        } else {
            // Create mode
            title.textContent = 'Create New Habit';
            submitBtn.textContent = 'Create Habit';
            form.reset();
            delete form.dataset.editId;
        }
        
        modal.classList.add('active');
        document.getElementById('habit-name').focus();
    }
    
    closeModal() {
        const modal = document.getElementById('habit-form-modal');
        modal.classList.remove('active');
    }
    
    handleFormSubmit(e) {
        e.preventDefault();
        
        const form = e.target;
        const name = document.getElementById('habit-name').value.trim();
        const category = document.getElementById('habit-category').value;
        const difficulty = document.getElementById('habit-difficulty').value;
        
        if (!name) return;
        
        const habitData = {
            name,
            category,
            difficulty,
            xp: this.difficultyXp[difficulty]
        };
        
        if (form.dataset.editId) {
            // Update existing habit
            this.updateHabit(form.dataset.editId, habitData);
        } else {
            // Create new habit
            this.createHabit(habitData);
        }
        
        this.closeModal();
    }
    
    createHabit(habitData) {
        const habit = {
            id: Date.now().toString(),
            ...habitData,
            createdAt: new Date().toISOString(),
            streak: 0,
            bestStreak: 0,
            completedDates: [],
            lastCompleted: null
        };
        
        this.habits.push(habit);
        this.saveData();
        this.render();
        this.showNotification(`New habit "${habit.name}" created! 🎯`);
    }
    
    updateHabit(id, habitData) {
        const habitIndex = this.habits.findIndex(h => h.id === id);
        if (habitIndex === -1) return;
        
        this.habits[habitIndex] = {
            ...this.habits[habitIndex],
            ...habitData
        };
        
        this.saveData();
        this.render();
        this.showNotification(`Habit "${habitData.name}" updated! ✏️`);
    }
    
    deleteHabit(id) {
        if (!confirm('Are you sure you want to delete this habit?')) return;
        
        this.habits = this.habits.filter(h => h.id !== id);
        this.saveData();
        this.render();
        this.showNotification('Habit deleted! 🗑️');
    }
    
    completeHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        if (!habit) return;
        
        const today = new Date().toDateString();
        
        // Check if already completed today
        if (habit.completedDates.includes(today)) {
            this.showNotification('Already completed today! 🎉');
            return;
        }
        
        // Add completion
        habit.completedDates.push(today);
        habit.lastCompleted = today;
        
        // Update streak
        this.updateStreak(habit);
        
        // Award XP
        this.awardXp(habit.xp);
        
        // Save and render
        this.saveData();
        this.render();
        
        // Show animations
        this.showXpGain(habit.xp);
        this.showNotification(`Quest completed! +${habit.xp} XP 🎉`);
    }
    
    updateStreak(habit) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();
        
        // If completed today and yesterday, increment streak
        if (habit.completedDates.includes(todayStr) && habit.completedDates.includes(yesterdayStr)) {
            habit.streak += 1;
        } else if (habit.completedDates.includes(todayStr)) {
            // First completion or broken streak
            habit.streak = 1;
        }
        
        // Update best streak
        if (habit.streak > habit.bestStreak) {
            habit.bestStreak = habit.streak;
        }
    }
    
    awardXp(amount) {
        const oldLevel = this.playerData.level;
        this.playerData.xp += amount;
        this.playerData.totalXp += amount;
        
        // Check for level up
        const xpNeeded = this.getXpNeededForLevel(this.playerData.level);
        if (this.playerData.xp >= xpNeeded) {
            this.playerData.level += 1;
            this.playerData.xp -= xpNeeded;
            
            // Show level up animation
            setTimeout(() => this.showLevelUp(this.playerData.level), 1000);
        }
        
        this.updatePlayerDisplay();
    }
    
    getXpNeededForLevel(level) {
        return 100 + (level - 1) * 50; // Increasing XP requirement
    }
    
    showXpGain(amount) {
        const animation = document.getElementById('xp-gain-animation');
        const text = document.getElementById('xp-gained');
        
        text.textContent = amount;
        animation.classList.add('active');
        
        setTimeout(() => {
            animation.classList.remove('active');
        }, 2000);
    }
    
    showLevelUp(newLevel) {
        const animation = document.getElementById('level-up-animation');
        const levelSpan = document.getElementById('new-level');
        
        levelSpan.textContent = newLevel;
        animation.classList.add('active');
    }
    
    closeLevelUpAnimation() {
        const animation = document.getElementById('level-up-animation');
        animation.classList.remove('active');
    }
    
    updatePlayerDisplay() {
        const currentLevel = document.getElementById('current-level');
        const currentXp = document.getElementById('current-xp');
        const xpNeeded = document.getElementById('xp-needed');
        const xpBar = document.getElementById('xp-bar');
        
        const xpForNextLevel = this.getXpNeededForLevel(this.playerData.level);
        const xpProgress = (this.playerData.xp / xpForNextLevel) * 100;
        
        currentLevel.textContent = this.playerData.level;
        currentXp.textContent = this.playerData.xp;
        xpNeeded.textContent = xpForNextLevel;
        xpBar.style.width = `${Math.min(xpProgress, 100)}%`;
    }
    
    render() {
        this.renderHabits();
        this.updateStats();
    }
    
    renderHabits() {
        const container = document.getElementById('habits-container');
        const emptyState = document.getElementById('empty-state');
        
        if (this.habits.length === 0) {
            container.innerHTML = '';
            emptyState.classList.remove('hidden');
            return;
        }
        
        emptyState.classList.add('hidden');
        
        const today = new Date().toDateString();
        
        container.innerHTML = this.habits.map(habit => {
            const isCompletedToday = habit.completedDates.includes(today);
            const categoryIcon = this.categoryIcons[habit.category] || '📝';
            
            return `
                <div class="habit-card ${isCompletedToday ? 'completed' : ''}" data-id="${habit.id}">
                    <div class="habit-header">
                        <div class="habit-info">
                            <h3 class="habit-name">${habit.name}</h3>
                            <div class="habit-meta">
                                <span class="habit-category">${categoryIcon} ${this.formatCategory(habit.category)}</span>
                                <span class="habit-streak">🔥 ${habit.streak} day streak</span>
                                <span class="habit-xp">⭐ ${habit.xp} XP</span>
                            </div>
                        </div>
                        <div class="habit-actions">
                            <button class="habit-btn complete-btn" onclick="habitTracker.completeHabit('${habit.id}')" 
                                    ${isCompletedToday ? 'disabled' : ''}>
                                ${isCompletedToday ? '✅ Done' : '🎯 Complete'}
                            </button>
                            <button class="habit-btn edit-btn" onclick="habitTracker.editHabit('${habit.id}')" title="Edit">
                                ✏️
                            </button>
                            <button class="habit-btn delete-btn" onclick="habitTracker.deleteHabit('${habit.id}')" title="Delete">
                                🗑️
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    editHabit(id) {
        const habit = this.habits.find(h => h.id === id);
        if (habit) {
            this.openModal(habit);
        }
    }
    
    formatCategory(category) {
        return category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    updateStats() {
        const today = new Date().toDateString();
        
        // Calculate stats
        const totalStreak = this.habits.reduce((sum, habit) => sum + habit.streak, 0);
        const completedToday = this.habits.filter(habit => 
            habit.completedDates.includes(today)
        ).length;
        const totalHabits = this.habits.length;
        
        // Update display
        document.getElementById('total-streak').textContent = totalStreak;
        document.getElementById('completed-today').textContent = completedToday;
        document.getElementById('total-habits').textContent = totalHabits;
    }
    
    showNotification(message) {
        // Simple notification system - could be enhanced with a proper toast component
        console.log(`🎮 ${message}`);
        
        // You could implement a toast notification here
        // For now, we'll use the browser's built-in notification (optional)
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('LevelUp Habits', {
                body: message,
                icon: '🎯'
            });
        }
    }
    
    saveData() {
        localStorage.setItem('levelup-habits', JSON.stringify(this.habits));
        localStorage.setItem('levelup-player', JSON.stringify(this.playerData));
    }
    
    // Utility method to reset all data (for testing)
    resetData() {
        if (confirm('Are you sure you want to reset all data? This cannot be undone.')) {
            localStorage.removeItem('levelup-habits');
            localStorage.removeItem('levelup-player');
            location.reload();
        }
    }
    
    // Export data for backup
    exportData() {
        const data = {
            habits: this.habits,
            playerData: this.playerData,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `levelup-habits-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Import data from backup
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.habits && data.playerData) {
                this.habits = data.habits;
                this.playerData = data.playerData;
                this.saveData();
                this.render();
                this.updatePlayerDisplay();
                this.showNotification('Data imported successfully! 📥');
            }
        } catch (error) {
            alert('Invalid backup file format.');
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.habitTracker = new HabitTracker();
    
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Escape to close modal
        if (e.key === 'Escape') {
            const modal = document.getElementById('habit-form-modal');
            const levelUp = document.getElementById('level-up-animation');
            
            if (modal.classList.contains('active')) {
                habitTracker.closeModal();
            } else if (levelUp.classList.contains('active')) {
                habitTracker.closeLevelUpAnimation();
            }
        }
        
        // Ctrl/Cmd + N to add new habit
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
            e.preventDefault();
            habitTracker.openModal();
        }
    });
    
    // Add some demo habits for first-time users
    if (habitTracker.habits.length === 0) {
        const demoHabits = [
            {
                name: "Drink 8 glasses of water",
                category: "health",
                difficulty: "easy"
            },
            {
                name: "Read for 30 minutes",
                category: "learning",
                difficulty: "medium"
            },
            {
                name: "Exercise for 45 minutes",
                category: "health",
                difficulty: "hard"
            }
        ];
        
        // Uncomment to add demo habits automatically
        // demoHabits.forEach(habit => habitTracker.createHabit(habit));
    }
});

// Add some developer console commands for testing
window.devCommands = {
    reset: () => habitTracker.resetData(),
    export: () => habitTracker.exportData(),
    addXp: (amount) => habitTracker.awardXp(amount),
    levelUp: () => habitTracker.showLevelUp(habitTracker.playerData.level + 1),
    showXp: (amount) => habitTracker.showXpGain(amount)
};