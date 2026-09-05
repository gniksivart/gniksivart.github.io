// 1. Centralized Game State
const gameState = {
    gold: 0,
    wood: 0,
    ore: 0,
    food: 0,
    life: 10,
    exp: 0,
    bank: 0,
    items: {
        axe: { count: 0, cost: 5 },
        pickaxe: { count: 0, cost: 5 },
        knife: { count: 0, cost: 5 }
    },
    inventory: [], // Max size 5
    equipment: {
        head: null,      // Cap
        chest: null,     // Shirt
        hands: null,     // Gloves
        legs: null,      // Pants
        feet: null,      // Boots
        attack: null,    // Sword
        defense: null,   // Shield
        ring1: null,     // Ring Left
        ring2: null      // Ring Right
    }
};

// Item Definitions & Drop Configurations
const ITEM_TYPES = [
    { name: "Cap", slot: "head" },
    { name: "Shirt", slot: "chest" },
    { name: "Gloves", slot: "hands" },
    { name: "Pants", slot: "legs" },
    { name: "Boots", slot: "feet" },
    { name: "Sword", slot: "attack" },
    { name: "Shield", slot: "defense" },
    { name: "Ring", slot: "ring" } // Special handling for ring1 vs ring2
];

const BUFF_TYPES = ["stamina", "strength", "attack", "defense"];

// Helper: Calculates rate based on logarithmic tiers
function getBankRate() {
    if (gameState.bank < 10) return 0;
    return Math.floor(Math.log10(gameState.bank));
}

// Helper: Calculates total buffs from all equipped items
function getEquippedBuffs() {
    const totals = { stamina: 0, strength: 0, attack: 0, defense: 0 };
    Object.values(gameState.equipment).forEach(item => {
        if (item) {
            totals[item.buffType] += item.buffValue;
        }
    });
    return totals;
}

// 2. Cache DOM Elements
const elements = {
    goldBtn: document.getElementById('find-gold-btn'),
    goldCount: document.getElementById('gold-count'),
    woodBtn: document.getElementById('chop-wood-btn'),
    woodCount: document.getElementById('wood-count'),
    oreBtn: document.getElementById('mine-ore-btn'),
    oreCount: document.getElementById('ore-count'),
    foodBtn: document.getElementById('hunt-food-btn'),
    foodCount: document.getElementById('food-count'),
    exploreBtn: document.getElementById('explore-btn'),
    lifeCount: document.getElementById('life-count'),
    expCount: document.getElementById('exp-count'),
    resetBtn: document.getElementById('reset-btn'),
    exploreMsg: document.getElementById('explore-msg'),
    bank: {
        count: document.getElementById('bank-count'),
        rate: document.getElementById('rate-count'),
        depositBtn: document.getElementById('deposit-btn'),
        withdrawBtn: document.getElementById('withdraw-btn')
    },
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
    },
    inventoryCount: document.getElementById('inventory-count'),
    inventoryList: document.getElementById('inventory-list'),
    equipmentList: document.getElementById('equipment-list'),
    buffs: {
        stamina: document.getElementById('buff-stamina'),
        strength: document.getElementById('buff-strength'),
        attack: document.getElementById('buff-attack'),
        defense: document.getElementById('buff-defense')
    }
};

// 3. UI Update Logic
function updateUI() {
    if (elements.goldCount) elements.goldCount.textContent = gameState.gold;
    if (elements.woodCount) elements.woodCount.textContent = gameState.wood;
    if (elements.oreCount) elements.oreCount.textContent = gameState.ore;
    if (elements.foodCount) elements.foodCount.textContent = gameState.food;
    if (elements.lifeCount) elements.lifeCount.textContent = gameState.life;
    if (elements.expCount) elements.expCount.textContent = gameState.exp;

    // Update Bank UI
    if (elements.bank.count) elements.bank.count.textContent = gameState.bank;
    if (elements.bank.rate) elements.bank.rate.textContent = getBankRate();
    if (elements.bank.depositBtn) elements.bank.depositBtn.disabled = gameState.gold < 10;
    if (elements.bank.withdrawBtn) elements.bank.withdrawBtn.disabled = gameState.bank <= 0;

    // Resource Action Buttons Disabled States
    if (elements.woodBtn) elements.woodBtn.disabled = gameState.items.axe.count <= 0;
    if (elements.oreBtn) elements.oreBtn.disabled = gameState.items.pickaxe.count <= 0;
    if (elements.foodBtn) elements.foodBtn.disabled = gameState.items.knife.count <= 0;
    if (elements.exploreBtn) elements.exploreBtn.disabled = gameState.life <= 0;

    // Update Items & Buy Buttons
    Object.keys(gameState.items).forEach((itemKey) => {
        const itemData = gameState.items[itemKey];
        const itemUI = elements.items[itemKey];

        if (itemUI && itemUI.count) itemUI.count.textContent = itemData.count;
        if (itemUI && itemUI.btn) itemUI.btn.disabled = gameState.gold < itemData.cost;
    });

    // Update Inventory UI
    if (elements.inventoryCount) elements.inventoryCount.textContent = gameState.inventory.length;
    renderInventory();

    // Update Equipment UI & Calculated Buffs
    renderEquipment();
    updateBuffTotals();
}

function renderInventory() {
    if (!elements.inventoryList) return;
    elements.inventoryList.innerHTML = '';

    if (gameState.inventory.length === 0) {
        elements.inventoryList.innerHTML = '<li class="stat-text">Inventory is empty.</li>';
        return;
    }

    gameState.inventory.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.marginBottom = '6px';
        li.className = 'stat-text';
        li.innerHTML = `
            ${item.name} (+${item.buffValue} ${item.buffType}) 
            <button type="button" onclick="equipItem(${index})">Equip</button>
            <button type="button" onclick="sellItem(${index})">Sell (1g)</button>
        `;
        elements.inventoryList.appendChild(li);
    });
}

function renderEquipment() {
    if (!elements.equipmentList) return;
    elements.equipmentList.innerHTML = '';

    const slotLabels = {
        head: 'Head (Cap)',
        chest: 'Chest (Shirt)',
        hands: 'Hands (Gloves)',
        legs: 'Legs (Pants)',
        feet: 'Feet (Boots)',
        attack: 'Attack (Sword)',
        defense: 'Defense (Shield)',
        ring1: 'Ring 1',
        ring2: 'Ring 2'
    };

    Object.keys(gameState.equipment).forEach(slotKey => {
        const item = gameState.equipment[slotKey];
        const label = slotLabels[slotKey];
        const li = document.createElement('li');
        li.className = 'stat-text';
        li.style.marginBottom = '4px';

        if (item) {
            li.innerHTML = `<strong>${label}:</strong> ${item.name} (+${item.buffValue} ${item.buffType}) 
                <button type="button" onclick="unequipItem('${slotKey}')">Unequip</button>`;
        } else {
            li.innerHTML = `<strong>${label}:</strong> <em>Empty</em>`;
        }
        elements.equipmentList.appendChild(li);
    });
}

function updateBuffTotals() {
    const totals = getEquippedBuffs();
    if (elements.buffs.stamina) elements.buffs.stamina.textContent = totals.stamina;
    if (elements.buffs.strength) elements.buffs.strength.textContent = totals.strength;
    if (elements.buffs.attack) elements.buffs.attack.textContent = totals.attack;
    if (elements.buffs.defense) elements.buffs.defense.textContent = totals.defense;
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
        gameState.items.axe.count -= 1;
        gameState.wood += 1;
        updateUI();
    }
}

function mineOre() {
    if (gameState.items.pickaxe.count > 0) {
        gameState.items.pickaxe.count -= 1;
        gameState.ore += 1;
        updateUI();
    }
}

function huntFood() {
    if (gameState.items.knife.count > 0) {
        gameState.items.knife.count -= 1;
        gameState.food += 1;
        updateUI();
    }
}

function goExplore() {
    if (gameState.life > 0) {
        gameState.life -= 1;
        gameState.exp += 1;
        
        // 50% chance to drop an item
        if (Math.random() < 0.5) {
            if (gameState.inventory.length < 5) {
                const randomType = ITEM_TYPES[Math.floor(Math.random() * ITEM_TYPES.length)];
                const randomBuff = BUFF_TYPES[Math.floor(Math.random() * BUFF_TYPES.length)];
                const buffVal = Math.floor(Math.random() * 3) + 1; // +1 to +3 buff

                const newItem = {
                    id: Date.now(),
                    name: randomType.name,
                    slot: randomType.slot,
                    buffType: randomBuff,
                    buffValue: buffVal
                };

                gameState.inventory.push(newItem);
                if (elements.exploreMsg) elements.exploreMsg.textContent = `Found: ${newItem.name} (+${newItem.buffValue} ${newItem.buffType})!`;
            } else {
                if (elements.exploreMsg) elements.exploreMsg.textContent = "Found an item, but inventory is full!";
            }
        } else {
            if (elements.exploreMsg) elements.exploreMsg.textContent = "Explored, but found nothing.";
        }

        updateUI();
    }
}

// Inventory & Equipment Handlers
window.equipItem = function(index) {
    const item = gameState.inventory[index];
    if (!item) return;

    let targetSlot = item.slot;

    // Handle ring slots logic (fill ring1 first, then ring2)
    if (targetSlot === 'ring') {
        if (!gameState.equipment.ring1) {
            targetSlot = 'ring1';
        } else if (!gameState.equipment.ring2) {
            targetSlot = 'ring2';
        } else {
            targetSlot = 'ring1'; // Default swap ring 1 if both full
        }
    }

    // Swap item if slot is occupied
    const existingItem = gameState.equipment[targetSlot];
    gameState.inventory.splice(index, 1);
    
    if (existingItem) {
        gameState.inventory.push(existingItem);
    }

    gameState.equipment[targetSlot] = item;
    updateUI();
};

window.unequipItem = function(slotKey) {
    const item = gameState.equipment[slotKey];
    if (!item) return;

    if (gameState.inventory.length < 5) {
        gameState.equipment[slotKey] = null;
        gameState.inventory.push(item);
        updateUI();
    } else {
        alert("Inventory is full! Cannot unequip.");
    }
};

window.sellItem = function(index) {
    if (index >= 0 && index < gameState.inventory.length) {
        gameState.inventory.splice(index, 1);
        gameState.gold += 1;
        updateUI();
    }
};

// Bank Actions
function depositGold(amount = 10) {
    if (gameState.gold >= amount) {
        gameState.gold -= amount;
        gameState.bank += amount;
        updateUI();
    }
}

function withdrawGold() {
    if (gameState.bank > 0) {
        gameState.gold += gameState.bank;
        gameState.bank = 0;
        updateUI();
    }
}

function resetGame() {
    gameState.gold = 0;
    gameState.ore = 0;
    gameState.food = 0;
    gameState.wood = 0;
    gameState.life = 10;
    gameState.exp = 0;
    gameState.bank = 0;
    gameState.inventory = [];
    Object.keys(gameState.equipment).forEach(slot => {
        gameState.equipment[slot] = null;
    });
    Object.keys(gameState.items).forEach((itemKey) => {
        gameState.items[itemKey].count = 0;
    });
    if (elements.exploreMsg) elements.exploreMsg.textContent = "";
    updateUI();
}

// 5. Event Listeners
if (elements.goldBtn) elements.goldBtn.addEventListener('click', () => addGold(1));
if (elements.woodBtn) elements.woodBtn.addEventListener('click', chopWood);
if (elements.oreBtn) elements.oreBtn.addEventListener('click', mineOre);
if (elements.foodBtn) elements.foodBtn.addEventListener('click', huntFood);
if (elements.exploreBtn) elements.exploreBtn.addEventListener('click', goExplore);
if (elements.resetBtn) elements.resetBtn.addEventListener('click', resetGame);

// Bank Listeners
if (elements.bank.depositBtn) {
    elements.bank.depositBtn.addEventListener('click', () => depositGold(10));
}
if (elements.bank.withdrawBtn) {
    elements.bank.withdrawBtn.addEventListener('click', withdrawGold);
}

// Item Shop Listeners
Object.keys(elements.items).forEach((itemKey) => {
    if (elements.items[itemKey] && elements.items[itemKey].btn) {
        elements.items[itemKey].btn.addEventListener('click', () => buyItem(itemKey));
    }
});

// 6. Passive Interest Game Loop
setInterval(() => {
    const rate = getBankRate();
    if (rate > 0) {
        gameState.gold += rate;
        updateUI();
    }
}, 1000);

// Initial Render
updateUI();
