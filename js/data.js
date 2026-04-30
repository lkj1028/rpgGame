const player = {
    lv: 1, hp: 100, maxHp: 100, atk: 15, def: 5, speed: 10,
    exp: 0, needExp: 100, gold: 50,
    crit: 5, dodge: 5,
    equipment: { weapon: null, armor: null, accessory: null },
    buffs: [],
    skills: [
        { name: "重击", desc: "1.5倍伤害", cd: 0, maxCd: 2, isReady: true },
        { name: "铁壁", desc: "防御+10", cd: 0, maxCd: 3, isReady: true },
        { name: "连击", desc: "连攻2次", cd: 0, maxCd: 4, isReady: true }
    ],
    currentZone: 0,
    killCount: 0,
    eventCount: 0,
    bossDefeated: 0,
    pet: { id: "slime", name: "史莱姆", sprite: "🟢", atk: 3, hp: 40, def: 3, speed: 5, rarity: "common" },
    skillPoints: 0,
    equipmentEnhanceLevels: { weapon: 0, armor: 0, accessory: 0 },
    learnedSkills: ["重击", "铁壁", "连击"],
    titles: []
};

const zones = [
    { name: "森林", color: "#22c55e", monsters: [
        { name: "史莱姆", sprite: "🟢", hp: 80, atk: 8, def: 2, exp: 20, gold: 10, speed: 5 },
        { name: "野狼", sprite: "🐺", hp: 120, atk: 12, def: 4, exp: 35, gold: 20, speed: 12 },
        { name: "山贼", sprite: "🏴‍☠️", hp: 180, atk: 18, def: 6, exp: 60, gold: 40, speed: 8 }
    ], unlockLevel: 1 },
    { name: "草原", color: "#84cc16", monsters: [
        { name: "毒蛇", sprite: "🐍", hp: 100, atk: 15, def: 3, exp: 40, gold: 25, speed: 15 },
        { name: "野猪", sprite: "🐗", hp: 160, atk: 18, def: 5, exp: 55, gold: 35, speed: 7 },
        { name: "土匪头目", sprite: "💀", hp: 220, atk: 22, def: 8, exp: 80, gold: 55, speed: 6 }
    ], unlockLevel: 3 },
    { name: "洞穴", color: "#8b5cf6", monsters: [
        { name: "洞穴蝙蝠", sprite: "🦇", hp: 150, atk: 20, def: 5, exp: 80, gold: 50, speed: 18 },
        { name: "石像鬼", sprite: "🗿", hp: 250, atk: 25, def: 12, exp: 120, gold: 80, speed: 3 },
        { name: "毒蝎", sprite: "🦂", hp: 200, atk: 30, def: 8, exp: 100, gold: 70, speed: 10 }
    ], unlockLevel: 5 },
    { name: "火山", color: "#f97316", monsters: [
        { name: "熔岩怪", sprite: "🔥", hp: 280, atk: 32, def: 10, exp: 150, gold: 100, speed: 4 },
        { name: "火焰蜥蜴", sprite: "🦎", hp: 350, atk: 38, def: 15, exp: 200, gold: 140, speed: 8 },
        { name: "火山巨魔", sprite: "👹", hp: 450, atk: 45, def: 20, exp: 280, gold: 200, speed: 3 }
    ], unlockLevel: 8 },
    { name: "冰原", color: "#06b6d4", monsters: [
        { name: "冰霜狼", sprite: "🐺", hp: 320, atk: 35, def: 12, exp: 180, gold: 120, speed: 14 },
        { name: "雪巨人", sprite: "❄️", hp: 420, atk: 42, def: 18, exp: 250, gold: 180, speed: 3 },
        { name: "冰龙", sprite: "🐉", hp: 550, atk: 50, def: 25, exp: 350, gold: 280, speed: 6 }
    ], unlockLevel: 12 },
    { name: "暗夜城堡", color: "#6366f1", monsters: [
        { name: "骷髅战士", sprite: "💀", hp: 380, atk: 40, def: 15, exp: 220, gold: 160, speed: 6 },
        { name: "黑暗骑士", sprite: "🖤", hp: 500, atk: 48, def: 22, exp: 320, gold: 240, speed: 8 },
        { name: "吸血鬼公爵", sprite: "🧛", hp: 650, atk: 55, def: 28, exp: 420, gold: 350, speed: 10 }
    ], unlockLevel: 15 },
    { name: "天空之城", color: "#ec4899", monsters: [
        { name: "飞行魔像", sprite: "🤖", hp: 480, atk: 45, def: 20, exp: 300, gold: 220, speed: 5 },
        { name: "雷电之神", sprite: "⚡", hp: 600, atk: 55, def: 25, exp: 400, gold: 320, speed: 15 },
        { name: "天使长", sprite: "👼", hp: 800, atk: 65, def: 30, exp: 550, gold: 450, speed: 12 }
    ], unlockLevel: 18 },
    { name: "BOSS领域", color: "#ef4444", monsters: [
        { name: "暗影刺客", sprite: "🌑", hp: 400, atk: 35, def: 10, exp: 200, gold: 150, speed: 20, highDodge: 15 },
        { name: "巨石魔像", sprite: "🗿", hp: 600, atk: 40, def: 25, exp: 300, gold: 250, speed: 3 },
        { name: "巨龙", sprite: "🐲", hp: 1000, atk: 50, def: 20, exp: 500, gold: 500, speed: 8 }
    ], unlockLevel: 10, isBossZone: true }
];

const pets = [
    { id: "littleWolf", name: "小狼", sprite: "🐕", atk: 5, hp: 30, def: 2, rarity: "common", zone: 0, evolveReq: { kills: 10, petId: "adultWolf" } },
    { id: "adultWolf", name: "成年狼", sprite: "🐺", atk: 12, hp: 60, def: 5, rarity: "rare", zone: 2, evolveReq: { kills: 30, petId: "wolfKing" } },
    { id: "wolfKing", name: "狼王", sprite: "🐺‍👑", atk: 25, hp: 120, def: 15, rarity: "epic", zone: 5, evolveReq: null },

    { id: "slime", name: "史莱姆", sprite: "🟢", atk: 3, hp: 40, def: 3, rarity: "common", zone: 0, evolveReq: { kills: 10, petId: "blueSlime" } },
    { id: "blueSlime", name: "蓝史莱姆", sprite: "🟦", atk: 8, hp: 70, def: 8, rarity: "rare", zone: 2, evolveReq: { kills: 30, petId: "slimeKing" } },
    { id: "slimeKing", name: "史莱姆王", sprite: "👑", atk: 18, hp: 150, def: 20, rarity: "legend", zone: 6, evolveReq: null },

    { id: "bird", name: "小鸟", sprite: "🐦", atk: 4, hp: 25, def: 1, rarity: "common", zone: 0, evolveReq: { kills: 10, petId: "eagle" } },
    { id: "eagle", name: "老鹰", sprite: "🦅", atk: 15, hp: 55, def: 8, rarity: "rare", zone: 3, evolveReq: { kills: 30, petId: "phoenix" } },
    { id: "phoenix", name: "凤凰", sprite: "🔥", atk: 30, hp: 180, def: 25, rarity: "legend", zone: 7, evolveReq: null },

    { id: "fireSpirit", name: "火精灵", sprite: "🔥", atk: 8, hp: 40, def: 3, rarity: "rare", zone: 3, evolveReq: { kills: 25, petId: "fireElemental" } },
    { id: "fireElemental", name: "火元素", sprite: "🌋", atk: 22, hp: 100, def: 12, rarity: "epic", zone: 5, evolveReq: null },

    { id: "iceSpirit", name: "冰精灵", sprite: "❄️", atk: 7, hp: 45, def: 4, rarity: "rare", zone: 4, evolveReq: { kills: 25, petId: "iceElemental" } },
    { id: "iceElemental", name: "冰元素", sprite: "🧊", atk: 20, hp: 110, def: 15, rarity: "epic", zone: 6, evolveReq: null },

    { id: "iceFox", name: "冰狐狸", sprite: "🦊", atk: 10, hp: 50, def: 5, rarity: "rare", zone: 4, evolveReq: { kills: 25, petId: "nineTails" } },
    { id: "nineTails", name: "九尾狐", sprite: "🦊", atk: 28, hp: 140, def: 18, rarity: "legend", zone: 7, evolveReq: null },

    { id: "shadowCat", name: "暗影猫", sprite: "🐈‍⬛", atk: 15, hp: 60, def: 8, rarity: "epic", zone: 5, evolveReq: { kills: 20, petId: "nightLord" } },
    { id: "nightLord", name: "暗夜领主", sprite: "🌑", atk: 35, hp: 160, def: 25, rarity: "legend", zone: 7, evolveReq: null },

    { id: "darkWizard", name: "暗之法师", sprite: "🧙", atk: 18, hp: 70, def: 10, rarity: "epic", zone: 6, evolveReq: { kills: 20, petId: "archmage" } },
    { id: "archmage", name: "大魔导师", sprite: "🧙‍♂️", atk: 40, hp: 200, def: 30, rarity: "legend", zone: 8, evolveReq: null },

    { id: "dragon", name: "幼龙", sprite: "🐲", atk: 20, hp: 100, def: 15, rarity: "legend", zone: 7, evolveReq: { kills: 15, petId: "dragonKing" } },
    { id: "dragonKing", name: "龙皇", sprite: "🐉", atk: 50, hp: 300, def: 40, rarity: "mythic", zone: 8, evolveReq: null }
];

var petInventory = [];
var petKillCount = {};

const skillTree = {
    attack: {
        name: "攻击系",
        skills: [
            { id: "heavyStrike", name: "重击", desc: "造成1.5倍伤害", cost: 0, maxCd: 2, type: "active", unlocked: true },
            { id: "doubleStrike", name: "双重打击", desc: "攻击2次", cost: 1, maxCd: 4, type: "active", unlocked: false, requires: "heavyStrike" },
            { id: "execute", name: "处决", desc: "对血量低于30%的敌人伤害+50%", cost: 2, maxCd: 5, type: "passive", unlocked: false, requires: "doubleStrike" },
            { id: "berserk", name: "狂暴", desc: "血量越低攻击越高", cost: 3, maxCd: 0, type: "passive", unlocked: false, requires: "execute" }
        ]
    },
    defense: {
        name: "防御系",
        skills: [
            { id: "ironWall", name: "铁壁", desc: "防御+10", cost: 0, maxCd: 3, type: "active", unlocked: true },
            { id: "shieldBlock", name: "盾墙", desc: "完全抵挡一次攻击", cost: 1, maxCd: 6, type: "active", unlocked: false, requires: "ironWall" },
            { id: "counter", name: "反击", desc: "受击时反弹20%伤害", cost: 2, maxCd: 0, type: "passive", unlocked: false, requires: "shieldBlock" },
            { id: "fortress", name: "堡垒", desc: "防御+15%，每回合恢复2%血量", cost: 3, maxCd: 0, type: "passive", unlocked: false, requires: "counter" }
        ]
    },
    utility: {
        name: "辅助系",
        skills: [
            { id: "combo", name: "连击", desc: "连续攻击2次", cost: 0, maxCd: 4, type: "active", unlocked: true },
            { id: "swift", name: "疾风", desc: "闪避率+10%", cost: 1, maxCd: 0, type: "passive", unlocked: false, requires: "combo" },
            { id: "secondWind", name: "喘息", desc: "死亡时恢复30%血量(每战斗1次)", cost: 2, maxCd: 0, type: "passive", unlocked: false, requires: "swift" },
            { id: "secondLife", name: "第二条命", desc: "致命伤害时不死(每战斗1次)", cost: 3, maxCd: 0, type: "passive", unlocked: false, requires: "secondWind" }
        ]
    }
};

const equipPool = {
    weapon: [
        { name: "铁剑", atk: 5, price: 50 },
        { name: "钢剑", atk: 10, crit: 5, price: 120 },
        { name: "炎魔之刃", atk: 18, crit: 10, price: 300 },
        { name: "龙息剑", atk: 25, crit: 15, price: 600 }
    ],
    armor: [
        { name: "皮甲", def: 5, price: 50 },
        { name: "锁子甲", def: 10, hp: 20, price: 120 },
        { name: "骑士板甲", def: 18, hp: 50, price: 300 },
        { name: "龙鳞护甲", def: 25, hp: 100, dodge: 5, price: 600 }
    ],
    accessory: [
        { name: "敏捷戒指", dodge: 8, price: 80 },
        { name: "暴击戒指", crit: 10, price: 100 },
        { name: "生命护符", hp: 30, maxHp: 30, price: 150 },
        { name: "龙心坠", crit: 8, dodge: 8, hp: 50, price: 400 }
    ]
};

const quests = [
    { id: "q1", name: "初出茅庐", desc: "击败5只怪物", target: 5, progress: 0, reward: { gold: 50, exp: 100 }, zone: 0, completed: false },
    { id: "q2", name: "森林探索者", desc: "在森林击败10只怪物", target: 10, progress: 0, reward: { gold: 100, exp: 200 }, zone: 0, completed: false },
    { id: "q3", name: "草原猎人", desc: "在草原击败10只怪物", target: 10, progress: 0, reward: { gold: 150, exp: 250 }, zone: 1, completed: false },
    { id: "q4", name: "洞穴探险家", desc: "在洞穴击败10只怪物", target: 10, progress: 0, reward: { gold: 200, crit: 3 }, zone: 2, completed: false },
    { id: "q5", name: "火山征服者", desc: "在火山击败10只怪物", target: 10, progress: 0, reward: { gold: 300, atk: 5 }, zone: 3, completed: false },
    { id: "q6", name: "冰原冒险家", desc: "在冰原击败10只怪物", target: 10, progress: 0, reward: { gold: 400, def: 5 }, zone: 4, completed: false },
    { id: "q7", name: "暗夜骑士", desc: "在暗夜城堡击败10只怪物", target: 10, progress: 0, reward: { gold: 500, hp: 30 }, zone: 5, completed: false },
    { id: "q8", name: "天空探索者", desc: "在天城击败10只怪物", target: 10, progress: 0, reward: { gold: 600, crit: 3, dodge: 3 }, zone: 6, completed: false },
    { id: "q9", name: "屠龙勇士", desc: "击败巨龙", target: 1, progress: 0, reward: { gold: 1000, atk: 10, def: 10 }, zone: 7, completed: false, isBossQuest: true },
    { id: "q10", name: "富甲一方", desc: "拥有1000金币", target: 1000, progress: 0, reward: { exp: 500 }, isGoldQuest: true },
    { id: "q11", name: "连胜达人", desc: "连续击败5只怪物不逃跑", target: 5, progress: 0, reward: { dodge: 5, hp: 30 }, zone: -1, completed: false },
    { id: "q12", name: "世界征服者", desc: "累计击败100只怪物", target: 100, progress: 0, reward: { atk: 20, def: 20, hp: 100 }, zone: -2, completed: false }
];

const achievements = [
    { id: "a1", name: "初次冒险", desc: "击败第一只怪物", title: "冒险者", condition: function(p) { return p.killCount >= 1; }, reward: { gold: 20, item: "healthPotion" }, unlocked: false },
    { id: "a2", name: "森林霸主", desc: "在森林击败20只怪物", title: "森林猎手", condition: function(p) { return (p.zoneKills || {})[0] >= 20; }, reward: { gold: 100, item: "attackScroll" }, unlocked: false },
    { id: "a3", name: "草原猎人", desc: "在草原击败20只怪物", title: "草原勇士", condition: function(p) { return (p.zoneKills || {})[1] >= 20; }, reward: { gold: 150, item: "defenseScroll" }, unlocked: false },
    { id: "a4", name: "洞穴征服者", desc: "在洞穴击败20只怪物", title: "洞穴探索者", condition: function(p) { return (p.zoneKills || {})[2] >= 20; }, reward: { gold: 200, item: "critCrystal" }, unlocked: false },
    { id: "a5", name: "火山征服者", desc: "在火山击败20只怪物", title: "火焰战士", condition: function(p) { return (p.zoneKills || {})[3] >= 20; }, reward: { gold: 300, item: "highHealthPotion" }, unlocked: false },
    { id: "a6", name: "冰原探险家", desc: "在冰原击败20只怪物", title: "寒冰勇者", condition: function(p) { return (p.zoneKills || {})[4] >= 20; }, reward: { gold: 400, item: "luckyCoin" }, unlocked: false },
    { id: "a7", name: "暗夜骑士团", desc: "在暗夜城堡击败20只怪物", title: "暗夜骑士", condition: function(p) { return (p.zoneKills || {})[5] >= 20; }, reward: { gold: 500, item: "resurrectionScroll" }, unlocked: false },
    { id: "a8", name: "天空探索者", desc: "在天城击败20只怪物", title: "天空使者", condition: function(p) { return (p.zoneKills || {})[6] >= 20; }, reward: { gold: 800, item: "highHealthPotion" }, unlocked: false },
    { id: "a9", name: "屠龙者", desc: "击败巨龙", title: "龙骑士", condition: function(p) { return p.bossDefeated >= 1; }, reward: { gold: 500, item: "resurrectionScroll" }, unlocked: false },
    { id: "a10", name: "万元户", desc: "累计获得2000金币", title: "富甲一方", condition: function(p) { return p.totalGoldEarned >= 2000; }, reward: { gold: 200, item: "attackScroll" }, unlocked: false },
    { id: "a11", name: "事件达人", desc: "触发30次随机事件", title: "命运眷顾", condition: function(p) { return p.eventCount >= 30; }, reward: { gold: 150, item: "luckyCoin" }, unlocked: false },
    { id: "a12", name: "任务完成者", desc: "完成15个任务", title: "任务大师", condition: function(p) { return p.questCompleted >= 15; }, reward: { exp: 1500, item: "highHealthPotion" }, unlocked: false },
    { id: "a13", name: "升级达人", desc: "达到30级", title: "巅峰强者", condition: function(p) { return p.lv >= 30; }, reward: { atk: 20, def: 20, item: "attackScroll" }, unlocked: false },
    { id: "a14", name: "世界征服者", desc: "累计击败200只怪物", title: "天下无敌", condition: function(p) { return p.killCount >= 200; }, reward: { atk: 30, def: 30, hp: 200, item: "resurrectionScroll" }, unlocked: false },
    { id: "a15", name: "宠物训练师", desc: "获得第一只宠物", title: "驯兽师", condition: function(p) { return p.pet !== null; }, reward: { gold: 50 }, unlocked: false },
    { id: "a16", name: "宠物进化家", desc: "让宠物进化一次", title: "培育专家", condition: function(p) { return p.pet && p.pet.id !== "slime" && p.pet.id !== "littleWolf" && p.pet.id !== "bird"; }, reward: { gold: 300, item: "highHealthPotion" }, unlocked: false }
];

const randomEvents = [
    { id: "e1", name: "发现宝箱", type: "choice", desc: "你发现了一个宝箱！", effect: function() {
        var gold = Math.floor(Math.random() * 50) + 20;
        player.gold += gold;
        addLog("🎁 开启宝箱，获得 " + gold + " 金币！", 'event');
    }},
    { id: "e2", name: "老练商人", type: "choice", desc: "一个商人向你推销物品", effect: function() {
        var healAmount = 50;
        player.hp = Math.min(getTotalMaxHp(), player.hp + healAmount);
        addLog("🧪 商人赠送药水，恢复 " + healAmount + " 血量！", 'event');
    }},
    { id: "e3", name: "陷阱", type: "danger", desc: "你不小心踩到了陷阱！", effect: function() {
        var dmg = Math.floor(Math.random() * 20) + 10;
        player.hp -= dmg;
        addLog("⚠️ 陷阱造成 " + dmg + " 点伤害！", 'damage');
    }},
    { id: "e4", name: "神秘祝福", type: "buff", desc: "获得神秘力量的祝福", effect: function() {
        player.buffs.push({ name: '祝福', type: 'buff', turns: 3, onTurnEnd: function(p) {
            p.hp = Math.min(getTotalMaxHp(), p.hp + 5);
        }});
        addLog("✨ 获得祝福：每回合恢复5血量，持续3回合！", 'buff');
    }},
    { id: "e5", name: "诅咒", type: "debuff", desc: "遭遇黑暗力量侵蚀", effect: function() {
        player.buffs.push({ name: '诅咒', type: 'debuff', turns: 3, onTurnEnd: function(p) {
            p.atk = Math.max(1, p.atk - 2);
        }});
        addLog("💀 受到诅咒：攻击-2，持续3回合！", 'debuff');
    }},
    { id: "e6", name: "经验泉水", type: "choice", desc: "发现一口神奇的泉水", effect: function() {
        var expGain = Math.floor(Math.random() * 30) + 20;
        player.exp += expGain;
        checkLevelUp();
        addLog("📚 饮用泉水，获得 " + expGain + " 经验！", 'event');
    }},
    { id: "e7", name: "盗贼袭击", type: "danger", desc: "遭遇盗贼团袭击！", effect: function() {
        var goldLost = Math.floor(player.gold * 0.2);
        player.gold -= goldLost;
        addLog("💰 盗贼抢走了 " + goldLost + " 金币！", 'damage');
    }},
    { id: "e8", name: "修行顿悟", type: "buff", desc: "战斗中突然顿悟", effect: function() {
        player.atk += 3;
        player.def += 2;
        addLog("🧘 顿悟：攻击+3，防御+2！（本次战斗）", 'buff');
    }}
];

var nowMonster = { buffs: [] };
var currentEvent = null;
var consecutiveKills = 0;
var zoneKills = [0, 0, 0, 0, 0, 0, 0, 0];
var battleUsedSkills = { secondWind: false, secondLife: false };
var totalGoldEarned = 0;
var questCompleted = 0;
var autoSaveTimer = null;
var gameSettings = {
    soundEnabled: true,
    battleSpeed: 1
};
var inventory = [];
var discoveredMonsters = {};

var items = [
    { id: "healthPotion", name: "治疗药水", desc: "恢复30点血量", type: "consumable", effect: function() {
        if (player.hp >= getTotalMaxHp()) return false;
        player.hp = Math.min(getTotalMaxHp(), player.hp + 30);
        return true;
    }},
    { id: "superHealthPotion", name: "高级治疗药水", desc: "恢复80点血量", type: "consumable", effect: function() {
        if (player.hp >= getTotalMaxHp()) return false;
        player.hp = Math.min(getTotalMaxHp(), player.hp + 80);
        return true;
    }},
    { id: "attackScroll", name: "力量卷轴", desc: "攻击+3(战斗)", type: "consumable", effect: function() {
        player.buffs.push({ name: '力量', type: 'buff', turns: 3, onTurnEnd: function(p, isPlayer) {
            if (isPlayer) p.atk += 3;
        }});
        return true;
    }},
    { id: "defenseScroll", name: "护盾卷轴", desc: "防御+5(战斗)", type: "consumable", effect: function() {
        player.buffs.push({ name: '护盾', type: 'buff', turns: 3, onTurnEnd: function(p, isPlayer) {
            if (isPlayer) p.def += 5;
        }});
        return true;
    }},
    { id: "critCrystal", name: "暴击水晶", desc: "本场战斗暴击率+15%", type: "consumable", effect: function() {
        player.buffs.push({ name: '暴击水晶', type: 'buff', turns: 999, onApply: function() { player.crit += 15; }, onRemove: function() { player.crit -= 15; }});
        return true;
    }},
    { id: "goldCoin", name: "幸运金币", desc: "下只怪物金币+50%", type: "consumable", effect: function() {
        player.buffs.push({ name: '幸运', type: 'buff', turns: 1 });
        return true;
    }},
    { id: "antidote", name: "解毒药", desc: "解除当前诅咒", type: "consumable", effect: function() {
        var idx = player.buffs.findIndex(function(b) { return b.name === '诅咒'; });
        if (idx >= 0) { player.buffs.splice(idx, 1); return true; }
        return false;
    }},
    { id: "resurrectionScroll", name: "复活卷轴", desc: "死亡时自动复活并恢复50%血量", type: "consumable", effect: function() {
        player.buffs.push({ name: '复活', type: 'buff', turns: 999 });
        return true;
    }},
    { id: "petUpgradeFruit", name: "宠物升级果实", desc: "使用后宠物属性+10%", type: "consumable", effect: function() {
        if (!player.pet) { addLog("你没有伙伴！"); return false; }
        player.pet.atk = Math.floor(player.pet.atk * 1.1);
        player.pet.def = Math.floor(player.pet.def * 1.1);
        player.pet.hp = Math.floor(player.pet.hp * 1.1);
        addLog("🍎 宠物【" + player.pet.name + "】属性提升10%！", 'buff');
        return true;
    }}
];