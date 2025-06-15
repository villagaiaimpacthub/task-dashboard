// Wallet Page Manager
class WalletPageManager {
    constructor(app) {
        this.app = app;
        this.credits = 0;
        this.transactions = [];
    }

    async showWalletPage() {
        console.log('showWalletPage called');
        try {
            // Hide main container
            const mainContainer = document.querySelector('.main-container');
            if (mainContainer) {
                mainContainer.style.display = 'none';
            }

            // Create or get wallet container
            let walletContainer = document.getElementById('wallet-page-container');
            if (!walletContainer) {
                walletContainer = document.createElement('div');
                walletContainer.id = 'wallet-page-container';
                document.body.appendChild(walletContainer);
            }

            walletContainer.style.display = 'block';
            walletContainer.style.position = 'fixed';
            walletContainer.style.top = '0';
            walletContainer.style.left = '0';
            walletContainer.style.width = '100%';
            walletContainer.style.height = '100%';
            walletContainer.style.zIndex = '1000';
            document.body.style.overflow = 'auto';

            // Load wallet data
            await this.loadWalletData();

            // Render the wallet page
            this.renderWalletPage(walletContainer);
            console.log('Wallet page rendered successfully');

        } catch (error) {
            console.error('Failed to load wallet page:', error);
        }
    }

    async loadWalletData() {
        try {
            // For now, simulate wallet data
            // In the future, this would call an API endpoint
            this.credits = 250; // Sample credit balance
            this.transactions = [
                {
                    id: '1',
                    description: 'Task Completed: Implement user authentication',
                    amount: 50,
                    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                    type: 'earned'
                },
                {
                    id: '2',
                    description: 'Milestone Bonus: Phase 1 completion',
                    amount: 100,
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
                    type: 'bonus'
                },
                {
                    id: '3',
                    description: 'Task Completed: Database optimization',
                    amount: 75,
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
                    type: 'earned'
                },
                {
                    id: '4',
                    description: 'Premium Feature Access',
                    amount: -25,
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                    type: 'spent'
                },
                {
                    id: '5',
                    description: 'Task Completed: API endpoint development',
                    amount: 60,
                    date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
                    type: 'earned'
                },
                {
                    id: '6',
                    description: 'Community Contribution Bonus',
                    amount: 30,
                    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                    type: 'bonus'
                }
            ];

        } catch (error) {
            console.error('Failed to load wallet data:', error);
            this.credits = 0;
            this.transactions = [];
        }
    }

    renderWalletPage(container) {
        const currentUser = this.app.currentUser;
        
        container.innerHTML = `
            <div class="page-container" style="
                background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
                min-height: 100vh;
                padding: 70px 0 0 0;
                color: #ffffff;
            ">
                <div style="max-width: 1000px; margin: 0 auto; padding: 32px;">
                    <!-- Header -->
                    <div style="
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 32px;
                        padding-bottom: 20px;
                        border-bottom: 1px solid rgba(255, 152, 0, 0.2);
                    ">
                        <div>
                            <h1 style="margin: 0 0 8px 0; font-size: 32px; font-weight: 700;">💰 Task Credits Wallet</h1>
                            <p style="margin: 0; color: #d0d0d0; font-size: 16px;">Manage your earned credits from completed tasks</p>
                        </div>
                        <button onclick="window.router.navigate('/')" style="
                            background: rgba(255, 152, 0, 0.15);
                            color: #ff9800;
                            border: 1px solid rgba(255, 152, 0, 0.3);
                            padding: 12px 24px;
                            border-radius: 8px;
                            cursor: pointer;
                            font-weight: 500;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='rgba(255, 152, 0, 0.25)'" 
                           onmouseout="this.style.background='rgba(255, 152, 0, 0.15)'">
                            ← Back to Dashboard
                        </button>
                    </div>

                    <!-- Wallet Balance -->
                    <div style="
                        text-align: center;
                        background: rgba(255, 152, 0, 0.1);
                        border: 1px solid rgba(255, 152, 0, 0.2);
                        border-radius: 20px;
                        padding: 40px;
                        margin-bottom: 40px;
                    ">
                        <div style="font-size: 80px; margin-bottom: 20px;">💰</div>
                        <div style="font-size: 48px; font-weight: bold; color: #ff9800; margin-bottom: 12px;">${this.credits} Credits</div>
                        <p style="color: #d0d0d0; margin: 0; font-size: 16px;">Current Balance</p>
                    </div>

                    <!-- Credit Info Grid -->
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 24px;
                        margin-bottom: 40px;
                    ">
                        <!-- How to Earn -->
                        <div style="
                            background: rgba(76, 175, 80, 0.1);
                            border: 1px solid rgba(76, 175, 80, 0.2);
                            border-radius: 16px;
                            padding: 24px;
                        ">
                            <h3 style="margin: 0 0 16px 0; color: #4caf50; font-size: 20px;">🎯 How to Earn Credits</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #d0d0d0; line-height: 1.8;">
                                <li><strong>Complete assigned tasks</strong> - Earn credits based on task complexity</li>
                                <li><strong>Achieve task milestones</strong> - Get bonus credits for milestone completion</li>
                                <li><strong>Contribute to community projects</strong> - Extra credits for community involvement</li>
                                <li><strong>Help other team members</strong> - Peer assistance rewards</li>
                                <li><strong>Submit quality deliverables</strong> - Performance-based bonuses</li>
                            </ul>
                        </div>

                        <!-- How to Use -->
                        <div style="
                            background: rgba(78, 205, 196, 0.1);
                            border: 1px solid rgba(78, 205, 196, 0.2);
                            border-radius: 16px;
                            padding: 24px;
                        ">
                            <h3 style="margin: 0 0 16px 0; color: #4ecdc4; font-size: 20px;">💎 How to Use Credits</h3>
                            <ul style="margin: 0; padding-left: 20px; color: #d0d0d0; line-height: 1.8;">
                                <li><strong>Unlock premium features</strong> - Access advanced project tools</li>
                                <li><strong>Request priority support</strong> - Get faster help with tasks</li>
                                <li><strong>Join exclusive projects</strong> - Access high-impact opportunities</li>
                                <li><strong>Skill certification</strong> - Validate your expertise</li>
                                <li><strong>Team collaboration tools</strong> - Enhanced communication features</li>
                            </ul>
                        </div>
                    </div>

                    <!-- Transaction History -->
                    <div style="
                        background: rgba(0, 0, 0, 0.4);
                        border: 1px solid rgba(255, 152, 0, 0.2);
                        border-radius: 16px;
                        padding: 24px;
                        margin-bottom: 40px;
                    ">
                        <h2 style="margin: 0 0 24px 0; color: #ff9800; font-size: 24px;">📊 Transaction History</h2>
                        
                        ${this.transactions.length > 0 ? 
                            this.renderTransactions() :
                            `<div style="
                                text-align: center;
                                padding: 40px;
                                color: #d0d0d0;
                                font-style: italic;
                            ">
                                <div style="font-size: 48px; margin-bottom: 16px;">📋</div>
                                <p>No transactions yet.</p>
                                <p style="font-size: 14px; margin-top: 16px;">Complete tasks to start earning credits!</p>
                            </div>`
                        }
                    </div>

                    <!-- Action Buttons -->
                    <div style="
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                        gap: 16px;
                    ">
                        <button onclick="window.router.navigate('/')" style="
                            background: rgba(78, 205, 196, 0.15);
                            color: #4ecdc4;
                            border: 1px solid rgba(78, 205, 196, 0.3);
                            padding: 16px 24px;
                            border-radius: 12px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 16px;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='rgba(78, 205, 196, 0.25)'" 
                           onmouseout="this.style.background='rgba(78, 205, 196, 0.15)'">
                            🎯 Browse Available Tasks
                        </button>
                        
                        <button onclick="window.router.navigate('/impact')" style="
                            background: rgba(76, 175, 80, 0.15);
                            color: #4caf50;
                            border: 1px solid rgba(76, 175, 80, 0.3);
                            padding: 16px 24px;
                            border-radius: 12px;
                            cursor: pointer;
                            font-weight: 600;
                            font-size: 16px;
                            transition: all 0.3s ease;
                        " onmouseover="this.style.background='rgba(76, 175, 80, 0.25)'" 
                           onmouseout="this.style.background='rgba(76, 175, 80, 0.15)'">
                            📈 View Impact History
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderTransactions() {
        return this.transactions.map(transaction => `
            <div style="
                background: rgba(68, 68, 68, 0.3);
                border: 1px solid rgba(255, 152, 0, 0.2);
                border-radius: 12px;
                padding: 16px;
                margin-bottom: 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            ">
                <div>
                    <div style="color: #ffffff; font-weight: 600; margin-bottom: 4px;">${transaction.description}</div>
                    <div style="color: #a0a0a0; font-size: 12px;">${new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div style="
                    color: ${transaction.amount > 0 ? '#4caf50' : '#f44336'};
                    font-weight: bold;
                    font-size: 16px;
                ">
                    ${transaction.amount > 0 ? '+' : ''}${transaction.amount} Credits
                </div>
            </div>
        `).join('');
    }

    cleanup() {
        const container = document.getElementById('wallet-page-container');
        if (container) {
            container.style.display = 'none';
        }
        
        // Restore main container
        const mainContainer = document.querySelector('.main-container');
        if (mainContainer) {
            mainContainer.style.display = 'grid';
        }
        
        document.body.style.overflow = 'hidden';
    }
}

// Global instance - will be initialized after app loads
window.walletPageManager = null;