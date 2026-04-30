var logDom = document.getElementById('log');

function addLog(text, type) {
    var p = document.createElement('p');
    p.innerHTML = text;
    if (type) p.className = type;
    logDom.appendChild(p);
    logDom.scrollTop = logDom.scrollHeight;
}

function getBattleDelay(base, extra) {
    var delay = (extra || 0) + base;
    var speed = gameSettings.battleSpeed || 1;
    return Math.max(50, delay / speed);
}

function getTotalAtk() {
    var atk = player.atk;
    if (player.equipment.weapon) atk += player.equipment.weapon.atk;
    atk += (player.equipmentEnhanceLevels.weapon || 0) * 2;
    if (petSummoned && player.pet) atk += player.pet.atk + petEnergyBoost;
    return atk;
}

function getTotalDef() {
    var def = player.def;
    if (player.equipment.armor) def += player.equipment.armor.def;
    def += (player.equipmentEnhanceLevels.armor || 0) * 2;
    if (player.pet) def += player.pet.def;
    if (player.learnedSkills.indexOf("堡垒") >= 0) def = Math.floor(def * 1.15);
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
    if (player.learnedSkills.indexOf("疾风") >= 0) dodge += 10;
    return dodge;
}

function getTotalSpeed() {
    var speed = player.speed || 10;
    if (player.equipment.accessory && player.equipment.accessory.speed) speed += player.equipment.accessory.speed;
    return speed;
}

function getTotalMaxHp() {
    var maxHp = player.maxHp;
    if (player.equipment.armor && player.equipment.armor.maxHp) maxHp += player.equipment.armor.maxHp;
    if (player.equipment.accessory && player.equipment.accessory.maxHp) maxHp += player.equipment.accessory.maxHp;
    maxHp += (player.equipmentEnhanceLevels.armor || 0) * 10;
    if (player.pet) maxHp += player.pet.hp;
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
        } else if (q.zone === -2) {
            q.progress = player.killCount;
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
            if (a.reward.item) {
                addItemToInventory(a.reward.item);
                var itemData = items.find(function(i) { return i.id === a.reward.item; });
                addLog("🎁 获得道具【" + itemData.name + "】！", 'event');
            }
            if (a.title && player.titles.indexOf(a.title) < 0) {
                player.titles.push(a.title);
                addLog("🎖️ 获得称号【" + a.title + "】！", 'buff');
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
        sprite: template.sprite || "👹",
        hp: template.hp + levelBonus * 20,
        maxHp: template.hp + levelBonus * 20,
        atk: template.atk + levelBonus * 3,
        def: template.def + levelBonus * 2,
        exp: template.exp,
        gold: template.gold,
        speed: template.speed || 5,
        zoneLevel: monsterLevel,
        buffs: [],
        tempDefBoost: 0,
        highDodge: template.highDodge
    };
    battleUsedSkills = { secondWind: false, secondLife: false };
    petSummoned = false;
    petEnergyBoost = 0;
    battleActive = true;
    battleNextAction = getTotalSpeed() >= nowMonster.speed ? 'player' : 'monster';
    var initDelay = getBattleDelay(800);
    setTimeout(function() {
        addLog("⚔️ 战斗开始！");
        processAutoBattle();
    }, initDelay);
    updateUI();
}

var battleActive = false;
var battleNextAction = 'player';
var battleTimer = null;
var battlePaused = false;

function processAutoBattle() {
    if (!battleActive || battlePaused || !nowMonster.name) return;
    
    if (battleNextAction === 'player') {
        doPlayerAttack();
        battleNextAction = 'monster';
    } else {
        doMonsterAttack();
        battleNextAction = 'player';
    }
}

function doPlayerAttack() {
    if (!battleActive || !nowMonster.name || nowMonster.hp <= 0) return;
    
    processBuffs(nowMonster, true);
    if (player.hp <= 0) return;
    
    var tempDefBoost = 0;
    player.buffs = player.buffs.filter(function(b) {
        if (b.name === '铁壁') {
            if (b.shieldCount && b.shieldCount > 0) {
                b.shieldCount--;
                if (b.shieldCount <= 0) {
                    addLog("🛡️ 护盾消耗完毕！", 'buff');
                    return false;
                }
                addLog("🛡️ 护盾生效，抵挡攻击！剩余" + b.shieldCount + "次", 'buff');
                return false;
            }
            tempDefBoost = 10;
            addLog("🛡️ 铁壁效果：防御临时+10", 'buff');
            return false;
        }
        if (b.name === '诅咒') return true;
        return true;
    });

    var isCrit = Math.random() * 100 < getTotalCrit();
    var dmg = Math.max(1, getTotalAtk() - nowMonster.def - nowMonster.tempDefBoost);

    if (player.learnedSkills.indexOf("狂暴") >= 0) {
        var hpPercent = player.hp / getTotalMaxHp();
        var berserkBonus = Math.floor((1 - hpPercent) * 10);
        if (berserkBonus > 0) {
            dmg += berserkBonus;
            addLog("🔥 狂暴效果：攻击+" + berserkBonus, 'buff');
        }
    }

    if (player.learnedSkills.indexOf("处决") >= 0) {
        var monsterHpPercent = nowMonster.hp / nowMonster.maxHp;
        if (monsterHpPercent <= 0.3) {
            dmg = Math.floor(dmg * 1.5);
            addLog("⚔️ 处决触发！伤害+50%", 'buff');
        }
    }

    if (isCrit) dmg = Math.floor(dmg * 1.5);

    var playerSprite = document.getElementById('playerSprite');
    var monsterSprite = document.getElementById('monsterSprite');
    playerSprite.classList.remove('attack-right', 'damage');
    monsterSprite.classList.remove('attack-left', 'damage');
    void playerSprite.offsetWidth;
    playerSprite.classList.add('attack-right');
    setTimeout(function() {
        monsterSprite.classList.add('damage');
        setTimeout(function() { monsterSprite.classList.remove('damage'); }, getBattleDelay(300));
    }, getBattleDelay(150));

    nowMonster.hp -= dmg;
    addLog("⚔️ 你攻击【" + nowMonster.name + "】，造成 <span class=\"damage\">" + dmg + "</span> 点伤害" + (isCrit ? ' <span class="crit">【暴击！】</span>' : ''));

    if (nowMonster.hp <= 0) {
        battleActive = false;
        monsterDefeated();
        return;
    }

    if (player.learnedSkills.indexOf("反击") >= 0) {
        var counterDmg = Math.floor(dmg * 0.2);
        nowMonster.hp -= counterDmg;
        addLog("� 反击！反弹 <span class=\"damage\">" + counterDmg + "</span> 点伤害");
        if (nowMonster.hp <= 0) {
            battleActive = false;
            monsterDefeated();
            return;
        }
    }

    if (petSummoned && player.pet) {
        var petDmg = Math.max(1, player.pet.atk + petEnergyBoost - nowMonster.def);
        nowMonster.hp -= petDmg;
        addLog("🐾 【" + player.pet.name + "】协助攻击，造成 " + petDmg + " 点伤害！");
        if (nowMonster.hp <= 0) {
            battleActive = false;
            monsterDefeated();
            return;
        }
    }

    scheduleNextAction();
}

function doMonsterAttack() {
    if (!battleActive || !nowMonster.name || nowMonster.hp <= 0 || player.hp <= 0) return;

    var playerTempDef = 0;
    var shieldBuff = player.buffs.find(function(b) { return b.name === '铁壁' && b.shieldCount && b.shieldCount > 0; });
    if (shieldBuff) {
        shieldBuff.shieldCount--;
        if (shieldBuff.shieldCount <= 0) {
            player.buffs = player.buffs.filter(function(b) { return b.name !== '铁壁'; });
            addLog("🛡️ 盾墙完全抵消了攻击！", 'buff');
        } else {
            addLog("🛡️ 盾墙生效，抵挡攻击！剩余" + shieldBuff.shieldCount + "次", 'buff');
        }
        scheduleNextAction();
        return;
    }

    if (Math.random() * 100 < getTotalDodge()) {
        var playerSprite = document.getElementById('playerSprite');
        if (playerSprite) {
            playerSprite.classList.add('evade');
            setTimeout(function() { playerSprite.classList.remove('evade'); }, getBattleDelay(400));
        }
        addLog("⚡ 你发动闪避，【" + nowMonster.name + "】的攻击落空！", 'dodge');
        scheduleNextAction();
        return;
    }

    var monsterDodge = nowMonster.highDodge || 0;
    if (Math.random() * 100 < monsterDodge) {
        addLog("【" + nowMonster.name + "】发动闪避，攻击落空！", 'dodge');
        scheduleNextAction();
        return;
    }

    var dmg = Math.max(1, nowMonster.atk - getTotalDef() - playerTempDef);
    player.hp -= dmg;
    var playerSprite = document.getElementById('playerSprite');
    var monsterSprite = document.getElementById('monsterSprite');
    monsterSprite.classList.remove('attack-left', 'damage');
    playerSprite.classList.remove('attack-right', 'damage');
    void monsterSprite.offsetWidth;
    monsterSprite.classList.add('attack-left');
    setTimeout(function() {
        playerSprite.classList.add('damage');
        setTimeout(function() { playerSprite.classList.remove('damage'); }, getBattleDelay(300));
    }, getBattleDelay(150));
    addLog("【" + nowMonster.name + "】攻击，你受到 <span class=\"damage\">" + dmg + "</span> 点伤害");

    if (player.hp <= 0) {
        var hasResurrection = player.buffs.some(function(b) { return b.name === '复活'; });
        if (hasResurrection) {
            player.hp = Math.floor(getTotalMaxHp() * 0.5);
            player.buffs = player.buffs.filter(function(b) { return b.name !== '复活'; });
            addLog("✨ 复活卷轴生效！你恢复" + Math.floor(getTotalMaxHp() * 0.5) + "点血量！", 'heal');
            updateUI();
            scheduleNextAction();
            return;
        }
        if (player.learnedSkills.indexOf("第二条命") >= 0 && !battleUsedSkills.secondLife) {
            player.hp = Math.floor(getTotalMaxHp() * 0.3);
            battleUsedSkills.secondLife = true;
            addLog("✨ 第二条命触发！你恢复" + Math.floor(getTotalMaxHp() * 0.3) + "点血量！", 'buff');
            updateUI();
            scheduleNextAction();
            return;
        }
        if (player.learnedSkills.indexOf("喘息") >= 0 && !battleUsedSkills.secondWind) {
            player.hp = Math.floor(getTotalMaxHp() * 0.3);
            battleUsedSkills.secondWind = true;
            addLog("✨ 喘息触发！你恢复" + Math.floor(getTotalMaxHp() * 0.3) + "点血量！", 'buff');
            updateUI();
            scheduleNextAction();
            return;
        }
        addLog("💀 你被击败了！游戏重置...");
        consecutiveKills = 0;
        saveScore();
        battleActive = false;
        setTimeout(function() { location.reload(); }, 1500);
        return;
    }

    if (player.learnedSkills.indexOf("反击") >= 0) {
        var counterDmg = Math.floor(dmg * 0.2);
        nowMonster.hp -= counterDmg;
        addLog("🔄 反击！反弹 <span class=\"damage\">" + counterDmg + "</span> 点伤害");
        if (nowMonster.hp <= 0) {
            battleActive = false;
            monsterDefeated();
            return;
        }
    }

    processBuffs(nowMonster, false);
    if (player.learnedSkills.indexOf("堡垒") >= 0) {
        var fortressHeal = Math.floor(getTotalMaxHp() * 0.02);
        player.hp = Math.min(getTotalMaxHp(), player.hp + fortressHeal);
        addLog("🏰 堡垒效果：恢复 " + fortressHeal + " 点血量", 'heal');
    }

    updateUI();
    scheduleNextAction();
}

function scheduleNextAction() {
    if (!battleActive || !nowMonster.name) return;
    
    var playerSpeed = getTotalSpeed();
    var monsterSpeed = nowMonster.speed || 5;
    var speedDiff = battleNextAction === 'player' ? playerSpeed : monsterSpeed;
    var baseDelay = 1000;
    var delay = Math.max(200, baseDelay - speedDiff * 20) / gameSettings.battleSpeed;
    
    battleTimer = setTimeout(processAutoBattle, delay);
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

    if (player.pet) {
        var petData = pets.find(function(p) { return p.id === player.pet.id; });
        if (petData && petData.evolveReq) {
            petKillCount[player.pet.id] = (petKillCount[player.pet.id] || 0) + 1;
            if (petKillCount[player.pet.id] >= petData.evolveReq.kills) {
                var evolvedPet = pets.find(function(p) { return p.id === petData.evolveReq.petId; });
                if (evolvedPet) {
                    player.pet = { id: evolvedPet.id, name: evolvedPet.name, sprite: evolvedPet.sprite, atk: evolvedPet.atk, hp: evolvedPet.hp, def: evolvedPet.def, rarity: evolvedPet.rarity };
                    petKillCount[evolvedPet.id] = 0;
                    addLog("🌟 伙伴进化！【" + evolvedPet.name + "】诞生！", 'buff');
                }
            }
        }
    }

    if (zone.isBossZone && (nowMonster.name === '巨龙' || nowMonster.name === '巨石魔像' || nowMonster.name === '暗影刺客')) {
        player.bossDefeated++;
    }

    checkLevelUp();
    checkAchievements();
    updateQuests();

    var monsterSprite = document.getElementById('monsterSprite');
    if (monsterSprite) {
        monsterSprite.classList.add('death');
        setTimeout(function() {
            monsterSprite.classList.remove('death');
            nowMonster = { buffs: [] };
            updateUI();
        }, getBattleDelay(600));
    } else {
        nowMonster = { buffs: [] };
        updateUI();
    }
}

function checkLevelUp() {
    while (player.exp >= player.needExp) {
        player.exp -= player.needExp;
        player.lv++;
        player.maxHp += 20;
        player.hp = Math.min(player.hp + 20, player.maxHp);
        player.atk += 5;
        player.def += 2;
        player.skillPoints++;
        player.needExp = Math.floor(player.needExp * 1.5);
        addLog("<span class=\"levelup\">🎉升级！当前等级：" + player.lv + "，获得1点技能点！</span>");
        var playerSprite = document.getElementById('playerSprite');
        if (playerSprite) {
            playerSprite.classList.add('levelup');
            setTimeout(function() { playerSprite.classList.remove('levelup'); }, getBattleDelay(800));
        }
    }
    updateZoneButtons();
}

function useSkill(index) {
    if (!nowMonster.name || !battleActive) return addLog("请先寻找怪物并进入战斗！");
    var skill = player.skills[index];
    if (!skill.isReady) return addLog(skill.name + "冷却中！");

    skill.isReady = false;
    skill.cd = skill.maxCd;

    if (index === 0) {
        var isCrit = Math.random() * 100 < getTotalCrit();
        var dmg = Math.max(1, Math.floor(getTotalAtk() * 1.5) - nowMonster.def);
        if (isCrit) dmg = Math.floor(dmg * 1.5);
        nowMonster.hp -= dmg;
        var monsterSprite = document.getElementById('monsterSprite');
        monsterSprite.classList.add('skill-burst');
        setTimeout(function() { monsterSprite.classList.remove('skill-burst'); }, getBattleDelay(400));
        addLog("💥 使用【重击】！造成 <span class=\"damage\">" + dmg + "</span> 点伤害" + (isCrit ? ' <span class="crit">【暴击！】</span>' : ''));

        if (player.learnedSkills.indexOf("双重打击") >= 0 && nowMonster.hp > 0) {
            var isCrit2 = Math.random() * 100 < getTotalCrit();
            var dmg2 = Math.max(1, getTotalAtk() - nowMonster.def);
            if (isCrit2) dmg2 = Math.floor(dmg2 * 1.5);
            nowMonster.hp -= dmg2;
            addLog("⚔️ 双重打击！追加 <span class=\"damage\">" + dmg2 + "</span> 点伤害");
        }
    } else if (index === 1) {
        var shieldBlockCount = 1;
        if (player.learnedSkills.indexOf("盾墙") >= 0) shieldBlockCount = 2;
        player.buffs.push({
            name: '铁壁',
            type: 'buff',
            turns: 2,
            shieldCount: shieldBlockCount,
            onApply: function() { addLog("🛡️ 进入铁壁姿态，可抵挡" + shieldBlockCount + "次攻击", 'buff'); }
        });
        var playerSprite = document.getElementById('playerSprite');
        playerSprite.classList.add('shield-glow');
        setTimeout(function() { playerSprite.classList.remove('shield-glow'); }, getBattleDelay(600));
        addLog("🛡️ 使用【铁壁】！获得护盾，可抵挡" + shieldBlockCount + "次攻击", 'buff');
    } else if (index === 2) {
        addLog("⚔️ 使用【连击】！");
        var isCrit = Math.random() * 100 < getTotalCrit();
        var dmg = Math.max(1, getTotalAtk() - nowMonster.def);
        if (isCrit) dmg = Math.floor(dmg * 1.5);
        nowMonster.hp -= dmg;
        addLog("⚔️ 第1次攻击，造成 <span class=\"damage\">" + dmg + "</span> 点伤害");
        if (nowMonster.hp <= 0) {
            battleActive = false;
            monsterDefeated();
            return;
        }
        if (nowMonster.hp > 0) {
            var isCrit2 = Math.random() * 100 < getTotalCrit();
            var dmg2 = Math.max(1, getTotalAtk() - nowMonster.def);
            if (isCrit2) dmg2 = Math.floor(dmg2 * 1.5);
            nowMonster.hp -= dmg2;
            addLog("⚔️ 第2次攻击，造成 <span class=\"damage\">" + dmg2 + "</span> 点伤害");
            if (nowMonster.hp <= 0) {
                battleActive = false;
                monsterDefeated();
                return;
            }
        }
    }

    if (nowMonster.hp <= 0) {
        battleActive = false;
        monsterDefeated();
        return;
    }

    updateSkillCooldowns();
    updateUI();
    battleNextAction = 'monster';
    scheduleNextAction();
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
    if (battleTimer) clearTimeout(battleTimer);
    battleActive = false;
    consecutiveKills = 0;
    if (nowMonster.name && Math.random() < 0.5) {
        addLog("🏃 逃跑失败！被怪物追上！");
        battleActive = true;
        battleNextAction = 'monster';
        scheduleNextAction();
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
        petInventory: petInventory,
        petKillCount: petKillCount,
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
    if (data.petInventory) { petInventory.length = 0; petInventory.push.apply(petInventory, data.petInventory); }
    if (data.petKillCount) Object.assign(petKillCount, data.petKillCount);
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

function getRarityChance(rarity) {
    var chances = { common: 60, rare: 25, epic: 12, legend: 3 };
    return chances[rarity] || 10;
}

function getRandomPet() {
    var playerZone = player.currentZone;
    var basePets = pets.filter(function(p) { return p.evolveReq && p.zone <= playerZone; });
    var totalChance = 0;
    basePets.forEach(function(p) { totalChance += getRarityChance(p.rarity); });
    var rand = Math.random() * totalChance;
    var cumulative = 0;
    for (var i = 0; i < basePets.length; i++) {
        cumulative += getRarityChance(basePets[i].rarity);
        if (rand <= cumulative) return basePets[i];
    }
    return basePets[basePets.length - 1];
}

function openPetGacha() {
    var modal = document.getElementById('modal');
    modal.style.display = 'flex';
    var content = document.getElementById('modalContent');
    var html = "<h2>🎰 宠物抽奖</h2>";
    html += "<div style='margin:15px 0;'>";
    html += "<p>💰 当前金币: " + player.gold + "</p>";
    html += "<p style='color:#aaa;font-size:12px;'>普通宠物概率: 60% | 稀有: 25% | 史诗: 12% | 传说: 3%</p>";
    html += "</div>";
    html += "<div class='btn-group' style='justify-content:center;'>";
    html += "<button onclick='petGacha(1)' " + (player.gold < 10 ? "disabled" : "") + ">🎫 单抽 (10金币)</button>";
    html += "<button onclick='petGacha(10)' " + (player.gold < 100 ? "disabled" : "") + ">🎫 十连 (100金币)</button>";
    html += "</div>";
    html += "<div id='gachaResult' style='margin-top:15px;'></div>";
    html += "<button onclick='closeModal()' style='margin-top:15px;'>关闭</button>";
    content.innerHTML = html;
}

function petGacha(count) {
    var cost = count * 10;
    if (player.gold < cost) { addLog("金币不足！"); return; }
    player.gold -= cost;
    var results = [];
    for (var i = 0; i < count; i++) {
        var pet = getRandomPet();
        var isNew = !petInventory.some(function(p) { return p.id === pet.id; });
        if (isNew) {
            petInventory.push({ id: pet.id, name: pet.name, sprite: pet.sprite, atk: pet.atk, hp: pet.hp, def: pet.def, rarity: pet.rarity, count: 1 });
        } else {
            var existingPet = petInventory.find(function(p) { return p.id === pet.id; });
            existingPet.count++;
            var fruitValue = pet.rarity === 'common' ? 1 : pet.rarity === 'rare' ? 2 : pet.rarity === 'epic' ? 5 : pet.rarity === 'legend' ? 10 : 1;
            for (var j = 0; j < fruitValue; j++) {
                addItemToInventory("petUpgradeFruit");
            }
            addLog("🔄 重复宠物【" + pet.name + "】分解为" + fruitValue + "个🍎宠物升级果实！", 'event');
        }
        results.push({ pet: pet, isNew: isNew });
    }
    var resultDiv = document.getElementById('gachaResult');
    var html = "<h3>抽奖结果:</h3><div style='display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:10px;'>";
    results.forEach(function(r) {
        var color = r.pet.rarity === 'legend' ? '#ff6d36' : r.pet.rarity === 'epic' ? '#a855f7' : r.pet.rarity === 'rare' ? '#3b82f6' : '#6b7280';
        html += "<div style='text-align:center;padding:10px;background:#333;border-radius:8px;border:2px solid " + color + ";'>";
        html += "<div style='font-size:32px;'>" + r.pet.sprite + "</div>";
        html += "<div style='color:" + color + ";font-size:12px;'>" + r.pet.name + "</div>";
        html += "<div style='font-size:10px;color:#aaa;'>" + (r.isNew ? "🆕首次获得!" : "🔄分解") + "</div>";
        html += "</div>";
    });
    html += "</div>";
    resultDiv.innerHTML = html;
    updateUI();
}

function openSkillTree() {
    var modal = document.getElementById('modal');
    modal.style.display = 'flex';
    var content = document.getElementById('modalContent');
    var html = "<h2>🌳 技能树</h2>";
    html += "<div style='margin:10px 0;'><span style='color:#facc15;'>⭐ 技能点: " + player.skillPoints + "</span></div>";
    for (var branch in skillTree) {
        var branchData = skillTree[branch];
        html += "<div style='margin:15px 0;padding:10px;background:#444;border-radius:8px;'>";
        html += "<h3 style='color:#ff6d36;margin-bottom:10px;'>" + branchData.name + "</h3>";
        html += "<div style='display:flex;gap:10px;flex-wrap:wrap;'>";
        branchData.skills.forEach(function(skill) {
            var isLearned = player.learnedSkills.indexOf(skill.name) >= 0;
            var canLearn = !isLearned && player.skillPoints >= skill.cost && (skill.requires ? player.learnedSkills.indexOf(skill.requires) >= 0 : true);
            var color = isLearned ? '#4ade80' : canLearn ? '#facc15' : '#6b7280';
            html += "<div onclick=\"" + (canLearn ? "learnSkill('" + branch + "','" + skill.name + "'," + skill.cost + ")" : "") + "\" ";
            html += "style='padding:10px;background:#333;border-radius:6px;cursor:" + (canLearn ? "pointer" : "not-allowed") + ";opacity:" + (isLearned ? "1" : canLearn ? "1" : "0.6") + ";border:2px solid " + color + ";min-width:120px;text-align:center;'>";
            html += "<div style='font-size:18px;color:" + color + ";'>" + skill.name + "</div>";
            html += "<div style='font-size:10px;color:#aaa;'>" + skill.desc + "</div>";
            html += "<div style='font-size:10px;color:" + color + ";'>" + (skill.type === 'active' ? '主动' : '被动') + (isLearned ? ' (已学习)' : ' ⭐' + skill.cost) + "</div>";
            html += "</div>";
        });
        html += "</div></div>";
    }
    html += "<button onclick='closeModal()' style='margin-top:15px;'>关闭</button>";
    content.innerHTML = html;
}

function learnSkill(branch, skillName, cost) {
    if (player.skillPoints < cost) { addLog("技能点不足！"); return; }
    player.skillPoints -= cost;
    player.learnedSkills.push(skillName);
    addLog("✨ 学会新技能：【" + skillName + "】！", 'buff');
    openSkillTree();
    updateUI();
}

function openEquipmentEnhance() {
    var modal = document.getElementById('modal');
    modal.style.display = 'flex';
    var content = document.getElementById('modalContent');
    var html = "<h2>🔨 装备强化</h2>";
    var enhanceTypes = [
        { key: 'weapon', name: '⚔️ 武器', icon: '⚔️' },
        { key: 'armor', name: '🛡️ 防具', icon: '🛡️' },
        { key: 'accessory', name: '💍 饰品', icon: '💍' }
    ];
    enhanceTypes.forEach(function(type) {
        var equip = player.equipment[type.key];
        var level = player.equipmentEnhanceLevels[type.key] || 0;
        var nextCost = (level + 1) * 50;
        var successRate = Math.max(20, 100 - level * 10);
        html += "<div style='margin:15px 0;padding:12px;background:#444;border-radius:8px;'>";
        html += "<div style='display:flex;justify-content:space-between;align-items:center;'>";
        html += "<div><span style='font-size:20px;'>" + type.icon + "</span> ";
        html += "<span>" + type.name + "</span></div>";
        html += "<div style='color:#facc15;'>强化等级: " + level + "</div>";
        html += "</div>";
        if (equip) {
            html += "<div style='font-size:12px;color:#aaa;margin:5px 0;'>" + equip.name + " (强化 +" + level + ")</div>";
            html += "<div style='font-size:12px;'>下一级: 消耗" + nextCost + "金币 | 成功率" + successRate + "%</div>";
            html += "<button onclick='enhanceEquip(\"" + type.key + "\")' " + (player.gold < nextCost ? "disabled" : "") + " style='margin-top:8px;background:#f97316;'>强化</button>";
        } else {
            html += "<div style='font-size:12px;color:#6b7280;'>未装备</div>";
        }
        html += "</div>";
    });
    html += "<button onclick='closeModal()' style='margin-top:15px;'>关闭</button>";
    content.innerHTML = html;
}

function enhanceEquip(type) {
    var level = player.equipmentEnhanceLevels[type.key] || 0;
    var nextCost = (level + 1) * 50;
    if (player.gold < nextCost) { addLog("金币不足！"); return; }
    player.gold -= nextCost;
    var successRate = Math.max(20, 100 - level * 10);
    if (Math.random() * 100 < successRate) {
        player.equipmentEnhanceLevels[type] = level + 1;
        addLog("✨ 强化成功！" + type + "强化等级提升到" + (level + 1) + "！", 'buff');
    } else {
        if (level > 0 && Math.random() < 0.3) {
            player.equipmentEnhanceLevels[type] = level - 1;
            addLog("💀 强化失败！" + type + "强化等级降为" + (level - 1) + "...", 'debuff');
        } else {
            addLog("💨 强化失败，但保住了强化等级！");
        }
    }
    openEquipmentEnhance();
    updateUI();
}

var petSummoned = false;
var petEnergyBoost = 0;

function summonPet() {
    if (!player.pet) { addLog("你没有伙伴！先去宠物抽奖获得吧！"); openPetGacha(); return; }
    if (!battleActive) { addLog("请先进入战斗再召唤伙伴！"); return; }
    if (petSummoned) { addLog("🐾 伙伴已经在战场上！"); return; }
    petSummoned = true;
    petEnergyBoost = Math.floor(player.pet.atk * 0.5);
    addLog("🐾 召唤【" + player.pet.name + "】参战！获得" + petEnergyBoost + "点攻击力加成！", 'buff');
    updateUI();
}

function openPetManagement() {
    var modal = document.getElementById('modal');
    modal.style.display = 'flex';
    var content = document.getElementById('modalContent');
    var html = "<h2>🐾 伙伴管理</h2>";
    if (petInventory.length === 0) {
        html += "<p style='color:#aaa;'>你还没有伙伴，去抽奖看看吧！</p>";
    } else {
        html += "<div style='display:flex;gap:10px;flex-wrap:wrap;margin:15px 0;'>";
        petInventory.forEach(function(p) {
            var isActive = player.pet && player.pet.id === p.id;
            var color = p.rarity === 'legend' ? '#ff6d36' : p.rarity === 'epic' ? '#a855f7' : p.rarity === 'rare' ? '#3b82f6' : '#6b7280';
            html += "<div onclick='selectPet(\"" + p.id + "\")' style='padding:12px;background:#333;border-radius:8px;cursor:pointer;border:2px solid " + (isActive ? '#4ade80' : color) + ";text-align:center;min-width:90px;'>";
            html += "<div style='font-size:28px;'>" + p.sprite + "</div>";
            html += "<div style='color:#fff;font-size:12px;'>" + p.name + "</div>";
            html += "<div style='color:#aaa;font-size:10px;'>x" + p.count + "</div>";
            html += "<div style='font-size:10px;color:" + color + ";'>" + (isActive ? '战斗中' : '点击参战') + "</div>";
            html += "</div>";
        });
        html += "</div>";
    }
    if (player.pet) {
        html += "<div style='margin-top:15px;padding:12px;background:#444;border-radius:8px;'>";
        html += "<div style='display:flex;align-items:center;gap:15px;'>";
        html += "<div style='font-size:40px;'>" + player.pet.sprite + "</div>";
        html += "<div>";
        html += "<div style='font-size:16px;color:#ff6d36;'>" + player.pet.name + " (出战)</div>";
        html += "<div style='font-size:12px;color:#aaa;'>攻击:" + player.pet.atk + " | 血量:" + player.pet.hp + " | 防御:" + player.pet.def + "</div>";
        var petData = pets.find(function(p) { return p.id === player.pet.id; });
        if (petData && petData.evolveReq) {
            var currentKills = petKillCount[player.pet.id] || 0;
            var reqKills = petData.evolveReq.kills;
            var nextPet = pets.find(function(p) { return p.id === petData.evolveReq.petId; });
            html += "<div style='font-size:11px;color:#fbbf24;margin-top:4px;'>进化进度: " + currentKills + "/" + reqKills + " (下阶段: " + nextPet.name + ")</div>";
            html += "<div style='width:120px;height:6px;background:#333;border-radius:3px;margin-top:4px;'><div style='width:" + (currentKills/reqKills*100) + "%;height:100%;background:linear-gradient(90deg,#f59e0b,#ff6d36);border-radius:3px;'></div></div>";
        } else if (petData && !petData.evolveReq) {
            html += "<div style='font-size:11px;color:#4ade80;margin-top:4px;'>已到达最终进化形态！</div>";
        }
        html += "</div>";
        html += "</div>";
        html += "</div>";
    }
    html += "<div style='margin-top:15px;'><button onclick='openPetGacha()' style='background:#7c3aed;'>🎰 宠物抽奖</button></div>";
    html += "<button onclick='closeModal()' style='margin-top:15px;'>关闭</button>";
    content.innerHTML = html;
}

function selectPet(petId) {
    var pet = petInventory.find(function(p) { return p.id === petId; });
    if (!pet) return;
    player.pet = { id: pet.id, name: pet.name, sprite: pet.sprite, atk: pet.atk, hp: pet.hp, def: pet.def };
    addLog("🐾 " + pet.name + " 成为你的伙伴！");
    openPetManagement();
    updateUI();
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
            petInventory: petInventory,
            petKillCount: petKillCount,
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
    document.getElementById('speed').textContent = getTotalSpeed();

    var spDisplay = document.getElementById('skillPointsDisplay');
    if (player.skillPoints > 0) {
        spDisplay.style.display = 'inline';
        document.getElementById('skillPoints').textContent = player.skillPoints;
    } else {
        spDisplay.style.display = 'none';
    }

    var petDisplay = document.getElementById('petDisplay');
    if (player.pet) {
        petDisplay.style.display = 'inline';
        document.getElementById('petName').textContent = player.pet.name;
    } else {
        petDisplay.style.display = 'none';
    }

    var titleDisplay = document.getElementById('titleDisplay');
    if (player.titles && player.titles.length > 0) {
        titleDisplay.style.display = 'block';
        titleDisplay.textContent = '🎖️ ' + player.titles[player.titles.length - 1];
    } else {
        titleDisplay.style.display = 'none';
    }

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
    document.getElementById('mSpeed').textContent = nowMonster.speed || 0;
    document.getElementById('monsterSprite').textContent = nowMonster.sprite || '👹';

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