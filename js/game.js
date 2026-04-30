var logDom = document.getElementById('log');

function addLog(text, type) {
    var p = document.createElement('p');
    p.innerHTML = text;
    if (type) p.className = type;
    logDom.appendChild(p);
    logDom.scrollTop = logDom.scrollHeight;
}

function getTotalAtk() {
    var atk = player.atk;
    if (player.equipment.weapon) atk += player.equipment.weapon.atk;
    return atk;
}

function getTotalDef() {
    var def = player.def;
    if (player.equipment.armor) def += player.equipment.armor.def;
    return def;
}

function getTotalCrit() {
    var crit = player.crit;
    if (player.equipment.weapon && player.equipment.weapon.crit) crit += player.equipment.weapon.crit;
    if (player.equipment.accessory && player.equipment.accessory.crit) crit += player.equipment.accessory.crit;
    return crit;
}

function getTotalDodge() {
    var dodge = player.dodge;
    if (player.equipment.armor && player.equipment.armor.dodge) dodge += player.equipment.armor.dodge;
    if (player.equipment.accessory && player.equipment.accessory.dodge) dodge += player.equipment.accessory.dodge;
    return dodge;
}

function getTotalMaxHp() {
    var maxHp = player.maxHp;
    if (player.equipment.armor && player.equipment.armor.maxHp) maxHp += player.equipment.armor.maxHp;
    if (player.equipment.accessory && player.equipment.accessory.maxHp) maxHp += player.equipment.accessory.maxHp;
    return maxHp;
}

function switchZone(index) {
    if (player.lv < zones[index].unlockLevel) {
        addLog("需要达到 " + zones[index].unlockLevel + " 级才能进入" + zones[index].name + "！", 'debuff');
        return;
    }
    if (player.currentZone === index) return;
    player.currentZone = index;
    nowMonster = { buffs: [] };
    addLog("📍 切换到【" + zones[index].name + "】，遭遇更强的怪物！");
    updateUI();
}

function updateEquipSlots() {
    var weaponSlot = document.getElementById('weaponSlot');
    var armorSlot = document.getElementById('armorSlot');
    var accessorySlot = document.getElementById('accessorySlot');

    if (player.equipment.weapon) {
        weaponSlot.innerHTML = "<span class=\"slot-name\">⚔️ 武器</span><span class=\"item-name\">" + player.equipment.weapon.name + "</span><span class=\"item-stats\">+" + player.equipment.weapon.atk + "攻击</span>";
    } else {
        weaponSlot.innerHTML = "<span class=\"slot-name\">⚔️ 武器</span><span class=\"item-name\">无</span>";
    }
    if (player.equipment.armor) {
        armorSlot.innerHTML = "<span class=\"slot-name\">🛡️ 防具</span><span class=\"item-name\">" + player.equipment.armor.name + "</span><span class=\"item-stats\">+" + player.equipment.armor.def + "防御</span>";
    } else {
        armorSlot.innerHTML = "<span class=\"slot-name\">🛡️ 防具</span><span class=\"item-name\">无</span>";
    }
    if (player.equipment.accessory) {
        accessorySlot.innerHTML = "<span class=\"slot-name\">💍 饰品</span><span class=\"item-name\">" + player.equipment.accessory.name + "</span><span class=\"item-stats\">已装备</span>";
    } else {
        accessorySlot.innerHTML = "<span class=\"slot-name\">💍 饰品</span><span class=\"item-name\">无</span>";
    }
}

function updateBuffs() {
    document.getElementById('playerBuffs').innerHTML = player.buffs.map(function(b) { return "<span class=\"" + b.type + "-item\">" + b.name + ":" + b.turns + "回合</span>"; }).join('');
    player.buffs.forEach(function(b) {
        if (b.onTurnEnd && !b.activated) {
            b.onTurnEnd(player, true);
            b.activated = true;
        }
    });
    player.buffs = player.buffs.filter(function(b) {
        b.turns--;
        if (b.onTurnEnd && b.activated) {
            b.onTurnEnd(player, true);
        }
        return b.turns > 0;
    });
}

function updateSkillButtons() {
    player.skills.forEach(function(skill, i) {
        var btn = document.getElementById('skill' + i + 'Btn');
        if (skill.isReady) {
            btn.disabled = false;
            btn.className = 'skill-btn';
        } else {
            btn.disabled = true;
            btn.className = 'skill-btn on-cooldown';
        }
    });
}

function updateQuests() {
    player.zoneKills = zoneKills;
    player.totalGoldEarned = totalGoldEarned;
    player.questCompleted = questCompleted;

    quests.forEach(function(q) {
        if (q.isGoldQuest) {
            q.progress = player.gold;
        } else if (q.isBossQuest) {
            q.progress = player.bossDefeated;
        } else if (q.zone === -1) {
            q.progress = consecutiveKills;
        } else if (q.zone !== undefined) {
            q.progress = zoneKills[q.zone] || 0;
        }
    });

    var questList = document.getElementById('questList');
    questList.innerHTML = quests.map(function(q) {
        var canComplete = q.progress >= q.target && !q.completed;
        var rewardText = [];
        if (q.reward.gold) rewardText.push(q.reward.gold + "金币");
        if (q.reward.exp) rewardText.push(q.reward.exp + "经验");
        if (q.reward.atk) rewardText.push("攻击+" + q.reward.atk);
        if (q.reward.def) rewardText.push("防御+" + q.reward.def);
        if (q.reward.crit) rewardText.push("暴击+" + q.reward.crit + "%");
        if (q.reward.dodge) rewardText.push("闪避+" + q.reward.dodge + "%");
        if (q.reward.hp) rewardText.push("血量+" + q.reward.hp);

        return "<div class=\"quest-item " + (q.completed ? 'completed' : '') + "\">" +
            "<div class=\"quest-name\">" + q.name + (canComplete ? "<button onclick=\"claimQuest('" + q.id + "')\" style=\"padding:2px 6px;font-size:10px;background:#22c55e;\">领取</button>" : '') + "</div>" +
            "<div class=\"quest-desc\">" + q.desc + "</div>" +
            "<div class=\"quest-progress\">进度: " + Math.min(q.progress, q.target) + "/" + q.target + "</div>" +
            "<div class=\"quest-reward\">奖励: " + rewardText.join(', ') + "</div>" +
            "</div>";
    }).join('');
}

function claimQuest(qid) {
    var q = quests.find(function(q) { return q.id === qid; });
    if (!q || q.completed || q.progress < q.target) return;

    q.completed = true;
    questCompleted++;

    if (q.reward.gold) {
        player.gold += q.reward.gold;
        totalGoldEarned += q.reward.gold;
    }
    if (q.reward.exp) {
        player.exp += q.reward.exp;
        checkLevelUp();
    }
    if (q.reward.atk) player.atk += q.reward.atk;
    if (q.reward.def) player.def += q.reward.def;
    if (q.reward.crit) player.crit += q.reward.crit;
    if (q.reward.dodge) player.dodge += q.reward.dodge;
    if (q.reward.hp) {
        player.maxHp += q.reward.hp;
        player.hp += q.reward.hp;
    }

    addLog("📜 任务【" + q.name + "】完成！奖励已发放！", 'quest');
    checkAchievements();
    updateUI();
}

function updateAchievements() {
    var achieveBar = document.getElementById('achieveBar');
    achieveBar.innerHTML = achievements.map(function(a) {
        return "<div class=\"achieve-item " + (a.unlocked ? 'unlocked' : 'locked') + "\" title=\"" + a.desc + "\">" + a.name + "</div>";
    }).join('');

    var unlockedDiv = document.getElementById('unlockedAchieves');
    var unlocked = achievements.filter(function(a) { return a.unlocked; });
    if (unlocked.length > 0) {
        unlockedDiv.innerHTML = unlocked.map(function(a) { return "<span style=\"color:#fbbf14;margin-right:8px;\">🏅" + a.name + "</span>"; }).join('');
    } else {
        unlockedDiv.innerHTML = '<span style="color:#666;">暂无成就</span>';
    }
}

function checkAchievements() {
    achievements.forEach(function(a) {
        if (!a.unlocked && a.condition(player)) {
            a.unlocked = true;
            if (a.reward.gold) {
                player.gold += a.reward.gold;
                totalGoldEarned += a.reward.gold;
            }
            if (a.reward.exp) {
                player.exp += a.reward.exp;
                checkLevelUp();
            }
            if (a.reward.atk) player.atk += a.reward.atk;
            if (a.reward.def) player.def += a.reward.def;
            if (a.reward.crit) player.crit += a.reward.crit;
            if (a.reward.dodge) player.dodge += a.reward.dodge;
            if (a.reward.hp) {
                player.maxHp += a.reward.hp;
                player.hp += a.reward.hp;
            }
            addLog("🏆 成就解锁【" + a.name + "】：" + a.desc + "！奖励已发放！", 'achievement');
        }
    });
}

function newMonster() {
    var zone = zones[player.currentZone];
    var rand = Math.floor(Math.random() * zone.monsters.length);
    var template = zone.monsters[rand];
    var levelBonus = Math.max(0, player.lv - zone.unlockLevel);
    var monsterLevel = zone.unlockLevel + levelBonus;

    nowMonster = {
        name: template.name,
        hp: template.hp + levelBonus * 20,
        maxHp: template.hp + levelBonus * 20,
        atk: template.atk + levelBonus * 3,
        def: template.def + levelBonus * 2,
        exp: template.exp,
        gold: template.gold,
        zoneLevel: monsterLevel,
        buffs: [],
        tempDefBoost: 0,
        highDodge: template.highDodge
    };
    addLog("👹 遇到了Lv." + monsterLevel + "【" + nowMonster.name + "】！准备战斗");
    updateUI();
}

function attack(isMulti) {
    if (!nowMonster.name) return addLog("请先寻找怪物！");

    var tempDefBoost = 0;
    player.buffs = player.buffs.filter(function(b) {
        if (b.name === '铁壁') {
            tempDefBoost = 10;
            addLog("🛡️ 铁壁效果：防御临时+10", 'buff');
            return false;
        }
        if (b.name === '诅咒') return true;
        return true;
    });

    var isCrit = Math.random() * 100 < getTotalCrit();
    var dmg = Math.max(1, getTotalAtk() - nowMonster.def - nowMonster.tempDefBoost);
    if (isCrit) dmg = Math.floor(dmg * 1.5);

    nowMonster.hp -= dmg;
    addLog((isMulti ? '⚔️ 连击第' + isMulti + '次：' : '') + "你对【" + nowMonster.name + "】造成 <span class=\"damage\">" + dmg + "</span> 点伤害" + (isCrit ? ' <span class=\"crit\">【暴击！】</span>' : ''));

    if (nowMonster.hp <= 0) {
        monsterDefeated();
        return;
    }

    monsterCounterAttack(tempDefBoost);
    processBuffs(nowMonster, false);
    updateSkillCooldowns();
    updateUI();
}

function monsterCounterAttack(playerTempDef) {
    if (Math.random() * 100 < getTotalDodge()) {
        addLog("⚡ 你发动闪避，【" + nowMonster.name + "】的攻击落空！", 'dodge');
        return;
    }

    var monsterDodge = nowMonster.highDodge || 0;
    if (Math.random() * 100 < monsterDodge) {
        addLog("【" + nowMonster.name + "】发动闪避，攻击落空！", 'dodge');
        return;
    }

    var dmg = Math.max(1, nowMonster.atk - getTotalDef() - playerTempDef);
    player.hp -= dmg;
    addLog("【" + nowMonster.name + "】反击，你受到 <span class=\"damage\">" + dmg + "</span> 点伤害");

    if (player.hp <= 0) {
        var hasResurrection = player.buffs.some(function(b) { return b.name === '复活'; });
        if (hasResurrection) {
            player.hp = Math.floor(getTotalMaxHp() * 0.5);
            player.buffs = player.buffs.filter(function(b) { return b.name !== '复活'; });
            addLog("✨ 复活卷轴生效！你恢复" + Math.floor(getTotalMaxHp() * 0.5) + "点血量！", 'heal');
            updateUI();
            return;
        }
        addLog("💀 你被击败了！游戏重置...");
        consecutiveKills = 0;
        saveScore();
        setTimeout(function() { location.reload(); }, 1500);
    }
}

function monsterDefeated() {
    var zone = zones[player.currentZone];
    addLog("【" + nowMonster.name + "】被击败！获得 <span class=\"gold\">" + nowMonster.exp + "经验、" + nowMonster.gold + "金币</span>");

    var monsterKey = nowMonster.name + '_' + player.currentZone;
    if (!discoveredMonsters[monsterKey]) {
        discoveredMonsters[monsterKey] = { name: nowMonster.name, zone: player.currentZone, count: 1, firstDefeat: new Date().toLocaleDateString() };
        addLog("📖 图鉴更新：发现新怪物【" + nowMonster.name + "】！", 'achievement');
    } else {
        discoveredMonsters[monsterKey].count++;
    }

    var goldBonus = nowMonster.gold;
    if (player.buffs.some(function(b) { return b.name === '幸运'; })) goldBonus = Math.floor(goldBonus * 1.5);

    if (Math.random() < 0.15) {
        var droppableItems = items.filter(function(i) { return ['healthPotion', 'attackScroll', 'defenseScroll'].indexOf(i.id) >= 0; });
        var randomItem = droppableItems[Math.floor(Math.random() * droppableItems.length)];
        addItemToInventory(randomItem.id);
        addLog("🎁 战利品：获得【" + randomItem.name + "】！", 'event');
    }

    player.exp += nowMonster.exp;
    player.gold += goldBonus;
    totalGoldEarned += goldBonus;
    player.killCount++;
    zoneKills[player.currentZone]++;
    consecutiveKills++;

    if (zone.isBossZone && (nowMonster.name === '巨龙' || nowMonster.name === '巨石魔像' || nowMonster.name === '暗影刺客')) {
        player.bossDefeated++;
    }

    checkLevelUp();
    checkAchievements();
    updateQuests();

    nowMonster = { buffs: [] };
    updateUI();
}

function checkLevelUp() {
    while (player.exp >= player.needExp) {
        player.exp -= player.needExp;
        player.lv++;
        player.maxHp += 20;
        player.hp = Math.min(player.hp + 20, player.maxHp);
        player.atk += 5;
        player.def += 2;
        player.needExp = Math.floor(player.needExp * 1.5);
        addLog("<span class=\"levelup\">🎉升级！当前等级：" + player.lv + "，属性提升</span>");
    }
    updateZoneButtons();
}

function useSkill(index) {
    if (!nowMonster.name) return addLog("请先寻找怪物！");
    var skill = player.skills[index];
    if (!skill.isReady) return addLog(skill.name + "冷却中！");

    skill.isReady = false;
    skill.cd = skill.maxCd;

    if (index === 0) {
        var isCrit = Math.random() * 100 < getTotalCrit();
        var dmg = Math.max(1, Math.floor(getTotalAtk() * 1.5) - nowMonster.def);
        if (isCrit) dmg = Math.floor(dmg * 1.5);
        nowMonster.hp -= dmg;
        addLog("💥 使用【重击】！造成 <span class=\"damage\">" + dmg + "</span> 点伤害" + (isCrit ? ' <span class=\"crit\">【暴击！】</span>' : ''));
    } else if (index === 1) {
        player.buffs.push({
            name: '铁壁',
            type: 'buff',
            turns: 2,
            onApply: function() { addLog("🛡️ 进入铁壁姿态，下回合防御+10"); }
        });
        addLog("🛡️ 使用【铁壁】！获得护盾，防御临时+10，持续2回合", 'buff');
    } else if (index === 2) {
        addLog("⚔️ 使用【连击】！");
        attack(1);
        if (nowMonster.name) attack(2);
        return;
    }

    if (nowMonster.hp <= 0) {
        monsterDefeated();
        return;
    }

    monsterCounterAttack(0);
    processBuffs(nowMonster, false);
    updateSkillCooldowns();
    updateUI();
}

function updateSkillCooldowns() {
    player.skills.forEach(function(skill) {
        if (!skill.isReady) {
            skill.cd--;
            if (skill.cd <= 0) {
                skill.isReady = true;
                addLog("⚡ 技能【" + skill.name + "】冷却完毕！", 'buff');
            }
        }
    });
}

function processBuffs(creature, isPlayer) {
    creature.buffs = creature.buffs.filter(function(b) {
        b.turns--;
        if (b.onTurnEnd) b.onTurnEnd(creature, isPlayer);
        return b.turns > 0;
    });
}

function heal() {
    var cost = 5;
    var healAmount = 30;
    if (player.gold < cost) return addLog("金币不足，无法回血！");
    player.gold -= cost;
    player.hp = Math.min(getTotalMaxHp(), player.hp + healAmount);
    addLog("❤️ 消耗" + cost + "金币，恢复" + healAmount + "点血量");
    updateUI();
}

function run() {
    consecutiveKills = 0;
    if (nowMonster.name && Math.random() < 0.5) {
        addLog("🏃 逃跑失败！被怪物追上！");
        monsterCounterAttack(0);
        updateUI();
        return;
    }
    nowMonster = { buffs: [] };
    addLog("🏃 成功逃跑！");
    updateUI();
}

function triggerRandomEvent() {
    if (currentEvent) {
        addLog("当前有未处理的事件！", 'debuff');
        return;
    }
    var event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
    currentEvent = event;
    player.eventCount++;
    checkAchievements();

    var eventBtns = document.getElementById('eventBtns');
    var confirmBtn = document.getElementById('eventConfirmBtn');
    var currentEventDiv = document.getElementById('currentEvent');

    currentEventDiv.innerHTML = "<span style=\"color:#34d399;\">🎭 " + event.name + "</span>：" + event.desc;
    eventBtns.style.display = 'flex';

    if (event.type === 'danger') {
        confirmBtn.innerText = '硬抗';
        confirmBtn.style.background = '#dc2626';
        eventBtns.style.display = 'flex';
    } else {
        confirmBtn.innerText = '确认';
        confirmBtn.style.background = '#2563eb';
    }

    addLog("🎲 触发事件【" + event.name + "】：" + event.desc, 'event');
}

function confirmEvent() {
    if (!currentEvent) return;
    currentEvent.effect();
    checkAchievements();
    clearEvent();
    updateUI();
}

function cancelEvent() {
    if (!currentEvent) return;
    if (currentEvent.type === 'danger') {
        addLog("你选择规避风险，绕道而行。", 'event');
    }
    clearEvent();
}

function clearEvent() {
    currentEvent = null;
    document.getElementById('currentEvent').innerHTML = '无';
    document.getElementById('eventBtns').style.display = 'none';
}

function openShop() {
    var tip = prompt("商店：\n1. 强化攻击(+5攻击) - 30金币\n2. 强化防御(+3防御) - 25金币\n3. 永久暴击(+2%暴击) - 50金币\n4. 永久闪避(+2%闪避) - 50金币\n5. 升级血量上限(+20) - 40金币\n请输入序号");
    if (tip === "1" && player.gold >= 30) {
        player.gold -= 30;
        player.atk += 5;
        addLog("攻击永久+5");
    } else if (tip === "2" && player.gold >= 25) {
        player.gold -= 25;
        player.def += 3;
        addLog("防御永久+3");
    } else if (tip === "3" && player.gold >= 50) {
        player.gold -= 50;
        player.crit += 2;
        addLog("暴击率永久+2%");
    } else if (tip === "4" && player.gold >= 50) {
        player.gold -= 50;
        player.dodge += 2;
        addLog("闪避率永久+2%");
    } else if (tip === "5" && player.gold >= 40) {
        player.gold -= 40;
        player.maxHp += 20;
        player.hp += 20;
        addLog("血量上限永久+20，当前血量+20");
    } else {
        addLog("金币不足或输入错误");
    }
    updateUI();
}

function openEquipShop() {
    var shopText = "=== 装备商店 ===\n";
    shopText += "\n【武器】\n";
    equipPool.weapon.forEach(function(item, i) {
        var equipped = player.equipment.weapon && player.equipment.weapon.name === item.name;
        shopText += (i + 1) + ". " + item.name + " | 攻击+" + item.atk + (item.crit ? " 暴击+" + item.crit + "%" : "") + " | " + item.price + "金币 " + (equipped ? "[已装备]" : "") + "\n";
    });
    shopText += "\n【防具】\n";
    equipPool.armor.forEach(function(item, i) {
        var equipped = player.equipment.armor && player.equipment.armor.name === item.name;
        shopText += (i + 1) + ". " + item.name + " | 防御+" + item.def + (item.hp ? " 血量+" + item.hp : "") + (item.dodge ? " 闪避+" + item.dodge + "%" : "") + " | " + item.price + "金币 " + (equipped ? "[已装备]" : "") + "\n";
    });
    shopText += "\n【饰品】\n";
    equipPool.accessory.forEach(function(item, i) {
        var equipped = player.equipment.accessory && player.equipment.accessory.name === item.name;
        shopText += (i + 1) + ". " + item.name + " | " + (item.atk ? "攻击+" + item.atk + " " : "") + (item.def ? "防御+" + item.def + " " : "") + (item.crit ? "暴击+" + item.crit + "% " : "") + (item.dodge ? "闪避+" + item.dodge + "% " : "") + (item.hp ? "血量+" + item.hp + " " : "") + "| " + item.price + "金币 " + (equipped ? "[已装备]" : "") + "\n";
    });
    shopText += "\n输入格式: w1=武器1, a1=防具1, ac1=饰品1";
    shopText += "\n输入 s1/s2/s3 出售装备";

    var tip = prompt(shopText);
    if (!tip) return;

    var input = tip.toLowerCase().trim();
    if (input.startsWith('s')) {
        sellEquip(input.substring(1));
        return;
    }

    var type, idx;
    if (input.startsWith('w')) {
        type = 'weapon'; idx = parseInt(input.substring(1)) - 1;
    } else if (input.startsWith('a')) {
        if (input.startsWith('ac')) {
            type = 'accessory'; idx = parseInt(input.substring(2)) - 1;
        } else {
            type = 'armor'; idx = parseInt(input.substring(1)) - 1;
        }
    } else {
        addLog("输入格式错误！");
        return;
    }

    buyEquip(type, idx);
}

function buyEquip(type, idx) {
    var pool = equipPool[type];
    if (idx < 0 || idx >= pool.length) return addLog("序号错误！");
    var item = pool[idx];
    if (player.gold < item.price) return addLog("金币不足！");
    if (player.equipment[type] && player.equipment[type].price) {
        var sellPrice = Math.floor(player.equipment[type].price * 0.5);
        player.gold += sellPrice;
        addLog("💰 出售旧装备，获得" + sellPrice + "金币");
    }
    player.gold -= item.price;
    player.equipment[type] = { name: item.name, atk: item.atk, def: item.def, crit: item.crit, dodge: item.dodge, hp: item.hp, maxHp: item.maxHp, price: item.price };
    player.hp = Math.min(player.hp, getTotalMaxHp());
    addLog("✅ 购买【" + item.name + "】成功！");
    updateUI();
}

function sellEquip(idx) {
    var typeMap = { '1': 'weapon', '2': 'armor', '3': 'accessory' };
    var type = typeMap[idx];
    if (!type || !player.equipment[type]) return addLog("没有可出售的装备！");
    var item = player.equipment[type];
    var sellPrice = Math.floor(item.price * 0.5);
    player.gold += sellPrice;
    if (item.maxHp) {
        player.maxHp -= item.maxHp;
        player.hp = Math.min(player.hp, player.maxHp);
    }
    player.equipment[type] = null;
    addLog("💰 出售【" + item.name + "】，获得" + sellPrice + "金币");
    updateUI();
}

function updateZoneButtons() {
    zones.forEach(function(z, i) {
        var btn = document.getElementById('zoneBtn' + i);
        if (player.lv < z.unlockLevel) {
            btn.classList.add('locked');
            btn.classList.remove('active');
        } else {
            btn.classList.remove('locked');
            if (player.currentZone === i) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        }
    });
}

function openLeaderboard() {
    var modal = document.getElementById('modal');
    var content = document.getElementById('modalContent');

    var scores = JSON.parse(localStorage.getItem('rpgLeaderboard') || '[]');
    var currentScore = {
        name: "玩家Lv" + player.lv,
        score: player.lv * 100 + player.gold + player.killCount * 10
    };

    var html = "<h3>📊 排行榜</h3>";
    html += "<p style=\"color:#aaa;font-size:12px;\">当前游戏得分: <span style=\"color:#fbbf14;\">" + currentScore.score + "</span></p>";
    html += "<div class=\"leaderboard\" style=\"margin-top:12px;\">";

    if (scores.length === 0) {
        html += "<p style=\"color:#666;text-align:center;\">暂无记录</p>";
    } else {
        scores.sort(function(a, b) { return b.score - a.score; });
        scores.slice(0, 10).forEach(function(s, i) {
            html += "<div class=\"leaderboard-item\">" +
                "<span class=\"rank\">#" + (i + 1) + "</span>" +
                "<span class=\"name\">" + s.name + "</span>" +
                "<span class=\"score\">" + s.score + "分</span>" +
                "</div>";
        });
    }
    html += "</div>";
    html += "<div style=\"margin-top:12px;\"><button onclick=\"closeModal()\" style=\"flex:1;\">关闭</button></div>";
    html += "<div style=\"margin-top:8px;\"><button onclick=\"clearScore()\" style=\"background:#dc2626;flex:1;\">清除记录</button></div>";

    content.innerHTML = html;
    modal.style.display = 'flex';
}

function saveScore() {
    var name = prompt("恭喜！请输入你的名字来保存成绩：", "玩家");
    if (!name) name = "匿名玩家";
    var score = player.lv * 100 + player.gold + player.killCount * 10;

    var scores = JSON.parse(localStorage.getItem('rpgLeaderboard') || '[]');

    scores.push({
        name: name,
        score: score,
        date: new Date().toLocaleDateString()
    });

    scores.sort(function(a, b) { return b.score - a.score; });
    scores = scores.slice(0, 20);
    localStorage.setItem('rpgLeaderboard', JSON.stringify(scores));

    addLog("💾 成绩已保存：" + score + "分！");
}

function clearScore() {
    localStorage.removeItem('rpgLeaderboard');
    addLog("🗑️ 排行榜记录已清除！");
    closeModal();
    openLeaderboard();
}

function closeModal() {
    document.getElementById('modal').style.display = 'none';
}

function openSaveLoad() {
    var modal = document.getElementById('modal');
    var content = document.getElementById('modalContent');
    var saves = JSON.parse(localStorage.getItem('rpgSaves') || '[]');

    var html = "<h3>💾 存档管理</h3>";
    html += "<div style=\"margin:12px 0;\">";
    html += "<button onclick=\"saveGame(0)\" style=\"background:#22c55e;margin-right:8px;\">存档到 1号位</button>";
    html += "<button onclick=\"loadGame(0)\" style=\"background:#2563eb;margin-right:8px;\" " + (saves[0] ? '' : 'disabled') + ">读档 1号位</button>";
    html += saves[0] ? "<span style=\"color:#aaa;font-size:11px;\">" + saves[0].date + " | Lv." + saves[0].data.player.lv + "</span>" : '';
    html += "</div>";
    html += "<div style=\"margin:12px 0;\">";
    html += "<button onclick=\"saveGame(1)\" style=\"background:#22c55e;margin-right:8px;\">存档到 2号位</button>";
    html += "<button onclick=\"loadGame(1)\" style=\"background:#2563eb;margin-right:8px;\" " + (saves[1] ? '' : 'disabled') + ">读档 2号位</button>";
    html += saves[1] ? "<span style=\"color:#aaa;font-size:11px;\">" + saves[1].date + " | Lv." + saves[1].data.player.lv + "</span>" : '';
    html += "</div>";
    html += "<div style=\"margin:12px 0;\">";
    html += "<button onclick=\"saveGame(2)\" style=\"background:#22c55e;margin-right:8px;\">存档到 3号位</button>";
    html += "<button onclick=\"loadGame(2)\" style=\"background:#2563eb;margin-right:8px;\" " + (saves[2] ? '' : 'disabled') + ">读档 3号位</button>";
    html += saves[2] ? "<span style=\"color:#aaa;font-size:11px;\">" + saves[2].date + " | Lv." + saves[2].data.player.lv + "</span>" : '';
    html += "</div>";
    html += "<div class=\"modal-buttons\"><button onclick=\"closeModal()\" style=\"flex:1;\">关闭</button></div>";

    content.innerHTML = html;
    modal.style.display = 'flex';
}

function saveGame(slot) {
    var saveData = {
        player: player,
        nowMonster: nowMonster,
        currentEvent: currentEvent,
        consecutiveKills: consecutiveKills,
        zoneKills: zoneKills,
        totalGoldEarned: totalGoldEarned,
        questCompleted: questCompleted,
        quests: quests,
        achievements: achievements,
        inventory: inventory,
        discoveredMonsters: discoveredMonsters,
        gameSettings: gameSettings,
        date: new Date().toLocaleString()
    };

    var saves = JSON.parse(localStorage.getItem('rpgSaves') || '[]');
    saves[slot] = { date: saveData.date, data: saveData };
    localStorage.setItem('rpgSaves', JSON.stringify(saves));

    addLog("💾 游戏已保存到 " + (slot + 1) + "号位！", 'event');
    closeModal();
    openSaveLoad();
}

function loadGame(slot) {
    var saves = JSON.parse(localStorage.getItem('rpgSaves') || '[]');
    if (!saves[slot]) return addLog("存档不存在！");

    var data = saves[slot].data;
    Object.assign(player, data.player);
    nowMonster = data.nowMonster || { buffs: [] };
    currentEvent = data.currentEvent;
    consecutiveKills = data.consecutiveKills;
    zoneKills = data.zoneKills;
    totalGoldEarned = data.totalGoldEarned;
    questCompleted = data.questCompleted;
    if (data.quests) { quests.length = 0; quests.push.apply(quests, data.quests); }
    if (data.achievements) { achievements.length = 0; achievements.push.apply(achievements, data.achievements); }
    if (data.inventory) { inventory.length = 0; inventory.push.apply(inventory, data.inventory); }
    if (data.discoveredMonsters) Object.assign(discoveredMonsters, data.discoveredMonsters);
    if (data.gameSettings) Object.assign(gameSettings, data.gameSettings);

    addLog("📂 从 " + (slot + 1) + "号位读取存档成功！", 'event');
    closeModal();
    updateUI();
    updateQuests();
    updateAchievements();
}

function openSettings() {
    var modal = document.getElementById('modal');
    var content = document.getElementById('modalContent');

    var html = "<h3>⚙️ 游戏设置</h3>";
    html += "<div class=\"settings-row\">";
    html += "<span class=\"settings-label\">🎵 音效</span>";
    html += "<div class=\"toggle-switch " + (gameSettings.soundEnabled ? 'active' : '') + "\" onclick=\"toggleSound()\"></div>";
    html += "</div>";
    html += "<div class=\"settings-row\">";
    html += "<span class=\"settings-label\">⚡ 战斗速度</span>";
    html += "<select class=\"speed-select\" onchange=\"changeBattleSpeed(this.value)\">";
    html += "<option value=\"0.5\" " + (gameSettings.battleSpeed === 0.5 ? 'selected' : '') + ">慢速</option>";
    html += "<option value=\"1\" " + (gameSettings.battleSpeed === 1 ? 'selected' : '') + ">正常</option>";
    html += "<option value=\"2\" " + (gameSettings.battleSpeed === 2 ? 'selected' : '') + ">快速</option>";
    html += "<option value=\"3\" " + (gameSettings.battleSpeed === 3 ? 'selected' : '') + ">极快</option>";
    html += "</select>";
    html += "</div>";
    html += "<div class=\"settings-row\">";
    html += "<span class=\"settings-label\">💾 自动保存</span>";
    html += "<span style=\"color:#4ade80;font-size:12px;\">每30秒自动保存</span>";
    html += "</div>";
    html += "<div class=\"modal-buttons\"><button onclick=\"closeModal()\" style=\"flex:1;\">关闭</button></div>";

    content.innerHTML = html;
    modal.style.display = 'flex';
}

function toggleSound() {
    gameSettings.soundEnabled = !gameSettings.soundEnabled;
    openSettings();
}

function changeBattleSpeed(speed) {
    gameSettings.battleSpeed = parseFloat(speed);
    openSettings();
}

function openInventory() {
    var modal = document.getElementById('modal');
    var content = document.getElementById('modalContent');

    var html = "<h3>🎒 背包</h3>";
    html += "<p style=\"color:#aaa;font-size:12px;margin-bottom:10px;\">可使用道具在战斗中获得优势</p>";

    if (inventory.length === 0) {
        html += "<p style=\"color:#666;text-align:center;padding:20px;\">背包空空如也</p>";
    } else {
        html += "<div class=\"inventory-panel\">";
        inventory.forEach(function(item, idx) {
            var itemData = items.find(function(i) { return i.id === item.id; });
            if (!itemData) return;
            html += "<div class=\"inventory-item\">";
            html += "<div>";
            html += "<div class=\"item-name\">" + itemData.name + " x" + item.count + "</div>";
            html += "<div class=\"item-desc\">" + itemData.desc + "</div>";
            html += "</div>";
            html += "<button class=\"item-use\" onclick=\"useItem('" + item.id + "')\">使用</button>";
            html += "</div>";
        });
        html += "</div>";
    }

    html += "<div class=\"modal-buttons\"><button onclick=\"closeModal()\" style=\"flex:1;\">关闭</button></div>";
    content.innerHTML = html;
    modal.style.display = 'flex';
}

function useItem(itemId) {
    var invItem = inventory.find(function(i) { return i.id === itemId; });
    if (!invItem || invItem.count <= 0) return addLog("道具不存在或数量不足！");

    var itemData = items.find(function(i) { return i.id === itemId; });
    if (!itemData) return;

    if (itemData.id === 'goldCoin' || itemData.id === 'critCrystal' || itemData.id === 'resurrectionScroll') {
        var success = itemData.effect();
        if (success) {
            invItem.count--;
            if (invItem.count <= 0) inventory.splice(inventory.findIndex(function(i) { return i.id === itemId; }), 1);
            addLog("✨ 使用【" + itemData.name + "】成功！", 'event');
        } else {
            addLog(itemData.name + " 使用失败！", 'debuff');
        }
    } else {
        var success = itemData.effect();
        if (success) {
            invItem.count--;
            if (invItem.count <= 0) inventory.splice(inventory.findIndex(function(i) { return i.id === itemId; }), 1);
            addLog("✨ 使用【" + itemData.name + "】成功！", 'heal');
        } else {
            addLog("当前生命值已满，无法使用治疗道具！", 'debuff');
        }
    }
    closeModal();
    updateUI();
}

function addItemToInventory(itemId) {
    var invItem = inventory.find(function(i) { return i.id === itemId; });
    if (invItem) {
        invItem.count++;
    } else {
        inventory.push({ id: itemId, count: 1 });
    }
}

function openMonsterBook() {
    var modal = document.getElementById('modal');
    var content = document.getElementById('modalContent');

    var html = "<h3>📖 怪物图鉴</h3>";
    html += "<div class=\"compendium-tab\">";
    html += "<button class=\"active\" onclick=\"filterMonsterBook(0, this)\">🌳 森林</button>";
    html += "<button onclick=\"filterMonsterBook(1, this)\">🕳️ 洞穴</button>";
    html += "<button onclick=\"filterMonsterBook(2, this)\">👹 BOSS</button>";
    html += "</div>";
    html += "<div class=\"monster-book\" id=\"monsterBookContent\"></div>";
    html += "<div class=\"modal-buttons\"><button onclick=\"closeModal()\" style=\"flex:1;\">关闭</button></div>";

    content.innerHTML = html;
    modal.style.display = 'flex';
    filterMonsterBook(0);
}

function filterMonsterBook(zoneIdx, btn) {
    if (btn) {
        document.querySelectorAll('.compendium-tab button').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
    }

    var content = document.getElementById('monsterBookContent');
    var zoneMonsters = zones[zoneIdx].monsters;
    var html = '';

    zoneMonsters.forEach(function(m) {
        var monsterKey = m.name + '_' + zoneIdx;
        var discovered = discoveredMonsters[monsterKey];
        if (discovered) {
            html += "<div class=\"monster-card discovered\">";
            html += "<div class=\"m-icon\">👹</div>";
            html += "<div class=\"m-name\">" + m.name + "</div>";
            html += "<div class=\"m-zone\">击杀: " + discovered.count + "次</div>";
            html += "<div style=\"font-size:10px;color:#888;\">首次: " + discovered.firstDefeat + "</div>";
            html += "</div>";
        } else {
            html += "<div class=\"monster-card undiscovered\">";
            html += "<div class=\"m-icon\">❓</div>";
            html += "<div class=\"m-name\">???</div>";
            html += "<div class=\"m-zone\">未发现</div>";
            html += "</div>";
        }
    });

    content.innerHTML = html;
}

function startAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    autoSaveTimer = setInterval(function() {
        var saveData = {
            player: player,
            nowMonster: nowMonster,
            currentEvent: currentEvent,
            consecutiveKills: consecutiveKills,
            zoneKills: zoneKills,
            totalGoldEarned: totalGoldEarned,
            questCompleted: questCompleted,
            quests: quests,
            achievements: achievements,
            inventory: inventory,
            discoveredMonsters: discoveredMonsters,
            gameSettings: gameSettings,
            date: new Date().toLocaleString()
        };
        var saves = JSON.parse(localStorage.getItem('rpgSaves') || '[]');
        var autoSave = saves.find(function(s) { return s && s.isAuto; });
        if (autoSave) {
            saves[saves.indexOf(autoSave)] = { isAuto: true, date: saveData.date, data: saveData };
        } else {
            saves[3] = { isAuto: true, date: saveData.date, data: saveData };
        }
        localStorage.setItem('rpgSaves', JSON.stringify(saves));
    }, 30000);
}

function updateUI() {
    document.getElementById('gold').textContent = player.gold;
    document.getElementById('exp').textContent = player.exp;
    document.getElementById('needExp').textContent = player.needExp;
    document.getElementById('lv').textContent = player.lv;
    document.getElementById('killCount').textContent = player.killCount;
    document.getElementById('eventCount').textContent = player.eventCount;
    document.getElementById('hp').textContent = Math.max(0, player.hp) + '/' + getTotalMaxHp();
    document.getElementById('atk').textContent = getTotalAtk();
    document.getElementById('def').textContent = getTotalDef();
    document.getElementById('crit').textContent = getTotalCrit();
    document.getElementById('dodge').textContent = getTotalDodge();

    var hpPercent = Math.max(0, (player.hp / getTotalMaxHp()) * 100);
    var hpBar = document.getElementById('hpBar');
    hpBar.style.width = hpPercent + '%';
    hpBar.className = 'hp-bar-fill';
    if (hpPercent < 25) hpBar.classList.add('danger');
    else if (hpPercent < 50) hpBar.classList.add('mid');

    document.getElementById('mName').textContent = nowMonster.name || '---';
    document.getElementById('mLv').textContent = nowMonster.zoneLevel || '---';
    document.getElementById('mHp').textContent = Math.max(0, nowMonster.hp) + '/' + (nowMonster.maxHp || 0);
    document.getElementById('mAtk').textContent = nowMonster.atk || 0;
    document.getElementById('mDef').textContent = nowMonster.def || 0;

    var mHpPercent = nowMonster.maxHp ? Math.max(0, (nowMonster.hp / nowMonster.maxHp) * 100) : 0;
    var mHpBar = document.getElementById('mHpBar');
    mHpBar.style.width = mHpPercent + '%';
    mHpBar.className = 'hp-bar-fill';
    if (mHpPercent < 25) mHpBar.classList.add('danger');
    else if (mHpPercent < 50) mHpBar.classList.add('mid');

    document.getElementById('monsterBuffs').innerHTML = (nowMonster.buffs || []).map(function(b) { return "<span class=\"" + b.type + "-item\">" + b.name + ":" + b.turns + "回合</span>"; }).join('');

    updateBuffs();
    updateEquipSlots();
    updateSkillButtons();
    updateZoneButtons();
    updateQuests();
    updateAchievements();
}

startAutoSave();
updateUI();