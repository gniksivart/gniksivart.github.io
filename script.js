// 1. Centralized Game State
const gameState = {
    gold: 0,
    wood: 0,
    items: {
        axe: { count: 0, cost: 5 },
        pickaxe: { count: 0, cost: 5 },
        knife: { count: 0, cost: 5 }
    }
};

// 2. Cache DOM Elements
const elements = {
    goldBtn: document.getElementById('find-gold-btn'),
    goldCount: document.getElementById('gold-count'),
    woodBtn: document.getElementById('chop-wood-btn'),
    woodCount: document.getElementById('wood-count'),
    resetBtn: document.getElementById('reset-btn'),
    items: {
        axe: {
            btn: document.getElementById('buy-axe-btn'),
            count: document.getElementById('axe-count')
        },
        pickaxe: {
            btn: document.getElementById('buy-pickaxe-btn'),
            count: document.getElementById('pickaxe-count')
        },
        knife: {
            btn: document.getElementById('buy-knife-btn'),
            count: document.getElementById('knife-count')
        }
    }
};

// 3. UI Update Logic
function updateUI() {
    elements.goldCount.textContent = gameState.gold;
    elements.woodCount.textContent = gameState.wood;

    // Chop Wood button disabled if player has 0 axe durability
    elements.woodBtn.disabled = gameState.items.axe.count <= 0;

    // Update Items & Buy Buttons
    Object.keys(gameState.items).forEach((itemKey) => {
        const itemData = gameState.items[itemKey];
        const itemUI = elements.items[itemKey];

        itemUI.count.textContent = itemData.count;
        itemUI.btn.disabled = gameState.gold < itemData.cost;
    });
}

// 4. Core Actions
function addGold(amount = 1) {
    gameState.gold += amount;
    updateUI();
}

function buyItem(itemKey) {
    const item = gameState.items[itemKey];
    if (gameState.gold >= item.cost) {
        gameState.gold -= item.cost;
        item.count += 10;
        updateUI();
    }
}

function chopWood() {
    if (gameState.items.axe.count > 0) {
        gameState.items.axe.count -= 1; // Reduces durability by 1
        gameState.wood += 1;           // Increases wood by 1
        updateUI();
    }
}

function resetGame() {
    gameState.gold = 0;
    gameState.wood = 0;
    Object.keys(gameState.items).forEach((itemKey) => {
        gameState.items[itemKey].count = 0;
    });
    updateUI();
}

// 5. Event Listeners
elements.goldBtn.addEventListener('click', () => addGold(1));
elements.woodBtn.addEventListener('click', chopWood);
elements.resetBtn.addEventListener('click', resetGame);

Object.keys(elements.items).forEach((itemKey) => {
    elements.items[itemKey].btn.addEventListener('click', () => buyItem(itemKey));
});

// Initial Render
updateUI();
