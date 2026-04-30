const player = {
    lv: 1, hp: 100, maxHp: 100, atk: 15, def: 5,
    exp: 0, needExp: 100, gold: 0,
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
    bossDefeated: 0
};

const zones = [
    { name: "森林", color: "#22c55e", monsters: [
        { name: "史莱姆", hp: 80, atk: 8, def: 2, exp: 20, gold: 10 },
        { name: "野狼", hp: 120, atk: 12, def: 4, exp: 35, gold: 20 },
        { name: "山贼", hp: 180, atk: 18, def: 6, exp: 60, gold: 40 }
    ], unlockLevel: 1 },
    { name: "草原", color: "#84cc16", monsters: [
        { name: "毒蛇", hp: 100, atk: 15, def: 3, exp: 40, gold: 25 },
        { name: "野猪", hp: 160, atk: 18, def: 5, exp: 55, gold: 35 },
        { name: "土匪头目", hp: 220, atk: 22, def: 8, exp: 80, gold: 55 }
    ], unlockLevel: 3 },
    { name: "洞穴", color: "#8b5cf6", monsters: [
        { name: "洞穴蝙蝠", hp: 150, atk: 20, def: 5, exp: 80, gold: 50 },
        { name: "石像鬼", hp: 250, atk: 25, def: 12, exp: 120, gold: 80 },
        { name: "毒蝎", hp: 200, atk: 30, def: 8, exp: 100, gold: 70 }
    ], unlockLevel: 5 },
    { name: "火山", color: "#f97316", monsters: [
        { name: "熔岩怪", hp: 280, atk: 32, def: 10, exp: 150, gold: 100 },
        { name: "火焰蜥蜴", hp: 350, atk: 38, def: 15, exp: 200, gold: 140 },
        { name: "火山巨魔", hp: 450, atk: 45, def: 20, exp: 280, gold: 200 }
    ], unlockLevel: 8 },
    { name: "冰原", color: "#06b6d4", monsters: [
        { name: "冰霜狼", hp: 320, atk: 35, def: 12, exp: 180, gold: 120 },
        { name: "雪巨人", hp: 420, atk: 42, def: 18, exp: 250, gold: 180 },
        { name: "冰龙", hp: 550, atk: 50, def: 25, exp: 350, gold: 280 }
    ], unlockLevel: 12 },
    { name: "暗夜城堡", color: "#6366f1", monsters: [
        { name: "骷髅战士", hp: 380, atk: 40, def: 15, exp: 220, gold: 160 },
        { name: "黑暗骑士", hp: 500, atk: 48, def: 22, exp: 320, gold: 240 },
        { name: "吸血鬼公爵", hp: 650, atk: 55, def: 28, exp: 420, gold: 350 }
    ], unlockLevel: 15 },
    { name: "天空之城", color: "#ec4899", monsters: [
        { name: "飞行魔像", hp: 480, atk: 45, def: 20, exp: 300, gold: 220 },
        { name: "雷电之神", hp: 600, atk: 55, def: 25, exp: 400, gold: 320 },
        { name: "天使长", hp: 800, atk: 65, def: 30, exp: 550, gold: 450 }
    ], unlockLevel: 18 },
    { name: "BOSS领域", color: "#ef4444", monsters: [
        { name: "暗影刺客", hp: 400, atk: 35, def: 10, exp: 200, gold: 150, highDodge: 15 },
        { name: "巨石魔像", hp: 600, atk: 40, def: 25, exp: 300, gold: 250 },
        { name: "巨龙", hp: 1000, atk: 50, def: 20, exp: 500, gold: 500 }
    ], unlockLevel: 10, isBossZone: true }
];

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
    { id: "a1", name: "初次冒险", desc: "击败第一只怪物", condition: function(p) { return p.killCount >= 1; }, reward: { gold: 20 }, unlocked: false },
    { id: "a2", name: "森林霸主", desc: "在森林击败20只怪物", condition: function(p) { return (p.zoneKills || {})[0] >= 20; }, reward: { exp: 200 }, unlocked: false },
    { id: "a3", name: "草原猎人", desc: "在草原击败20只怪物", condition: function(p) { return (p.zoneKills || {})[1] >= 20; }, reward: { exp: 300 }, unlocked: false },
    { id: "a4", name: "洞穴征服者", desc: "在洞穴击败20只怪物", condition: function(p) { return (p.zoneKills || {})[2] >= 20; }, reward: { exp: 500 }, unlocked: false },
    { id: "a5", name: "火山征服者", desc: "在火山击败20只怪物", condition: function(p) { return (p.zoneKills || {})[3] >= 20; }, reward: { exp: 600 }, unlocked: false },
    { id: "a6", name: "冰原探险家", desc: "在冰原击败20只怪物", condition: function(p) { return (p.zoneKills || {})[4] >= 20; }, reward: { exp: 700 }, unlocked: false },
    { id: "a7", name: "暗夜骑士团", desc: "在暗夜城堡击败20只怪物", condition: function(p) { return (p.zoneKills || {})[5] >= 20; }, reward: { exp: 800 }, unlocked: false },
    { id: "a8", name: "天空探索者", desc: "在天城击败20只怪物", condition: function(p) { return (p.zoneKills || {})[6] >= 20; }, reward: { exp: 1000 }, unlocked: false },
    { id: "a9", name: "屠龙者", desc: "击败巨龙", condition: function(p) { return p.bossDefeated >= 1; }, reward: { gold: 500, atk: 10 }, unlocked: false },
    { id: "a10", name: "万元户", desc: "累计获得2000金币", condition: function(p) { return p.totalGoldEarned >= 2000; }, reward: { exp: 500 }, unlocked: false },
    { id: "a11", name: "事件达人", desc: "触发30次随机事件", condition: function(p) { return p.eventCount >= 30; }, reward: { gold: 150 }, unlocked: false },
    { id: "a12", name: "任务完成者", desc: "完成15个任务", condition: function(p) { return p.questCompleted >= 15; }, reward: { exp: 1500 }, unlocked: false },
    { id: "a13", name: "升级达人", desc: "达到30级", condition: function(p) { return p.lv >= 30; }, reward: { atk: 20, def: 20 }, unlocked: false },
    { id: "a14", name: "世界征服者", desc: "累计击败200只怪物", condition: function(p) { return p.killCount >= 200; }, reward: { atk: 30, def: 30, hp: 200 }, unlocked: false }
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
    }}
];