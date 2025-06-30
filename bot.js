const mineflayer = require('mineflayer');

// Bot configuration
const BOT_CONFIG = {
    host: 'mallulifesteal.fun',
    port: 25565,
    username: 'Killadi_Shashi',
    version: '1.20.1',
    hideErrors: false,
    checkTimeoutInterval: 60000,
    closeTimeout: 240 * 1000,
    auth: 'offline',
    protocolVersion: 763
};

const PASSWORD = 'Jacob373';
const LOGIN_COMMAND = `/login ${PASSWORD}`;
const REGISTER_COMMAND = `/register ${PASSWORD} ${PASSWORD}`;

// Food configuration
const FOOD_ITEMS = [
    'golden_apple',
    'enchanted_golden_apple',
    'cooked_beef',
    'cooked_porkchop',
    'cooked_mutton',
    'cooked_chicken',
    'cooked_rabbit',
    'cooked_cod',
    'cooked_salmon',
    'bread',
    'baked_potato'
];
const MIN_FOOD_POINTS = 16;

let stdinInitialized = false;
let reconnectAttempts = 0;
let lastReconnectTime = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_COOLDOWN = 300000; // 5 minutes

function createBot() {
    const now = Date.now();
    
    // Check if we need to reset reconnect attempts
    if (now - lastReconnectTime > RECONNECT_COOLDOWN) {
        reconnectAttempts = 0;
    }
    
    // If too many reconnect attempts, wait longer
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('\x1b[31m%s\x1b[0m', `[BOT] Too many reconnect attempts (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}). Waiting 5 minutes...`);
        setTimeout(() => {
            reconnectAttempts = 0;
            createBot();
        }, RECONNECT_COOLDOWN);
        return;
    }

    console.log('\x1b[33m%s\x1b[0m', '[BOT] Attempting to connect...');
    
    const bot = mineflayer.createBot(BOT_CONFIG);
    let hasLoggedIn = false;
    let isAttacking = true;
    let lastAttackTime = 0;
    let lastFoodWarning = 0;
    const ATTACK_INTERVAL = 4000;
    const WARNING_INTERVAL = 1200000; // 20 minutes
    let previousItem = null;

    bot.on('spawn', () => {
        console.log('\x1b[32m%s\x1b[0m', '[BOT] Connected to server!');
        reconnectAttempts = 0; // Reset attempts on successful connection

        // Wait for server to be ready before attempting login
        setTimeout(() => {
            if (!hasLoggedIn) {
                console.log('\x1b[33m%s\x1b[0m', '[LOGIN] Attempting to login...');
                bot.chat(LOGIN_COMMAND);
                
                // If login fails, try registering after 5 seconds
                setTimeout(() => {
                    if (!hasLoggedIn) {
                        console.log('\x1b[33m%s\x1b[0m', '[LOGIN] Login failed, attempting to register...');
                        bot.chat(REGISTER_COMMAND);
                        
                        // Try logging in again after registration
                        setTimeout(() => {
                            if (!hasLoggedIn) {
                                console.log('\x1b[33m%s\x1b[0m', '[LOGIN] Attempting final login...');
                                bot.chat(LOGIN_COMMAND);
                            }
                        }, 3000);
                    }
                }, 5000);
            }
        }, 5000); // Increased initial delay to 5 seconds

        startHealthMonitor(bot);
        startMobTargeting(bot);
        startFoodMonitor(bot);
        console.log('\x1b[32m%s\x1b[0m', '[BOT] Attack mode enabled by default. Type "attack stop" or "attack start" in console to control.');
    });

    bot.on('message', (message) => {
        const msg = message.toString();
        console.log('\x1b[36m%s\x1b[0m', `[CHAT] ${msg}`);

        const lower = msg.toLowerCase();
        if (lower.includes('successfully') && (lower.includes('logged') || lower.includes('registered'))) {
            console.log('\x1b[32m%s\x1b[0m', '[LOGIN] Successfully authenticated!');
            hasLoggedIn = true;
        }
    });

    bot.on('error', (err) => {
        reconnectAttempts++;
        lastReconnectTime = Date.now();
        const reconnectDelay = err.code === 'ECONNRESET' ? 45000 : 30000;
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log('\x1b[31m%s\x1b[0m', `[BOT] Too many reconnect attempts (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}). Waiting 5 minutes...`);
            setTimeout(() => {
                reconnectAttempts = 0;
                createBot();
            }, RECONNECT_COOLDOWN);
            return;
        }

        console.log('\x1b[31m%s\x1b[0m', `[ERROR] ${err.code === 'ECONNRESET' ? 'Connection reset' : 'Connection error'} - attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        console.log('\x1b[33m%s\x1b[0m', `[BOT] Waiting ${reconnectDelay/1000} seconds before reconnecting...`);
        
        hasLoggedIn = false;
        setTimeout(createBot, reconnectDelay);
    });

    bot.on('end', () => {
        reconnectAttempts++;
        lastReconnectTime = Date.now();
        
        if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            console.log('\x1b[31m%s\x1b[0m', `[BOT] Too many reconnect attempts (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}). Waiting 5 minutes...`);
            setTimeout(() => {
                reconnectAttempts = 0;
                createBot();
            }, RECONNECT_COOLDOWN);
            return;
        }

        console.log('\x1b[33m%s\x1b[0m', `[BOT] Disconnected - attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}`);
        console.log('\x1b[33m%s\x1b[0m', '[BOT] Waiting 30 seconds before reconnecting...');
        
        hasLoggedIn = false;
        setTimeout(createBot, 30000);
    });

    bot.on('health', () => {
        checkHealth(bot);
    });

    bot.on('death', () => {
        console.log('\x1b[31m%s\x1b[0m', '[BOT] Bot died! Waiting to respawn...');
        setTimeout(() => {
            bot.emit('respawn');
            console.log('\x1b[32m%s\x1b[0m', '[BOT] Respawning...');
            setTimeout(() => {
                bot.chat('/home');
                console.log('\x1b[32m%s\x1b[0m', '[BOT] Teleporting home after respawn.');
            }, 4000);
        }, 3000);
    });

    // ✅ Attach stdin listener only once
    if (!stdinInitialized) {
        stdinInitialized = true;

        require('readline').emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(false);

        process.stdin.on('data', (data) => {
            const input = data.toString().trim();
            const command = input.toLowerCase();

            if (command === 'attack stop') {
                isAttacking = false;
                console.log('\x1b[31m%s\x1b[0m', '[BOT] Attack mode disabled');
            } else if (command === 'attack start') {
                isAttacking = true;
                console.log('\x1b[32m%s\x1b[0m', '[BOT] Attack mode enabled');
            } else if (command.startsWith('look ')) {
                const parts = command.split(' ');
                if (parts.length === 3) {
                    const yaw = parseFloat(parts[1]);
                    const pitch = parseFloat(parts[2]);
                    if (!isNaN(yaw) && !isNaN(pitch)) {
                        bot.look(yaw, pitch);
                        console.log('\x1b[32m%s\x1b[0m', `[BOT] Looking at yaw: ${yaw}, pitch: ${pitch}`);
                    }
                }
            } else if (command === 'tpa yes' || command === 'tpaccept') {
                bot.chat('/tpaccept');
                console.log('\x1b[32m%s\x1b[0m', '[BOT] Accepted teleport request');
            } else if (command === 'tpa no' || command === 'tpdeny') {
                bot.chat('/tpdeny');
                console.log('\x1b[31m%s\x1b[0m', '[BOT] Denied teleport request');
            } else if (input.startsWith('/')) {
                bot.chat(input);
                console.log('\x1b[35m%s\x1b[0m', `[COMMAND] ${input}`);
            } else if (input.length > 0) {
                bot.chat(input);
                console.log('\x1b[36m%s\x1b[0m', `[YOU] ${input}`);
            }
        });
    }

    function startMobTargeting(bot) {
        setInterval(async () => {
            try {
                const ping = bot.player?.ping || bot._client?.latency || 0;

                if (ping < 40 || ping > 300 || typeof ping !== 'number') {
                    if (isAttacking) {
                        isAttacking = false;
                        console.log('\x1b[33m%s\x1b[0m', `[BOT] Ping is bad (${ping} ms). Attacks paused.`);
                    }
                    return;
                } else {
                    if (!isAttacking) {
                        isAttacking = true;
                        console.log('\x1b[32m%s\x1b[0m', `[BOT] Ping is good (${ping} ms). Attacks resumed.`);
                    }
                }

                if (!isAttacking || bot.isEating) return; // Don't attack while eating

                const now = Date.now();
                if (now - lastAttackTime < ATTACK_INTERVAL) return;

                const target = bot.nearestEntity(entity => entity.name === 'armor_stand');
                if (target) {
                    bot.lookAt(target.position.offset(0, target.height * 0.5, 0));
                    bot.attack(target);
                    lastAttackTime = now;
                }
            } catch (err) {
                console.log('\x1b[31m%s\x1b[0m', '[ERROR] Attack error:', err);
            }
        }, 100);
    }

    function startFoodMonitor(bot) {
        let lastFoodLevel = 20;
        let lastNoFoodWarning = 0;
        const NO_FOOD_WARNING_INTERVAL = 1200000; // 20 minutes

        setInterval(() => {
            try {
                // Only check food after login and when ping is good
                if (!hasLoggedIn) return;
                const ping = bot.player?.ping || bot._client?.latency || 0;
                if (ping < 40 || ping > 300) return;

                // Only act if food level has changed
                if (bot.food !== lastFoodLevel) {
                    if (bot.food <= MIN_FOOD_POINTS) {
                        tryToEat(bot);
                    } else if (bot.food <= MIN_FOOD_POINTS + 2 && !bot.isEating) {
                        const now = Date.now();
                        if (now - lastFoodWarning >= WARNING_INTERVAL) {
                            console.log('\x1b[33m%s\x1b[0m', `[FOOD] Food level getting low (${bot.food}/${MIN_FOOD_POINTS})`);
                            lastFoodWarning = now;
                        }
                    }
                    lastFoodLevel = bot.food;
                }
            } catch (err) {
                console.log('\x1b[31m%s\x1b[0m', '[ERROR] Error monitoring food:', err);
            }
        }, 1000);
    }

    async function tryToEat(bot) {
        try {
            if (bot.food === 20) return; // Already full
            if (bot.isEating) return; // Already eating

            // Store current item before switching
            previousItem = bot.inventory.slots[bot.getEquipmentDestSlot('hand')];

            // Find food in inventory
            const foodItem = bot.inventory.items().find(item => FOOD_ITEMS.includes(item.name));
            
            if (!foodItem) {
                const now = Date.now();
                if (now - lastNoFoodWarning >= NO_FOOD_WARNING_INTERVAL) {
                    console.log('\x1b[33m%s\x1b[0m', '[FOOD] No food found in inventory!');
                    lastNoFoodWarning = now;
                }
                return;
            }

            // Equip food
            await bot.equip(foodItem, 'hand');
            
            // Start eating
            bot.isEating = true;
            console.log('\x1b[32m%s\x1b[0m', `[FOOD] Eating ${foodItem.name}...`);
            
            try {
                await bot.consume();
                console.log('\x1b[32m%s\x1b[0m', `[FOOD] Successfully ate ${foodItem.name}. Food level: ${bot.food}`);
            } catch (err) {
                console.log('\x1b[31m%s\x1b[0m', '[FOOD] Failed to eat:', err.message);
            }
            
            // Switch back to previous item if it exists
            if (previousItem) {
                await bot.equip(previousItem, 'hand');
                console.log('\x1b[32m%s\x1b[0m', `[ITEM] Switched back to ${previousItem.name}`);
            }

            bot.isEating = false;
        } catch (err) {
            console.log('\x1b[31m%s\x1b[0m', '[ERROR] Error while trying to eat:', err);
            bot.isEating = false;
        }
    }
}

function startHealthMonitor(bot) {
    setInterval(() => {
        checkHealth(bot);
    }, 1000);
}

function checkHealth(bot) {
    try {
        // Each heart is 2 health points
        const hearts = bot.health / 2;
        
        // If health is 4 hearts or less
        if (hearts <= 4) {
            console.log('\x1b[31m%s\x1b[0m', `[DANGER] Health is critically low (${hearts} hearts)! Disconnecting...`);
            bot.quit('[AUTO] Disconnected due to low health');
            
            // Wait 2 minutes before reconnecting to allow for regeneration/safety
            console.log('\x1b[33m%s\x1b[0m', '[BOT] Will attempt to reconnect in 2 minutes...');
            reconnectAttempts = 0; // Reset attempts for safety reconnect
            setTimeout(createBot, 120000); // 2 minutes
        } else if (hearts <= 7) {
            // Warning at 7 hearts
            console.log('\x1b[33m%s\x1b[0m', `[WARNING] Health is getting low (${hearts} hearts)`);
        }
    } catch (err) {
        console.log('\x1b[31m%s\x1b[0m', '[ERROR] Error checking health:', err);
    }
}

// Start bot with initial delay
console.log('\x1b[32m%s\x1b[0m', '[BOT] Starting...');
setTimeout(createBot, 5000);








